> Historical artifact. This audit captures a point-in-time code quality backlog and is preserved as review context, not as a current reference document.

# Code Quality Baseline

This document lists defects and maintainability risks found in the current codebase, with strict priority for long-term reliability.

## Critical (Fix Immediately)
| Area | Issue | Evidence | Why It Matters | Required Fix |
|---|---|---|---|---|
| Transaction suggestion API | Invalid Prisma query shape in `findUnique` (`id` + `user_uuid`) | `src/app/api/transactions/[id]/suggest/route.ts:36` | Can throw runtime query validation error and break suggestion endpoint; ownership check is unreliable as written. | Replace with `findFirst({ where: { id, user_uuid } })` or use unique `id` fetch + explicit owner check. Add regression test for unauthorized access. |
| Crow Bot chart rendering | Direct `window.innerWidth` use during render | `src/app/crow-bot/components/expense-comparision-card.tsx:106` and `src/app/crow-bot/components/expense-comparision-card.tsx:109` | Client components can still render in SSR paths; direct `window` access can crash/hydration-mismatch. | Compute responsive sizing via CSS or `useEffect` + state guard (`typeof window !== 'undefined'`). |
| Secret management | Real credentials present in tracked env file | `.env:2`, `.env:3`, `.env:4`, `.env:5` | Immediate security exposure risk. | Rotate all credentials now. Remove secrets from repo history, keep only `.env.example`, enforce pre-commit secret scanning. |

## High Priority (Next Sprint)
| Area | Issue | Evidence | Why It Matters | Required Fix |
|---|---|---|---|---|
| Crow Bot search tool | Builds URL with optional env and can return invalid URL (`undefined/transactions...`) | `src/app/crow-bot/tools/transaction-search.ts:47` and `src/app/crow-bot/tools/transaction-search.ts:49` | Broken links in assistant output; poor user trust. | Fallback to relative URL when env missing, validate URL before returning. |
| Crow Bot top expense tool | Success `message` intentionally empty in all modes | `src/app/crow-bot/tools/top-expense.ts:95` to `src/app/crow-bot/tools/top-expense.ts:109` | UX regression and opaque responses. | Populate deterministic message per mode and add snapshot tests for tool payload. |
| Preferences actions | No transactional safety or error mapping on category/subcategory mutations | `src/app/preferences/actions.ts:34`, `src/app/preferences/actions.ts:59`, `src/app/preferences/actions.ts:167` | Partial writes and unhandled Prisma errors (unique violations, FK issues) surface as generic failures. | Wrap multi-step writes in `prisma.$transaction`, map Prisma error codes (`P2002`, etc.) to user-safe responses. |
| Auth onboarding | User creation and default-category seeding not atomic | `src/lib/auth.ts:89` and `src/lib/auth.ts:106` | New user can be created without defaults if seeding fails. | Use a single transaction for user + categories + subcategories. |
| SMS ingestion data quality | Uses current server time instead of message event time | `src/app/api/transactions/sms/route.ts:111` | Historical analytics become inaccurate for delayed ingestion. | Parse and persist transaction timestamp from SMS payload when present; fallback to ingest time only when unavailable. |

## Medium Priority (Maintainability Debt)
| Area | Issue | Evidence | Why It Matters | Required Fix |
|---|---|---|---|---|
| Type safety | Extensive `any` in API/chat/tools/forms | `src/app/api/chat/route.ts:44`, `src/app/transactions/components/transactions-client.tsx:321`, `src/app/crow-bot/tools/record-expense.ts:74` | Hidden runtime errors and poor refactor safety. | Introduce strict DTO types for chat metadata/tool I/O; remove `as any` casts incrementally. |
| Logging consistency | Mixed `console.*` and custom logger, including potentially sensitive payload logs | `src/common/sms-parser.ts:95`, `src/app/api/transactions/sms/route.ts:71`, `src/app/crow-bot/components/crowbot-client.tsx:115` | Harder observability and risk of leaking PII in logs. | Use `logger` everywhere; redact message/token/user fields by default. |
| API input validation | Date query params not validated before `new Date()` coercion | `src/app/api/transactions/route.ts:94` and `src/app/api/transactions/route.ts:98` | Invalid date strings can cause query errors or wrong filtering. | Validate with Zod (`z.coerce.date()` with safeParse) and return `400` on invalid range. |
| UI hygiene | Duplicate directive | `src/app/dashboard/components/monthly-spending-chart.tsx:1` and `src/app/dashboard/components/monthly-spending-chart.tsx:2` | Small but signals low review quality. | Remove duplicate pragma and enforce lint rule/check for repeated directives. |
| Dead/unclear config path | Runtime dotenv loader in app code is likely unused in Next runtime | `src/app/config.ts:1` | Confusing env strategy; increases accidental misconfiguration risk. | Remove or relocate to server-only bootstrap with documented usage. |

