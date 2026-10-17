import { subjectData } from '../../src/lib/subject-data';

const TOTAL_MAX = subjectData.reduce((sum, s) => sum + s.weight * 100, 0);

// 加權平均 = Σ(原始分 × 權重) / 總滿分 × 100，與前端 ResultPanel 的算法一致。
export function computeAverage(scores: Record<string, number>): number {
  let totalWeighted = 0;
  for (const s of subjectData) {
    const raw = scores[s.id];
    if (typeof raw === 'number') totalWeighted += raw * s.weight;
  }
  return (totalWeighted / TOTAL_MAX) * 100;
}

// 驗證來自用戶端或 AI 回應的分數物件：鍵必須是已知科目 id，值為 0-100 的有限數字；
// null（AI 表示圖片中沒有該科目）予以略過。格式無效時回傳 null。
export function parseScores(raw: unknown): Record<string, number> | null {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return null;
  const scores: Record<string, number> = {};
  for (const [id, value] of Object.entries(raw)) {
    if (!subjectData.some((s) => s.id === id)) return null;
    if (value === null) continue;
    const num = Number(value);
    if (!Number.isFinite(num) || num < 0 || num > 100) return null;
    scores[id] = num;
  }
  return scores;
}
