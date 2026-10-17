# TPOMPS 成績計算器

香港小學（TPOMPS）各科成績加權平均計算器。輸入各科百分制成績（0–100），自動計算加權總分、加權平均與等第；可拍攝成績表照片由 AI 自動辨識填入，並將計算結果儲存為雲端歷史記錄。

成績草稿以使用者為單位儲存於本機瀏覽器；歷史記錄儲存於 Cloudflare D1，跨裝置同步。

## 開發

```bash
pnpm install
pnpm dev        # 前端開發伺服器（不含後端 API）
pnpm dev:full   # 建置後以 wrangler dev 執行完整前後端（含 D1 本機資料庫）
pnpm build      # 型別檢查（前端 + worker）+ 打包
pnpm lint       # oxlint
pnpm preview    # 預覽打包結果
```

`pnpm dev:full` 執行於 http://localhost:8787，會讀取 `.dev.vars`（密鑰）、`wrangler.toml` 的 `[vars]` 與本機 D1（`.wrangler/state`，需先執行 `pnpm db:migrate:local`）。

## Google 登入（自管 OAuth）

應用程式以 Google OAuth 2.0（Authorization Code + PKCE）登入，不依賴 Firebase：登入由後端 `worker/routes/auth.ts` 處理，成功後核發自管 session（HttpOnly cookie，內容為 D1 `sessions` 資料表中的隨機 token 雜湊），效期約 6 個月，由伺服器強制。使用者識別碼採 Google 帳號的 `sub`，與歷史記錄的 `user_id` 一致。

設定步驟（Google Cloud Console）：

1. 建立專案 → **APIs & Services → OAuth consent screen**：User Type 選 External，發布狀態保持在 Testing，並把自己的帳號加入 Test users。
2. **APIs & Services → Credentials → Create credentials → OAuth client ID**，Application type 選 Web application，Authorized redirect URIs 加入：
   - `https://tpomps-score-calculator.<你的子網域>.workers.dev/api/auth/callback`
   - `http://localhost:8787/api/auth/callback`（本機開發）
3. 把 Client ID 填入 `wrangler.toml` 的 `GOOGLE_CLIENT_ID`；Client Secret 以密鑰設定（見下方）。
4. 本機開發：把兩個值分別填入 `wrangler.toml` 與 `.dev.vars`。

## 資料庫與歷史記錄（Cloudflare D1）

歷史記錄儲存在 D1（`history_entries` 資料表），每筆記錄屬於一位登入使用者；API（`worker/routes/`）會驗證 session cookie 後才讀寫。

首次設定：

1. `npx wrangler d1 create tpomps-history`，把回傳的 `database_id` 填入 `wrangler.toml`。
2. `pnpm db:migrate:remote` 建立遠端資料表（本機開發用 `pnpm db:migrate:local`）。

## AI 成績表照片辨識

「上載圖片」按鈕會把照片送到 OpenAI 相容的視覺模型辨識各科分數並自動填入表單。呼叫由後端（`worker/routes/ocr.ts`）代理，API 密鑰不會進到瀏覽器。

設定：在 `wrangler.toml` 的 `[vars]` 填入

- `AI_BASE_URL`：OpenAI 相容 API 的 base URL（例如 `https://api.openai.com/v1`）
- `AI_MODEL`：支援圖片輸入的模型名稱

密鑰（Worker secrets，擇一方式設定）：

- 在 GitHub repo secrets 加入 `GOOGLE_CLIENT_SECRET` 與 `AI_API_KEY`，CI 會在每次部署時自動同步；或
- 本機手動執行一次 `pnpm exec wrangler secret put <名稱>`，或在 Cloudflare dashboard（Worker → Settings → Variables and Secrets）新增

本機開發：複製 `.dev.vars.example` 為 `.dev.vars` 並填入 `GOOGLE_CLIENT_SECRET` 與 `AI_API_KEY`。

## 部署

部署目標是 **Cloudflare Worker（含靜態資產）**。推送至 `main` 分支時，GitHub Actions 會自動建置並執行 `wrangler deploy`（見 `.github/workflows/deploy.yml`）；Cloudflare dashboard 的 Workers Builds 若也連結了此 repo，會重複部署，建議擇一。部署設定（D1 綁定、`[vars]`、靜態資產）來自 `wrangler.toml`。

需要的 GitHub repo secrets：

| Secret | 用途 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 部署（需 Workers Scripts 編輯 + D1 編輯權限） |
| `CLOUDFLARE_ACCOUNT_ID` | 部署 |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret（同步為 Worker secret） |
| `AI_API_KEY` | AI 辨識服務密鑰（同步為 Worker secret，可選） |
