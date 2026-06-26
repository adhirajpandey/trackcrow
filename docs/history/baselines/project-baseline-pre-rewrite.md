> Historical artifact. This baseline reflects the pre-rewrite system shape and is preserved for context only. Use `docs/reference/` and `docs/status/` for current truth.

# TrackCrow Project Baseline

## 1. Purpose and Scope
TrackCrow is a Next.js 16 App Router application for personal expense tracking with:
- manual transaction management,
- SMS-ingested transaction creation,
- analytics dashboards,
- an AI assistant (Crow Bot) for natural-language workflows.

This document is the baseline for feature development. New changes should preserve the architectural boundaries and invariants defined here.

## 2. System Architecture
### Runtime model
- Frontend + backend are co-located in a single Next.js app.
- UI rendering is mixed server/client:
  - server components fetch authenticated data,
  - client components handle rich interaction (tables, forms, chat).
- Backend logic is split across:
  - API routes in `src/app/api/**/route.ts`,
  - server actions in feature folders,
  - shared server helpers in `src/common/server.ts`.

### Core layers
- `src/lib/*`: infra (Prisma, auth config, logging, utility helpers).
- `src/common/*`: shared domain schemas, date/format utilities, SMS parser, server-side data helpers.
- `src/app/*`: feature routes (dashboard, transactions, preferences, profile, crow-bot).
- `prisma/*`: database schema + migrations.

## 3. Data Model (Prisma)
Primary entities:
- `user` (`uuid`, `email`, `subscription`, optional `lt_token`).
- `transaction` (amount, type, recipient fields, optional category/subcategory FK, `timestamp`, `input_mode`, optional `raw_message`).
- `category` and `subcategory` scoped by `user_uuid`.

Key invariants:
- Every transaction belongs to exactly one user (`user_uuid`).
- Category/subcategory are optional for transactions.
- Category uniqueness: `(name, user_uuid)`.
- Subcategory uniqueness: `(name, categoryId)`.
- Auth token for SMS ingestion is `user.lt_token`.

## 4. Authentication and Authorization
### Authentication
- NextAuth with Google provider (`src/lib/auth.ts`), JWT session strategy.
- Session is enriched with `uuid`, `id`, `email`, `name`, `subscription`.
- On first sign-in, default categories/subcategories are provisioned.

### Authorization
- Page-level gating: checks `getServerSession(authOptions)` in server components.
- API/action-level gating:
  - `validateSession()` for authenticated user UUID,
  - `validateTransactionOwnership()` for transaction-scoped writes.
- SMS ingestion endpoint uses token auth (`Authorization: Token <lt_token>`), not session cookies.

## 5. Backend Surface Area
### API routes
- `GET /api/user/self`: user profile + categories/subcategories.
- `GET /api/transactions`: paginated/filterable/sortable transaction list.
- `POST /api/transactions/sms`: parse SMS and create `AUTO` transaction.
- `GET /api/transactions/[id]/suggest`: infer category/subcategory from similar recipient history.
- `POST /api/chat`: Crow Bot intent extraction + tool execution stream.
- `GET|POST /api/auth/[...nextauth]`: NextAuth handlers.

### Server actions
- Transactions:
  - add manual transaction (`MANUAL` input mode),
  - update transaction,
  - delete transaction.
- Preferences:
  - CRUD categories/subcategories,
  - reset to defaults.
- Profile:
  - generate/retrieve/revoke device token (`lt_token`).

## 6. Crow Bot Architecture
Pipeline (`/api/chat` + `src/app/crow-bot/*`):
1. User selects mode (`transaction` or `analytics`) in client UI.
2. Request enters classifier prompt pipeline (`build-classifier-prompt.ts`).
3. Gemini model returns structured intent (validated by Zod discriminated union in `src/common/schemas.ts`).
4. Missing required fields return a structured `missing_fields` payload.
5. Client renders `MissingFieldsForm`, then submits a resume payload.
6. Tool executes (`recordExpense`, `totalSpend`, `topExpense`, `expenseComparison`, `transactionSearch`, `dashboardSummary`).
7. Streamed tool output is rendered as typed cards in chat UI.

Guardrail behavior:
- help shortcuts for TrackCrow/CrowBot FAQs,
- relevance threshold for non-expense prompts,
- context mode restrictions (`ALLOWED_BY_CONTEXT`),
- partial date-range inference and correction.

## 7. Frontend Architecture and UX Flows
### Global shell
- `RootLayout` wraps app with `SessionProvider` and `AuthenticatedLayout`.
- Landing page (`/`) is public and bypasses sidebar shell.
- Authenticated pages render sidebar + mobile navbar.

### Main product flows
- **Dashboard (`/dashboard`)**:
  - server fetch of transactions + user category metadata,
  - summary, category breakdown, tracked/untracked lists, timeline chart,
  - month filter sync via query param.
- **Transactions (`/transactions`)**:
  - client-side table backed by `/api/transactions` (pagination/search/sort/filter/timeframe),
  - row actions: open maps, view, edit, delete.
- **Transaction detail (`/transactions/[id]`)**:
  - editable form with keyboard shortcuts (`e` edit, `g` suggest, `s` save),
  - optional category/subcategory assignment and timestamp edits.
- **Preferences (`/preferences`)**:
  - category/subcategory admin with destructive confirmations.
- **Profile (`/profile`)**:
  - account view + token utility for external SMS ingestion clients.

## 8. Configuration and Environment
Expected env vars:
- `DATABASE_URL`
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
- `GOOGLE_GENERATIVE_AI_API_KEY`
- `NEXT_PUBLIC_APP_URL` (used in transaction search tool URL construction)

Operational notes:
- `pnpm build` runs `prisma generate && next build`.
- Postgres local replica path uses `docker-compose.yml` + `restore.sh` and dump in `backups/`.

## 9. Observability and Error Handling
- Logging centralized in `src/lib/logger.ts` with debug/info/warn/error levels.
- API routes generally catch and return normalized HTTP errors.
- Crow Bot stream utilities provide explicit fallback text on tool failure.
- Validation is schema-driven with Zod across API payloads and AI tool outputs.

## 10. Known Gaps and Engineering Risks (Strict)
1. No automated test suite exists (`package.json` lacks `test`).
2. `.env` is present in repo workspace with live-looking credentials; treat as compromised and rotate secrets immediately.
3. `GET /api/transactions/[id]/suggest` uses `findUnique` with extra user field; verify runtime query correctness and enforce ownership safely.
4. Crow Bot tools include weakly typed `any` paths and mixed date/string handling; regression risk is high without contract tests.
5. `top-expense` tool currently emits empty `message` strings for success modes.
6. `@typescript-eslint/no-explicit-any` is disabled in ESLint config; type safety debt is intentional but significant.

## 11. Development Guardrails for New Features
- Preserve user isolation by `user_uuid` in every query path.
- Keep server-only DB logic out of client bundles.
- Add/modify Zod schemas before changing API/tool payloads.
- If introducing new Crow Bot intents, update all of:
  - intent metadata,
  - tool schema union,
  - prompt sections,
  - tool registry and renderer mapping.
- For schema changes, include Prisma migration and backward-compatible read behavior.
- For destructive actions, retain confirmation UI and explicit error surfaces.
