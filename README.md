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

## Google 登入（Firebase）

應用程式以 Firebase Authentication 的 Google 登入保護，登入狀態約 6 個月後過期（以使用者為單位，一部裝置上的多個帳戶各自獨立計算），屆時需重新登入。

設定步驟：

1. 前往 [Firebase console](https://console.firebase.google.com/) 建立專案，並在 **Authentication → Sign-in method** 啟用 **Google** 供應商。
2. 在 **Authentication → Settings → Authorized domains** 新增部署網域（例如 `tpomps-score-calculator.pages.dev`）；`localhost` 預設已授權。
3. 複製 `.env.example` 為 `.env.local`，填入 **專案設定 → 一般 → 你的應用程式（Web app）** 的 SDK 設定值。
4. 部署時需在 GitHub repo secrets 設定相同的六個 `VITE_FIREBASE_*` 環境變數（見下方部署一節），否則線上版本會顯示「尚未設定 Firebase」。另需在 Firebase 的 Authorized domains 加入部署網域（例如 `tpomps-score-calculator.<你的子網域>.workers.dev`）。

## 資料庫與歷史記錄（Cloudflare D1）

歷史記錄儲存在 D1（`history_entries` 資料表），每筆記錄屬於一位 Firebase 使用者；API（`worker/routes/`）會驗證 Firebase ID token 後才讀寫。

首次設定：

1. `npx wrangler d1 create tpomps-history`，把回傳的 `database_id` 填入 `wrangler.toml`。
2. `pnpm db:migrate:remote` 建立遠端資料表（本機開發用 `pnpm db:migrate:local`）。

## AI 成績表照片辨識

「上載圖片」按鈕會把照片送到 OpenAI 相容的視覺模型辨識各科分數並自動填入表單。呼叫由後端（`worker/routes/ocr.ts`）代理，API 密鑰不會進到瀏覽器。

設定：在 `wrangler.toml` 的 `[vars]` 填入

- `FIREBASE_PROJECT_ID`：與 `VITE_FIREBASE_PROJECT_ID` 相同
- `AI_BASE_URL`：OpenAI 相容 API 的 base URL（例如 `https://api.openai.com/v1`）
- `AI_MODEL`：支援圖片輸入的模型名稱

密鑰 `AI_API_KEY` 設為 Worker secret（擇一）：

- 在 GitHub repo secrets 加入 `AI_API_KEY`，CI 會在每次部署時自動同步；或
- 本機手動執行一次 `pnpm exec wrangler secret put AI_API_KEY`，或在 Cloudflare dashboard（Worker → Settings → Variables and Secrets）新增

本機開發：複製 `.dev.vars.example` 為 `.dev.vars` 並填入 `AI_API_KEY`。

## 部署

部署目標是 **Cloudflare Worker（含靜態資產）**。推送至 `main` 分支時，GitHub Actions 會自動建置並執行 `wrangler deploy`（見 `.github/workflows/deploy.yml`）；Cloudflare dashboard 的 Workers Builds 若也連結了此 repo，會重複部署，建議擇一。部署設定（D1 綁定、`[vars]`、靜態資產）來自 `wrangler.toml`。

需要的 GitHub repo secrets：

| Secret | 用途 |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | 部署（需 Workers Scripts 編輯 + D1 編輯權限） |
| `CLOUDFLARE_ACCOUNT_ID` | 部署 |
| `VITE_FIREBASE_*`（六個） | 前端 Firebase 設定 |
| `AI_API_KEY` | AI 辨識服務密鑰（同步為 Worker secret，可選） |

若改用 dashboard 的 Workers Builds 部署，需在其 Build 設定中加入同樣的六個 `VITE_FIREBASE_*` build 環境變數（GitHub repo secrets 不會自動套用）。
