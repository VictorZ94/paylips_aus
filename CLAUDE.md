# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev      # next dev on :3000
npm run build    # production build (also type-checks)
npm run lint     # eslint (flat config, eslint-config-next core-web-vitals + typescript)
npx tsc --noEmit # type-check only
```

There is no test runner and no test files. `@playwright/cli` is installed only for ad-hoc browser driving (see the `playwright-cli` skill), not as a test suite.

## Environment

Copy `.env.example` to `.env.local`:

- `NEXT_PUBLIC_FIREBASE_*` — client Firebase config. If `apiKey`/`authDomain`/`projectId`/`appId` are missing, auth status becomes `"misconfigured"` and `AuthGate` shows a splash instead of the app.
- `OLLAMA_API_KEY` — server-only; `/api/ai-extract` returns 503 without it. `OLLAMA_HOST` is optional (defaults to `https://ollama.com`).

Firestore must be enabled with the per-user rules in `README.md` (`users/{uid}/payslips/{doc}`, owner-only).

## Architecture

Paylips AUS is a Next.js 16 App Router app (React 19, MUI 9, TypeScript, `@/*` → `src/*`) that turns Australian payslip PDFs into a personal income dashboard. Almost everything is client-side; the only server code is one route handler.

### Upload → extraction pipeline

1. `src/app/AiUploadPage.tsx` rasterises the PDF in the browser with `pdfjs-dist` (max 6 pages, scale 1.5) to PNGs. The worker is served from `public/pdf.worker.min.mjs` and must be kept in sync with the installed `pdfjs-dist` version.
2. The PNGs are POSTed as multipart `images` to `src/app/api/ai-extract/route.ts` (Node runtime, limits: 6 pages, 8 MB each).
3. `src/lib/ollama-server.ts` sends them to an Ollama Cloud vision model (`DEFAULT_MODEL`) with `PROMPT` and `PAYSLIP_SCHEMA` as the structured-output format, then parses the reply defensively (raw JSON → fenced block → first balanced object).
4. The route's `coerceRow` normalises each row: dates `DD/MM/YYYY` → ISO, all numeric fields required except `laundryAllowances` (defaults to 0), `company` falls back to `"Unknown"`. Rows that fail are dropped. The response carries `warnings: { defaultedAllowances, droppedRows }`, which the client logs as LLM misbehaviour.
5. The user reviews the rows, then `mergeByPeriod` (`src/lib/csv.ts`) upserts them into the current snapshot and `commitSnapshot` persists.

`PROMPT`, `PAYSLIP_SCHEMA`, `coerceRow` and the `Payslip` type (`src/lib/types.ts`) describe the same nine fields and must be changed together. So must `withCompanyBackfill` in `payslips-repo.ts`, which rebuilds rows field-by-field on read.

### Payslip store

`src/lib/storage.ts` is a module-level external store consumed through `useSyncExternalStore` (`subscribe` / `getSnapshot` / `getServerSnapshot`, or the `usePayslips` hook). It is the only thing UI code should touch for payslip data.

- It holds the full, `startDate`-sorted `Payslip[]` in memory and lazy-loads it from Firestore on first subscribe. It watches Firebase auth itself and drops/reloads the cache when the uid changes.
- Writes are optimistic and whole-collection: `commitSnapshot(rows)` updates the cache, then `payslipsRepo.putAll` deletes every doc and rewrites all rows in a single `writeBatch`. Firestore errors are swallowed, so a failed write leaves the UI ahead of the database.
- `src/lib/payslips-repo.ts` is the Firestore layer (`users/{uid}/payslips/{id}`); `src/lib/firebase/client.ts` lazily creates the app/auth/db singletons, with persistent multi-tab local cache in the browser.
- `src/lib/migrate-from-indexeddb.ts` runs once before the first load to copy rows out of the legacy `paylips_aus` IndexedDB (guarded by the `paylips_aus.migratedToFirestore` localStorage flag).

A payslip's `id` is `${startDate}|${endDate}` and is the Firestore doc id and the merge key. `company` is not part of it, so two employers' payslips for the same period overwrite each other.

### Auth and routing

`AuthProvider` (`src/lib/auth-context.tsx`) wraps the whole tree in the root layout and exposes `status`: `loading | authenticated | unauthenticated | misconfigured`. Only the `(app)` route group is wrapped in `AuthGate`, which redirects to `/login`. `/ai-upload` and `/api/ai-extract` sit outside that group and are not auth-checked; when signed out, `commitSnapshot` only updates the in-memory cache.

Each route's `page.tsx` is a thin server wrapper around a `"use client"` view (`DashboardView`, `AiUploadPage`, `LoginPage`, `RegisterPage`).

### Dashboard

`DashboardView` reads the store, keeps `Filters` (date preset + companies) in local state, and derives everything through pure functions in `src/lib`:

- `summary.ts` — `resolveRange`, `filterPayslips`, `computeSummary` (KPIs, weekly points, breakdown slices, previous-window delta). These assume the input is sorted by `startDate`. "YTD" means the Australian financial year (starts 1 July, `isoYearStartAU` in `format.ts`).
- `hours-buckets.ts` — re-buckets weekly points into week/fortnight/month and scales the 24 h/week threshold line accordingly. Fortnights are formed by pairing adjacent rows, not by calendar.
- `companies.ts` — distinct companies and income-by-company slices.

Charts are ApexCharts. `react-apexcharts` and `components/ChartBundle.tsx` are loaded with `next/dynamic` and `ssr: false`; keep new charts behind that boundary.

### Styling

MUI with CSS variables, dark-only (`src/app/theme.ts`, wired up by `ThemeRegistry.tsx` with `AppRouterCacheProvider`). The exported `palette` object is the source of truth for colours and is imported directly by components and by `lib/summary.ts` for chart slice colours.