## Cross-Cutting Gaps
- No automated tests are configured (`package.json` has no `test` script). Add unit tests for `src/common/sms-parser.ts`, integration tests for `/api/transactions` and `/api/chat`, and mutation tests for server actions.
- No enforced quality gate for risky patterns (`any`, direct `console`, missing transactions around multi-write workflows). Add lint rules and CI checks.
- Generated Prisma client is committed under `src/generated/prisma/`; define clear policy (commit vs generate in CI) to avoid merge noise and drift.

## Recommended Fix Order
1. Patch critical bugs/security items and rotate secrets.
2. Stabilize Crow Bot contracts (search URL, top-expense messaging, typed tool payloads).
3. Add transaction-safe writes and Prisma error normalization in actions/auth.
4. Add tests + CI quality gates before new feature development.

## Suggestions (Vercel React Best Practices)
This section maps concrete improvements to the `vercel-react-best-practices` skill rules for performance and long-term maintainability.

### Priority 1: Eliminating Waterfalls (`async-*`)
| Rule | Evidence | Suggestion |
|---|---|---|
| `async-parallel` | `src/app/dashboard/page.tsx:43` and `src/app/dashboard/page.tsx:49` fetch transactions then user details sequentially. | Start both requests together with `Promise.all` after session validation. |
| `async-api-routes` | `src/app/api/transactions/route.ts:101`, `src/app/api/transactions/route.ts:107`, `src/app/api/transactions/route.ts:116` run first/last/count queries one after another. | Fire independent queries in parallel and await together to reduce route latency. |
| `async-defer-await` | `src/app/dashboard/page.tsx:38` resolves `searchParams` before all branch logic. | Resolve late where needed; avoid early awaits when values are not immediately required. |

### Priority 2: Bundle Size Optimization (`bundle-*`)
| Rule | Evidence | Suggestion |
|---|---|---|
| `bundle-dynamic-imports` | `src/app/crow-bot/components/crowbot-client.tsx:6` through `src/app/crow-bot/components/crowbot-client.tsx:14` eagerly imports all tool result cards. | Load rarely used result-card components via `next/dynamic` when tool outputs appear. |
| `bundle-dynamic-imports` | `src/app/dashboard/components/monthly-spending-chart.tsx:13` imports `recharts` in a dashboard card path. | Consider dynamic import for chart component on demand (or lazy when visible). |
| `bundle-conditional` | `src/app/transactions/components/transactions-client.tsx:77` always includes map/location behavior in main bundle. | Load map action helper only when a location action is triggered. |

### Priority 3: Server-Side Performance (`server-*`)
| Rule | Evidence | Suggestion |
|---|---|---|
| `server-parallel-fetching` | `src/app/dashboard/page.tsx:41` to `src/app/dashboard/page.tsx:53` performs independent server fetches serially. | Parallelize and fail fast with typed fallback logic. |
| `server-serialization` | `src/app/dashboard/page.tsx:85`, `src/app/dashboard/page.tsx:92`, `src/app/dashboard/page.tsx:101` pass large transaction arrays into multiple client components. | Move aggregation/slicing to server and pass minimal derived props per client component. |
| `server-dedup-props` | Same `transactions` payload reused across multiple children in one render tree. | Share precomputed derived data (`summary`, `chartData`, `listRows`) to reduce duplicate serialization. |
| `server-cache-react` | `getUserDetails` and category reads are repeated across routes (`dashboard`, `transactions`). | Wrap stable per-request lookups with `React.cache()` to deduplicate in request scope. |

### Priority 4: Client Data Fetching (`client-*`)
| Rule | Evidence | Suggestion |
|---|---|---|
| `client-swr-dedup` | `src/app/transactions/components/transactions-client.tsx:270` to `src/app/transactions/components/transactions-client.tsx:339` uses manual fetch effect lifecycle. | Migrate to SWR/React Query for request dedupe, caching, retries, and stale-while-revalidate behavior. |
| `client-event-listeners` | Global key handling exists in transaction form (`[id]/view-transaction-form.tsx`) and can expand similarly elsewhere. | Centralize keybinding registration utility to avoid duplicate listeners in future feature growth. |

