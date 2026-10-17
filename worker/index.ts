import type { Env } from './_lib/env';
import { errorJson } from './_lib/http';
import { createHistory, deleteHistory, listHistory } from './routes/history';
import { recognizeScores } from './routes/ocr';

interface RouteContext {
  request: Request;
  env: Env;
  params: Record<string, string>;
}

type RouteHandler = (ctx: RouteContext) => Promise<Response>;

// /api/* 由 Worker 處理（見 wrangler.toml 的 assets.run_worker_first），
// 其餘路徑交給靜態資產（SPA fallback 由 assets.not_found_handling 處理）。
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url);
    if (pathname.startsWith('/api/')) {
      const handler = matchRoute(pathname, request.method);
      if (!handler) return errorJson(404, '找不到此 API 路徑');
      return handler({ request, env, params: routeParams(pathname) });
    }
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;

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
