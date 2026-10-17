import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Env } from './env';

// Google 以 JWK 格式發布 Firebase ID token 的簽章公鑰；jose 會快取於記憶體中。
let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJwks() {
  jwks ??= createRemoteJWKSet(
    new URL(
      'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com',
    ),
  );
  return jwks;
}

// 驗證請求的 Firebase ID token（Authorization: Bearer …），成功回傳使用者 uid，
// 未附 token 或驗證失敗一律回傳 null，由呼叫端回應 401。
export async function verifyUid(
  request: Request,
  env: Env,
): Promise<string | null> {
  const header = request.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice(7).trim();
  if (!token || !env.FIREBASE_PROJECT_ID) return null;
  try {
    const { payload } = await jwtVerify(token, getJwks(), {
      algorithms: ['RS256'],
      issuer: `https://securetoken.google.com/${env.FIREBASE_PROJECT_ID}`,
      audience: env.FIREBASE_PROJECT_ID,
    });
    return typeof payload.sub === 'string' && payload.sub.length > 0
      ? payload.sub
      : null;
  } catch {
    return null;
  }
}
