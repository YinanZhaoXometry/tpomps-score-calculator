import { getSessionUid } from './_lib/auth';
import type { Env } from './_lib/env';
import { errorJson } from './_lib/http';
import { callback, login, logout, me } from './routes/auth';
import { createHistory, deleteHistory, listHistory } from './routes/history';
import { recognizeScores } from './routes/ocr';

interface RouteContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

type RouteHandler = (ctx: RouteContext) => Promise<Response>;

// /api/auth/* 為公開端點；其餘 /api/* 需要 session；
// 非 /api 路徑交給靜態資產（SPA fallback 由 assets.not_found_handling 處理）。
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (!pathname.startsWith('/api/')) {
      return env.ASSETS.fetch(request);
    }

    if (pathname.startsWith('/api/auth/')) {
      return handleAuthRoute(pathname, request.method, { request, env, params: {} });
    }

    // cookie session 由瀏覽器同源自動帶入；SameSite=Lax 已擋跨站 POST，
    // 有 Origin 標頭時再明確比對一次（CSRF 防護）。
    if (request.method !== 'GET' && !isSameOrigin(request)) {
      return errorJson(403, '拒絕跨站請求');
    }

    const uid = await getSessionUid(request, env);
    if (!uid) return errorJson(401, '尚未登入，請重新登入後再試');

    const handler = matchRoute(pathname, request.method);
    if (!handler) return errorJson(404, '找不到此 API 路徑');
    return handler({ request, env, params: routeParams(pathname) });
  },
} satisfies ExportedHandler<Env>;

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).host === new URL(request.url).host;
  } catch {
    return false;
  }
}

function handleAuthRoute(
  pathname: string,
  method: string,
  ctx: RouteContext,
): Promise<Response> {
  if (pathname === '/api/auth/login' && method === 'GET') return login(ctx);
  if (pathname === '/api/auth/callback' && method === 'GET') return callback(ctx);
  if (pathname === '/api/auth/me' && method === 'GET') return me(ctx);
  if (pathname === '/api/auth/logout' && method === 'POST') return logout(ctx);
  return Promise.resolve(errorJson(404, '找不到此 API 路徑'));
}

function matchRoute(pathname: string, method: string): RouteHandler | null {
  if (pathname === '/api/history') {
    if (method === 'GET') return listHistory;
    if (method === 'POST') return createHistory;
    return null;
  }
  if (pathname === '/api/ocr') {
    if (method === 'POST') return recognizeScores;
    return null;
  }
  if (/^\/api\/history\/[^/]+$/.test(pathname) && method === 'DELETE') {
    return deleteHistory;
  }
  return null;
}

function routeParams(pathname: string): Record<string, string> {
  const match = pathname.match(/^\/api\/history\/([^/]+)$/);
  return match ? { id: decodeURIComponent(match[1]) } : {};
}
