# AGENTS.md

## Project Overview

TPOMPS Score Calculator (TPOMPS 成績計算器) — a Traditional Chinese (zh-Hant) React SPA plus a Cloudflare Worker backend (with static assets) that computes weighted average scores for Hong Kong primary school subjects. Built with Vite 8 + React 19 + TypeScript 6 + Tailwind CSS v4. Package manager is **pnpm**. Deploys as a Cloudflare Worker via GitHub Actions on every push to `main` (`.github/workflows/deploy.yml`); server config lives in `wrangler.toml` (`main = "worker/index.ts"`, `[assets]` SPA, D1 binding, `[vars]`). Umami analytics is loaded from a script tag in `index.html`.

## Commands

```bash
pnpm dev             # Vite dev server (frontend only, no /api backend)
pnpm dev:full        # vite build + wrangler dev — full stack on :8787 with local D1
pnpm build           # typecheck (tsc -b for src, tsc -p tsconfig.worker.json for worker/) + vite build
pnpm lint            # oxlint
pnpm preview         # serve the built dist/
pnpm db:migrate:local   # apply migrations/0001_init.sql to the local D1 sqlite
pnpm db:migrate:remote  # apply migrations to the remote D1 database
```

No test framework is configured.

## Authentication

Google sign-in via Firebase Auth gates the entire app: `App.tsx` renders `MainPage` when a user exists, otherwise `LoginPage` (with a brief loading splash while auth state resolves — no router, just conditional rendering). Config comes from `VITE_FIREBASE_*` env vars (see `.env.example`); when they're missing `auth` is null and `LoginPage` shows a setup hint instead of crashing. The 6-month session expiry is enforced locally, not by Firebase: login time is stored in localStorage under `tpomps-login-time:{uid}` (per user), and `useAuthSession` signs the user out on load when that timestamp is older than `SESSION_DURATION_MS` in `src/lib/firebase.ts` (183 days). A Firebase user with no stored login time is treated as expired. Deployed domains must be added to Firebase → Authentication → Authorized domains.

The backend verifies Firebase ID tokens itself: `worker/_lib/auth.ts` uses `jose` against Google's JWK endpoint, with issuer/audience = `FIREBASE_PROJECT_ID` (a `[vars]` entry in `wrangler.toml`, same value as `VITE_FIREBASE_PROJECT_ID`). `src/lib/api.ts` attaches `Authorization: Bearer <getIdToken()>` and retries once with `forceRefresh` on 401. The deployed domain (`tpomps-score-calculator.<subdomain>.workers.dev`) must be in Firebase → Authorized domains.

## Architecture

Small, flat structure — data flows one way: `useFormCache` → `App`/`MainPage` → `ScoreForm` / `ResultPanel` / `HistoryPage`.

- `src/lib/subject-data.ts` — **single source of domain truth**: 12 subjects with `id`, Chinese/English `name`, `weight`, `category` (pure data, no imports — shared by frontend and `functions/`). To change subjects/weights, edit this file only.
- `src/lib/subjects.ts` — layers browser-only concerns on top of subject-data: lucide `icon` per id, `maxScore` (= weight × 100), derived `TOTAL_WEIGHT` (39) / `TOTAL_MAX` (3900), `categoryLabels`/`categoryColors`.
- `src/hooks/useFormCache.ts` — per-user draft persistence in localStorage under `tpomps-scores:{uid}` (debounced 300 ms; one-time migration adopts the legacy pre-auth `tpomps-scores` key). All storage errors silently swallowed.
- `src/components/ScoreForm.tsx` — grouped subject inputs; `forwardRef` exposing `focusNextEmpty()`. Input validation lives in `handleChange`: silently rejects NaN and values outside 0–100 — keep that invariant.
- `src/components/ResultPanel.tsx` — weighted average = Σ(raw × weight) / TOTAL_MAX × 100, SVG grade ring, 「儲存記錄」 button (parent performs the API save via `onSaveHistory`).
- `src/components/ScoreDetailTable.tsx` — the per-subject detail table, shared by `ResultPanel` and `HistoryPage` (pass `embedded` inside another card).
- `src/components/HistoryPage.tsx` — cloud history list (date via `Intl.DateTimeFormat("zh-Hant")`, average + grade), expand → detail table + 「載入到計算機」 + two-step 「刪除」 confirm.
- `src/components/Toast.tsx` + `src/hooks/useToast.ts` — minimal toast system (`useToast()` from `ToastProvider`); `.toast-enter` keyframes live in `src/index.css`.
- `src/lib/api.ts` — typed fetch client for `/api/*` (history CRUD, OCR); zh-Hant error mapping.
- `src/lib/image.ts` — client-side downscale (EXIF-aware, max edge 1600, JPEG 0.85) to a dataURL before uploading for OCR.
- `src/components/CelebrationEffect.tsx` — canvas-confetti bursts, driven by a `fire` prop.
- `src/lib/utils.ts` — `cn()` (clsx + tailwind-merge), `getGrade()` (A≥90, B≥80, C≥70, D≥60, else F), `formatScore()`.

