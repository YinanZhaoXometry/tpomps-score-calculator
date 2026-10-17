import { verifyUid } from '../../_lib/auth';
import type { Env } from '../../_lib/env';
import { errorJson, json } from '../../_lib/http';

export const onRequestDelete: PagesFunction<Env> = async ({
  request,
  env,
  params,
}) => {
  const uid = await verifyUid(request, env);
  if (!uid) return errorJson(401, '尚未登入，請重新登入後再試');

  const id = params.id;
  if (typeof id !== 'string' || id.length === 0) {
    return errorJson(400, '無效的記錄 ID');
  }

  const result = await env.DB.prepare(
    'DELETE FROM history_entries WHERE id = ? AND user_id = ?',
  )
    .bind(id, uid)
    .run();

  if ((result.meta.changes ?? 0) === 0) {
    return errorJson(404, '找不到此記錄，可能已被刪除');
  }
  return json({ ok: true });
};
