import { verifyUid } from '../_lib/auth';
import type { Env } from '../_lib/env';
import { errorJson, json } from '../_lib/http';
import { parseScores } from '../_lib/scores';
import { subjectData } from '../../src/lib/subject-data';

// dataURL 字元數上限（約 6MB 的 base64 圖片）
const MAX_IMAGE_CHARS = 8_000_000;

const subjectList = subjectData
  .map((s) => `- ${s.id}: ${s.name} / ${s.nameEn}`)
  .join('\n');

const prompt = `請從圖片中的香港小學生成績表，找出以下科目的分數（0 至 100 的百分制分數）。

科目清單：
${subjectList}

規則：
1. 只報告圖片中確實出現的分數；找不到的科目填 null。
2. 科目可能以中文名或英文名標示，兩者都要對應到上表的 id。
3. 只輸出 JSON，格式為 {"scores": {"<科目id>": <分數或 null>}}，涵蓋所有列出的科目，不要輸出任何其他文字。`;

// 模型有時會包一層 ```json 圍籬或夾雜說明文字，取第一個 { 到最後一個 } 再解析。
function extractJson(content: unknown): unknown {
  if (typeof content !== 'string') return null;
  const withoutFences = content.replace(/```[a-z]*\s*([\s\S]*?)```/gi, '$1');
  const start = withoutFences.indexOf('{');
  const end = withoutFences.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(withoutFences.slice(start, end + 1));
  } catch {
    return null;
  }
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const uid = await verifyUid(request, env);
  if (!uid) return errorJson(401, '尚未登入，請重新登入後再試');
  if (!env.AI_BASE_URL || !env.AI_MODEL || !env.AI_API_KEY) {
    return errorJson(503, '尚未設定 AI 辨識服務，請聯絡管理員');
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, '請求格式錯誤');
  }
  const image = (body as { image?: unknown } | null)?.image;
  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    return errorJson(400, '缺少圖片資料');
  }
  if (image.length > MAX_IMAGE_CHARS) {
    return errorJson(413, '圖片太大，請重新拍攝或選擇較小的圖片');
  }

  let aiRes: Response;
  try {
    aiRes = await fetch(
      `${env.AI_BASE_URL.replace(/\/+$/, '')}/chat/completions`,
      {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${env.AI_API_KEY}`,
        },
        body: JSON.stringify({
          model: env.AI_MODEL,
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: '你是一個讀取香港小學生成績表的助手，只會輸出 JSON。',
            },
            {
              role: 'user',
              content: [
                { type: 'image_url', image_url: { url: image } },
                { type: 'text', text: prompt },
              ],
            },
          ],
        }),
      },
    );
  } catch {
    return errorJson(502, '無法連線 AI 辨識服務，請稍後再試');
  }
  if (!aiRes.ok) return errorJson(502, 'AI 辨識服務暫時無法使用，請稍後再試');

  let aiJson: unknown;
  try {
    aiJson = await aiRes.json();
  } catch {
    return errorJson(502, 'AI 辨識服務回應異常，請稍後再試');
  }
  const content = (
    aiJson as { choices?: Array<{ message?: { content?: unknown } }> }
  ).choices?.[0]?.message?.content;

  const parsed = extractJson(content) as { scores?: unknown } | null;
  const scores = parsed ? parseScores(parsed.scores) : null;
  if (!scores || Object.keys(scores).length === 0) {
    return errorJson(422, '無法從圖片辨識成績，請使用更清晰的照片');
  }
  return json({ scores });
};