### Backend (`worker/`, deployed as a Worker with static assets)

**Important:** the Pages-style `functions/` directory does NOT work with `wrangler deploy` — routing is explicit in `worker/index.ts`.

- `worker/index.ts` — entry point: `/api/*` is routed to handlers (`assets.run_worker_first = ["/api/*"]` in wrangler.toml makes the Worker run first for those paths); everything else falls through to `env.ASSETS` (SPA fallback via `assets.not_found_handling`).
- `worker/_lib/auth.ts` — `verifyUid()` Firebase ID token verification (jose + Google JWKS).
- `worker/_lib/scores.ts` — `parseScores()` validation (known subject ids, finite 0–100, null = unrecognized) and `computeAverage()` (mirrors the frontend formula).
- `worker/routes/history.ts` — `listHistory` (GET, newest first, LIMIT 200) / `createHistory` (POST; server recomputes the average; `crypto.randomUUID()`) / `deleteHistory` (DELETE with `user_id` ownership check).
- `worker/routes/ocr.ts` — proxies the image to `{AI_BASE_URL}/chat/completions` (model `AI_MODEL`, key `AI_API_KEY` secret) with a strict-JSON prompt built from subject-data; robust JSON extraction; unrecognizable images → 422.
- `migrations/0001_init.sql` — `history_entries (id, user_id, created_at, scores JSON, average)` + index on `(user_id, created_at DESC)`.

## Conventions & Gotchas

- **Tailwind v4 is CSS-first**: design tokens are defined in the `@theme` block in `src/index.css` — there is **no tailwind.config.js**. Use semantic tokens (`bg-background`, `text-foreground`, `text-muted-foreground`, `bg-card`, `border-border`, `text-grade-a`…`text-grade-f`) rather than raw palette classes; add new tokens in `src/index.css`.
- All UI copy is **Traditional Chinese**; match it in any user-facing strings (server error messages included).
- `tsconfig.app.json` and `tsconfig.worker.json` enable `verbatimModuleSyntax` (use `import type` for type-only imports), `noUnusedLocals`/`noUnusedParameters`, and `erasableSyntaxOnly`. `pnpm build` fails on violations even when the dev server works fine.
- Worker code is typechecked by `tsconfig.worker.json` (`@cloudflare/workers-types`). Keep `worker/_lib/*` importable without browser deps; shared data goes in `src/lib/subject-data.ts`.
- Deploys are automatic on push to `main`; `dist/` is gitignored build output — never commit it. `.dev.vars` (local secrets) and `.wrangler/` are also gitignored.
- Server secrets: `AI_API_KEY` is a Worker secret (CI syncs it from the `AI_API_KEY` GitHub repo secret, or set once via `wrangler secret put` / dashboard). Non-secret server config (`FIREBASE_PROJECT_ID`, `AI_BASE_URL`, `AI_MODEL`) lives in `wrangler.toml` `[vars]`. The D1 `database_id` in `wrangler.toml` must match the real database.
- If the Cloudflare dashboard's Workers Builds is also connected to this repo it deploys on every push too — keep exactly one deploy path.
