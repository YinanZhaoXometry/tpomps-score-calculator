import { verifyUid } from '../../_lib/auth';
import type { Env } from '../../_lib/env';
import { errorJson, json } from '../../_lib/http';
import { computeAverage, parseScores } from '../../_lib/scores';

interface HistoryRow {
  id: string;
  created_at: number;
  scores: string;
  average: number;
}

interface HistoryEntryDto {
  id: string;
  createdAt: number;
  scores: Record<string, number>;
  average: number;
}

function toDto(row: HistoryRow): HistoryEntryDto {
  let scores: Record<string, number> = {};
  try {
    scores = JSON.parse(row.scores) as Record<string, number>;
  } catch {
    // 單筆資料損毀時視為空分數，不讓整個列表失敗
  }
  return { id: row.id, createdAt: row.created_at, scores, average: row.average };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const uid = await verifyUid(request, env);
  if (!uid) return errorJson(401, '尚未登入，請重新登入後再試');

  const { results } = await env.DB.prepare(
    'SELECT id, created_at, scores, average FROM history_entries WHERE user_id = ? ORDER BY created_at DESC LIMIT 200',
  )
    .bind(uid)
    .all<HistoryRow>();

  return json({ entries: (results ?? []).map(toDto) });
};

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const uid = await verifyUid(request, env);
  if (!uid) return errorJson(401, '尚未登入，請重新登入後再試');

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, '請求格式錯誤');
  }
  const scores = parseScores((body as { scores?: unknown } | null)?.scores);
  if (!scores) return errorJson(400, '分數格式錯誤，必須是 0-100 的數字');
  if (Object.keys(scores).length === 0) {
    return errorJson(400, '請至少輸入一科成績');
  }

  const id = crypto.randomUUID();
  const createdAt = Date.now();
  const average = computeAverage(scores);

  await env.DB.prepare(
    'INSERT INTO history_entries (id, user_id, created_at, scores, average) VALUES (?, ?, ?, ?, ?)',
  )
    .bind(id, uid, createdAt, JSON.stringify(scores), average)
    .run();

  return json({ entry: { id, createdAt, scores, average } }, 201);
};