### Priority 5: Re-render Optimization (`rerender-*`)
| Rule | Evidence | Suggestion |
|---|---|---|
| `rerender-derived-state-no-effect` | `src/app/transactions/components/transactions-client.tsx:193` uses effect + state for debounced query. | Use `useDeferredValue` or a dedicated debounce hook to reduce synchronization state churn. |
| `rerender-transitions` | `src/app/transactions/components/transactions-client.tsx:265` updates URL state synchronously (`router.replace`). | Wrap non-urgent route updates in `startTransition` to keep input responsive. |
| `rerender-memo` | `src/app/dashboard/components/summary.tsx:33` to `src/app/dashboard/components/summary.tsx:63` recomputes multiple reductions every render. | Use `useMemo` for expensive aggregates keyed by `transactions`. |
| `rerender-functional-setstate` | State updates in list/data handlers mix derived values from closure state. | Prefer functional updaters consistently where previous state is referenced. |

### Priority 6: Rendering Performance (`rendering-*`)
| Rule | Evidence | Suggestion |
|---|---|---|
| `rendering-content-visibility` | `src/app/dashboard/components/transaction-list-card.tsx:46` renders dense list rows/cards every time. | Apply `content-visibility: auto` to large list containers and defer offscreen rendering work. |
| `rendering-hydration-no-flicker` | `src/app/crow-bot/components/expense-comparision-card.tsx:106` and `src/app/crow-bot/components/expense-comparision-card.tsx:109` branch on `window.innerWidth` during render. | Replace with CSS-driven responsive sizing or client state initialized after mount. |
| `rendering-conditional-render` | Most conditionals are already ternary-based (good). | Keep ternary pattern; avoid introducing `&&` rendering branches for non-boolean-safe values. |

### Priority 7: JavaScript Performance (`js-*`)
| Rule | Evidence | Suggestion |
|---|---|---|
| `js-combine-iterations` | `src/app/dashboard/components/summary.tsx:33`, `src/app/dashboard/components/summary.tsx:48`, `src/app/dashboard/components/summary.tsx:55`, `src/app/dashboard/components/summary.tsx:60` run multiple passes over transactions. | Collapse into a single pass accumulator for total, tracked/untracked counts, and top-category stats. |
| `js-index-maps` | `src/app/api/transactions/[id]/suggest/route.ts:87` to `src/app/api/transactions/[id]/suggest/route.ts:115` already uses `Map` effectively. | Keep this approach; add utility extraction for reuse in future heuristic endpoints. |
| `js-early-exit` | Several branches can return sooner in route handlers and form logic. | Add explicit guard-return style consistently for simpler control flow and lower cognitive load. |

### Priority 8: Advanced Patterns (`advanced-*`)
| Rule | Evidence | Suggestion |
|---|---|---|
| `advanced-use-latest` | Chat and form handlers capture frequently changing state in callbacks (`crowbot-client`, transaction views). | Use `useLatest`/ref-backed callback pattern where stale closures are a risk in async handlers. |
| `advanced-event-handler-refs` | Event-heavy components rely on recreated handlers each render. | Convert hot-path handlers to stable ref-backed dispatchers where profiling shows churn. |

### Suggested Implementation Sequence (Skill-Aligned)
1. Fix waterfall and API-route parallelism issues.
2. Defer heavy client bundles with dynamic imports.
3. Reduce server-to-client payload serialization for dashboard/transactions.
4. Migrate transactions data fetching to SWR (or equivalent).
5. Apply rerender/rendering micro-optimizations after profiling.

## Refactor Suggestions
This section focuses on codebase-level refactors that improve maintainability, correctness, and feature velocity. These are broader than isolated bug fixes.

### 1. Backend Query and Auth Boundaries
| Refactor | Current State | Target State | Primary Files |
|---|---|---|---|
| Repository/service layer for domain operations | Prisma query logic is duplicated across API routes, server actions, and tools. | Add domain services (`transactionService`, `categoryService`, `userService`) with shared typed contracts and centralized ownership checks. | `src/app/api/transactions/route.ts`, `src/app/transactions/[id]/actions.ts`, `src/common/server.ts`, `src/app/preferences/actions.ts` |
| Unified auth/authorization guard helpers | Session checks are repeated in many handlers/actions with slight variations. | Standardize around composable guards (`requireUser`, `requireOwnedTransaction`) returning typed errors. | `src/common/server.ts`, `src/app/api/**/*.ts`, `src/app/**/actions.ts` |
| Transactional write workflows | Multi-step writes (onboarding defaults, reset defaults) are non-transactional loops. | Use `prisma.$transaction` and idempotent helpers for multi-entity operations. | `src/lib/auth.ts`, `src/app/preferences/actions.ts` |

