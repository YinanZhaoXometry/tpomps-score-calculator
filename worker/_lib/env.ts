export interface Env {
  DB: D1Database;
  /** 靜態資產綁定（wrangler.toml [assets] binding），SPA fallback 由平台處理 */
  ASSETS: Fetcher;
  /** Google OAuth client（非密鑰，wrangler.toml [vars]） */
  GOOGLE_CLIENT_ID: string;
  /** Google OAuth client secret（Worker secret；本機放 .dev.vars） */
  GOOGLE_CLIENT_SECRET: string;
  /** OpenAI 相容 API base URL，例如 https://api.openai.com/v1 */
  AI_BASE_URL: string;
  /** OpenAI 相容視覺模型名稱 */
  AI_MODEL: string;
  /** API 密鑰（部署為 Worker secret；本機開發放在 .dev.vars） */
  AI_API_KEY: string;
}
