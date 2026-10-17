import {
  OAUTH_STATE_COOKIE,
  SESSION_COOKIE,
  cookieClear,
  createSession,
  deleteSession,
  getCookie,
  getSessionUid,
  serializeCookie,
  verifyGoogleIdToken,
} from '../_lib/auth';
import type { Env } from '../_lib/env';
import { json } from '../_lib/http';

interface RouteContext {
  request: Request;
  env: Env;
}

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const OAUTH_STATE_TTL_SECONDS = 600;

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

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(value),
  );
  let binary = '';
  for (const b of new Uint8Array(digest)) binary += String.fromCharCode(b);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function isSecureRequest(request: Request): boolean {
  return new URL(request.url).protocol === 'https:';
}

// wrangler.toml 中的 TODO_ 佔位符視為未設定
function oauthConfigured(env: Env): boolean {
  return Boolean(
    env.GOOGLE_CLIENT_ID &&
      !env.GOOGLE_CLIENT_ID.startsWith('TODO_') &&
      env.GOOGLE_CLIENT_SECRET,
  );
}

// 登入失敗一律導回首頁，由前端以 ?auth_error=<code> 顯示訊息。
function redirectToAppWithError(code: string): Response {
  return new Response(null, {
    status: 302,
    headers: { location: `/?auth_error=${encodeURIComponent(code)}` },
  });
}

function withCookie(response: Response, cookie: string): Response {
  const merged = new Response(response.body, response);
  merged.headers.append('set-cookie', cookie);
  return merged;
}

// ---------- GET /api/auth/login：產生 state + PKCE，導向 Google ----------
export async function login({ request, env }: RouteContext): Promise<Response> {
  const secure = isSecureRequest(request);
  if (!oauthConfigured(env)) {
    return redirectToAppWithError('not_configured');
  }

  const state = randomToken();
  const verifier = randomToken(48);
  const challenge = await sha256Base64Url(verifier);

  const authUrl = new URL(GOOGLE_AUTH_URL);
  authUrl.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  authUrl.searchParams.set(
    'redirect_uri',
    `${new URL(request.url).origin}/api/auth/callback`,
  );
  authUrl.searchParams.set('response_type', 'code');
  authUrl.searchParams.set('scope', 'openid email profile');
  authUrl.searchParams.set('state', state);
  authUrl.searchParams.set('code_challenge', challenge);
  authUrl.searchParams.set('code_challenge_method', 'S256');
  authUrl.searchParams.set('prompt', 'select_account');

  return new Response(null, {
    status: 302,
    headers: {
      location: authUrl.toString(),
      'set-cookie': serializeCookie(
        OAUTH_STATE_COOKIE,
        JSON.stringify({ state, verifier }),
        { maxAgeSeconds: OAUTH_STATE_TTL_SECONDS, secure },
      ),
    },
  });
}

// ---------- GET /api/auth/callback：驗證 state、交換 code、建立 session ----------
export async function callback({
  request,
  env,
}: RouteContext): Promise<Response> {
  const secure = isSecureRequest(request);
  const url = new URL(request.url);
  const clearStateCookie = cookieClear(OAUTH_STATE_COOKIE, secure);

  if (url.searchParams.get('error')) {
    // 使用者在 Google 頁面取消登入
    return withCookie(redirectToAppWithError('cancelled'), clearStateCookie);
  }

  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  let stored: { state?: string; verifier?: string } | null = null;
  try {
    stored = JSON.parse(getCookie(request, OAUTH_STATE_COOKIE) ?? 'null');
  } catch {
    stored = null;
  }
  if (
    !code ||
    !state ||
    !stored?.state ||
    !stored.verifier ||
    stored.state !== state
  ) {
    return withCookie(
      redirectToAppWithError('invalid_state'),
      clearStateCookie,
    );
  }

  let tokenRes: Response;
  try {
    tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${url.origin}/api/auth/callback`,
        code_verifier: stored.verifier,
      }),
    });
  } catch {
    return withCookie(
      redirectToAppWithError('exchange_failed'),
      clearStateCookie,
    );
  }
  if (!tokenRes.ok) {
    return withCookie(
      redirectToAppWithError('exchange_failed'),
      clearStateCookie,
    );
  }

  const tokens = (await tokenRes.json().catch(() => null)) as {
    id_token?: string;
  } | null;
  if (!tokens?.id_token) {
    return withCookie(redirectToAppWithError('verify_failed'), clearStateCookie);
  }

  const identity = await verifyGoogleIdToken(tokens.id_token, env);
  if (!identity) {
    return withCookie(redirectToAppWithError('verify_failed'), clearStateCookie);
  }

  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO users (id, email, name, picture, created_at, last_login_at)
     VALUES (?, ?, ?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET email = excluded.email, name = excluded.name,
       picture = excluded.picture, last_login_at = excluded.last_login_at`,
  )
    .bind(identity.sub, identity.email, identity.name, identity.picture, now, now)
    .run();

  const sessionResponse = await createSession(env, identity.sub, secure);
  return withCookie(sessionResponse, clearStateCookie);
}

// ---------- GET /api/auth/me：目前登入狀態 ----------
export async function me({ request, env }: RouteContext): Promise<Response> {
  const uid = await getSessionUid(request, env);
  let user: { uid: string; name: string | null; email: string | null } | null =
    null;
  if (uid) {
    const row = await env.DB.prepare(
      'SELECT id, name, email FROM users WHERE id = ?',
    )
      .bind(uid)
      .first<{ id: string; name: string | null; email: string | null }>();
    if (row) user = { uid: row.id, name: row.name, email: row.email };
  }
  return json({
    user,
    configured: oauthConfigured(env),
  });
}

// ---------- POST /api/auth/logout ----------
export async function logout({ request, env }: RouteContext): Promise<Response> {
  await deleteSession(request, env);
  return withCookie(
    json({ ok: true }),
    cookieClear(SESSION_COOKIE, isSecureRequest(request)),
  );
}