### 2. Crow Bot Architecture Consolidation
| Refactor | Current State | Target State | Primary Files |
|---|---|---|---|
| Intent/tool contract normalization | Tool inputs/outputs use widespread `any` and ad-hoc shaping. | Define strict tool DTOs in one module and enforce across route, tools, and UI renderers. | `src/app/api/chat/route.ts`, `src/app/crow-bot/tools/*.ts`, `src/app/crow-bot/components/crowbot-client.tsx`, `src/common/schemas.ts` |
| Prompt and policy separation | Prompt assembly, routing rules, and runtime behavior are mixed. | Split into `intent-policy`, `prompt-builder`, `tool-router`, `response-mapper` modules with tests per layer. | `src/app/api/chat/route.ts`, `src/app/crow-bot/prompts/*`, `src/app/crow-bot/config/server-config.ts` |
| Card renderer registry | Tool output rendering is a long conditional chain in the chat client. | Use a map-based renderer registry keyed by tool part type. | `src/app/crow-bot/components/crowbot-client.tsx` |

### 3. Transactions Feature Decomposition
| Refactor | Current State | Target State | Primary Files |
|---|---|---|---|
| Split monolithic client container | `TransactionsClient` handles URL sync, filtering, API IO, table config, and row actions in one large component. | Extract hooks/components: `useTransactionsQueryState`, `useTransactionsData`, `TransactionsFilters`, `TransactionsTable`, `TransactionsPagination`. | `src/app/transactions/components/transactions-client.tsx` |
| Shared transaction form core | Add/edit transaction forms duplicate schema and field logic. | Create a shared form engine (`TransactionFormFields`) with mode-specific wrappers for add/edit. | `src/app/transactions/add/add-transaction-form.tsx`, `src/app/transactions/[id]/view-transaction-form.tsx`, `src/app/transactions/add/actions.ts`, `src/app/transactions/[id]/actions.ts` |
| Query param contract typing | URL params are parsed in multiple places with manual logic. | Introduce a typed parser module for `transactions` and `dashboard` search params. | `src/app/transactions/components/transactions-client.tsx`, `src/app/api/transactions/route.ts`, `src/common/utils.ts`, `src/app/dashboard/page.tsx` |

### 4. Dashboard Data Flow Refactor
| Refactor | Current State | Target State | Primary Files |
|---|---|---|---|
| Dedicated dashboard data adapter | Page fetches raw transactions then each client card derives its own aggregates. | Build one server-side dashboard adapter returning minimal view models (`summary`, `categoryBreakdown`, `timeline`, `trackedPreview`, `untrackedPreview`). | `src/app/dashboard/page.tsx`, `src/app/dashboard/components/*.tsx`, `src/common/utils.ts` |
| Reusable analytics utilities | Metrics logic is scattered across components and utility file. | Consolidate in `src/common/analytics/` with pure tested functions. | `src/common/utils.ts`, `src/app/dashboard/components/*.tsx` |

### 5. Configuration and Runtime Hygiene
| Refactor | Current State | Target State | Primary Files |
|---|---|---|---|
| Single env configuration module | Env access is spread and includes unclear runtime loader (`src/app/config.ts`). | Create `src/lib/env.ts` using schema validation (e.g., Zod) and explicit server/client env exports. | `src/app/config.ts`, `src/lib/auth.ts`, `src/app/crow-bot/tools/transaction-search.ts`, API routes |
| Logging standardization | `console.*` and custom logger coexist; payload redaction is inconsistent. | Standardize on `logger` with serializers/redaction policy and per-domain context fields. | `src/lib/logger.ts`, `src/common/sms-parser.ts`, `src/app/crow-bot/*`, route/actions files |

### 6. Suggested Refactor Roadmap
1. Extract typed domain services + auth guards (high risk reduction, enables later refactors).
2. Normalize Crow Bot tool contracts and renderer registry.
3. Decompose `TransactionsClient` and unify transaction forms.
4. Introduce dashboard adapter and analytics utility layer.
5. Finish with env/logging unification and cleanup.

### 7. Definition of Done for Refactors
- Public behavior unchanged (except explicit bug fixes already documented).
- New modules have unit tests and typed boundaries (no new `any` escape hatches).
- API/action error shapes are standardized and documented.
- Performance baseline rechecked for dashboard, transactions list, and chat interactions.
