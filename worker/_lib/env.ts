export interface Env {
  DB: D1Database;
  /** 靜態資產綁定（wrangler.toml [assets] binding），SPA fallback 由平台處理 */
  ASSETS: Fetcher;
  /** Firebase 專案 ID，用於驗證 ID token 的 issuer／audience */
  FIREBASE_PROJECT_ID: string;
  /** OpenAI 相容 API base URL，例如 https://api.openai.com/v1 */
  AI_BASE_URL: string;
  /** OpenAI 相容視覺模型名稱 */
  AI_MODEL: string;
  /** API 密鑰（部署為 Worker secret；本機開發放在 .dev.vars） */
  AI_API_KEY: string;
}
