import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Env } from './env';

// Session 有效期，與 Firebase 時代相同（約 6 個月），改為伺服器端強制。
export const SESSION_TTL_MS = 183 * 24 * 60 * 60 * 1000;

export const SESSION_COOKIE = 'tpomps_session';
export const OAUTH_STATE_COOKIE = 'tpomps_oauth';

// ---------- Cookie 小工具 ----------

export function getCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

export function serializeCookie(
  name: string,
  value: string,
  options: { maxAgeSeconds: number; secure: boolean; path?: string },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    `Path=${options.path ?? '/'}`,
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${options.maxAgeSeconds}`,
  ];
  if (options.secure) parts.push('Secure');
  return parts.join('; ');
}

function cookieClear(name: string, secure: boolean): string {
  return serializeCookie(name, '', { maxAgeSeconds: 0, secure });
}

export { cookieClear };

// ---------- Token 雜湊 ----------

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  let binary = '';
  for (const b of buf) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// ---------- Session ----------

export async function createSession(
  env: Env,
  userId: string,
  secure: boolean,
): Promise<Response> {
  const token = randomToken();
  const tokenHash = await sha256Hex(token);
  const now = Date.now();
  await env.DB.prepare(
    'INSERT INTO sessions (token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)',
  )
    .bind(tokenHash, userId, now, now + SESSION_TTL_MS)
    .run();
  return new Response(null, {
    status: 302,
    headers: {
      location: '/',
      'set-cookie': serializeCookie(SESSION_COOKIE, token, {
        maxAgeSeconds: Math.floor(SESSION_TTL_MS / 1000),
        secure,
      }),
    },
  });
}

// 讀取 session cookie 並向 D1 驗證；過期即刪除。回傳 user id 或 null。
export async function getSessionUid(
  request: Request,
  env: Env,
): Promise<string | null> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return null;
  const tokenHash = await sha256Hex(token);
  const row = await env.DB.prepare(
    'SELECT user_id, expires_at FROM sessions WHERE token_hash = ?',
  )
    .bind(tokenHash)
    .first<{ user_id: string; expires_at: number }>();
  if (!row) return null;
  if (Date.now() > row.expires_at) {
    await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
      .bind(tokenHash)
      .run();
    return null;
  }
  return row.user_id;
}

export async function deleteSession(request: Request, env: Env): Promise<void> {
  const token = getCookie(request, SESSION_COOKIE);
  if (!token) return;
  const tokenHash = await sha256Hex(token);
  await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?')
    .bind(tokenHash)
    .run();
}

// ---------- Google id_token 驗證 ----------

let googleJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getGoogleJwks() {
  googleJwks ??= createRemoteJWKSet(
    new URL('https://www.googleapis.com/oauth2/v3/certs'),
  );
  return googleJwks;
}

export interface GoogleIdentity {
  sub: string;
  email: string | null;
  name: string | null;
  picture: string | null;
}

// 驗證 OAuth code exchange 換得的 Google id_token（簽章 + issuer + audience），
// 取出稳定的帳號識別 sub（同時作為 users.id 與歷史記錄的 user_id）。
export async function verifyGoogleIdToken(
  idToken: string,
  env: Env,
): Promise<GoogleIdentity | null> {
  if (!env.GOOGLE_CLIENT_ID) return null;
  try {
    const { payload } = await jwtVerify(idToken, getGoogleJwks(), {
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
      audience: env.GOOGLE_CLIENT_ID,
    });
    if (typeof payload.sub !== 'string' || payload.sub.length === 0) return null;
    return {
      sub: payload.sub,
      email: typeof payload.email === 'string' ? payload.email : null,
      name: typeof payload.name === 'string' ? payload.name : null,
      picture: typeof payload.picture === 'string' ? payload.picture : null,
    };
  } catch {
    return null;
  }
}
