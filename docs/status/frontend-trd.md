# TrackCrow Frontend Rewrite TRD

## 1. Document Status

Status: Accepted
Scope: TrackCrow frontend rewrite
Framework: Next.js App Router
Backend status: Existing HTTP backend is complete and will be reused as-is
Mutation model: API-only
Theme scope: Dark mode only for initial release

## 2. Objective

Rewrite the TrackCrow frontend using Next.js App Router while preserving the existing backend architecture and API behavior.

The frontend will use a traditional client-server model for mutations. Server Actions will not be used in this version. The existing `/api/*` route handlers, controllers, service layer, Zod validation, NextAuth session handling, and `ServiceResult` response pattern remain the main backend boundary for frontend mutations.

This TRD assumes no backend API contract changes for the rewrite. Where the current backend does not expose a planned capability, the frontend must adapt to the existing behavior rather than introducing new backend requirements for v1.

## 3. Current Backend Context

The backend is structured as:

```txt
src/app/api/**/route.ts
  -> src/server/modules/*/controller.ts
  -> src/server/modules/*/service.ts
  -> src/server/shared/result.ts
  -> src/server/api/responses.ts
```

Route files are thin App Router API entry points.

Controllers handle:

* session requirement
* request parsing
* Zod validation
* service invocation
* HTTP response mapping

Services contain business logic.

The main backend modules are:

* `transactions`
* `categories`
* `recipients`
* `dashboard`
* `device-tokens`
* `imports`

The rewrite may add new server-only frontend integration code such as page-data functions, but it does not require changing the existing HTTP API surface for v1.

Authentication is handled with NextAuth/Auth.js in `src/lib/auth.ts`. Protected API paths use `requireSessionUser()` to extract the authenticated user and `userUuid`.

SMS ingestion is token-authenticated and must remain an HTTP API surface.

## 4. Non-Goals

The rewrite will not:

* replace the backend
* introduce Server Actions
* introduce tRPC
* introduce Redux
* move business logic into React components
* duplicate backend validation rules in the frontend
* redesign the SMS import/token flow
* add new backend endpoints just to satisfy frontend architecture preferences
* implement light mode in the first version
* rewrite the landing page before the product shell is stable

## 5. App Structure

The app will use route groups with separate layouts.

TrackCrow will use a single root layout.

```txt
app/
  layout.tsx

  (marketing)/
    layout.tsx
    page.tsx

  (auth)/
    layout.tsx
    login/page.tsx

  (app)/
    layout.tsx
    dashboard/page.tsx
    transactions/page.tsx
    categories/page.tsx
    recipients/page.tsx
    settings/page.tsx

  api/
    auth/[...nextauth]/route.ts
    transactions/
    categories/
    recipients/
    dashboard/
    imports/
    device-tokens/

  global-error.tsx
```

### 5.1 Route Group Policy

`app/layout.tsx` is the only root layout and owns `<html>` and `<body>`.

Route group layouts are nested section layouts and must not redefine `<html>` or `<body>`.

Shared app-wide concerns such as providers, semantic theme tokens, and global shell wiring belong in `app/layout.tsx`.

`(marketing)` is for public marketing pages.

`(auth)` is for login and auth-adjacent pages.

`(app)` is for authenticated product pages.

`api/` remains separate and is used for all HTTP API surfaces.

Route group names must not be treated as URL prefixes. Duplicate paths across route groups are not allowed.

This must be enforced by linting or CI checks, because Next.js build failures for duplicate cross-group paths can be cryptic.

## 6. Backend Boundary Policy

Controllers are HTTP adapters.

Services are business logic.

Frontend code must not call controllers directly.

All files under `src/server/**` and `src/server/page-data/**` must import `server-only` where applicable.

Client components must not import from `src/server/**`.

Server pages must not call arbitrary service methods directly.

Server-rendered page reads must go through server-only page-data functions. Client components must call APIs through the frontend API client.

Page-data functions are responsible for:

* requiring the authenticated user
* parsing and validating search params
* calling services
* converting service results to page DTOs
* mapping missing/inaccessible resources to `notFound()`
* hiding internal service errors from UI components

Recommended structure:

```txt
src/server/page-data/
  dashboard-page-data.ts
  transactions-page-data.ts
  categories-page-data.ts
  recipients-page-data.ts
  settings-page-data.ts
```

### 6.1 Page DTO Policy

All page-data and API response payloads are DTOs.

No Prisma model object may be returned directly to a component or API response.

## 7. Data Fetching Model

### 7.1 Server Page Reads

Server-rendered page reads will use server-only page-data functions.

```txt
page.tsx
  -> page-data function
  -> render UI
```

This applies to read-heavy pages such as:

* dashboard overview
* transactions list initial render
* categories initial tree
* recipients initial list
* settings initial data

Server pages must not call the app's own `/api/*` endpoints just to reach internal backend logic.

### 7.2 Client-Side Reads

Client-side interactive reads will use TanStack Query and the typed API client.

```txt
Client component
  -> TanStack Query
  -> typed API client
  -> /api/* route
  -> controller
  -> service
```

This applies when the user interaction is already client-owned, such as:

* changing filters without full navigation
* table interactions
* modal-driven detail fetches
* background refresh
* optimistic UI flows
* retryable client-side requests

### 7.2.1 Server-to-Client Data Handoff Policy

Use exactly one ownership mode per page surface.

Mode A: Server-owned page data

* server page fetches data through page-data
* client page view receives DTO props
* no `useQuery` is mounted for that same data on initial render

Mode B: Query-owned interactive data

* server page fetches initial data through page-data
* client `useQuery` is mounted with `initialData`
* query key must exactly match the normalized filter state
* subsequent refresh, pagination, sorting, and mutation invalidation are owned by TanStack Query

Mode C: Hydrated nested query tree

* use `dehydrate()` and `HydrationBoundary`
* reserve for deeply nested client trees where prop passing becomes noisy

Transactions list should use Mode B.

Dashboard overview should use Mode A unless interactive refresh is required.

### 7.3 Next.js 16.1 Dynamic API Policy

TrackCrow targets Next.js 16.1. All App Router code and TRD examples must use the async dynamic API syntax.

Route data such as page `params`, page `searchParams`, layout `params`, and route-handler `context.params` must be treated as asynchronous values. Route files should await these values at the route boundary and pass plain parsed values into page-data functions, controllers, and UI components.

Rules:

* `page.tsx` `params` must be awaited
* `page.tsx` `searchParams` must be awaited
* `layout.tsx` `params` must be awaited when present
* route-handler `context.params` must be awaited
* do not access `params.id`, `searchParams.q`, or `context.params.id` synchronously
* route files should unwrap Next.js async props at the boundary
* page-data functions should receive plain objects, not Promise-shaped Next.js props
* all TRD examples must use Next.js 16.1 async syntax

Preferred page pattern:

```tsx
export default async function Page(props: PageProps<"/transactions">) {
  const searchParams = await props.searchParams;
  const data = await getTransactionsPageData(searchParams);

  return <TransactionsPageView initialData={data} />;
}
```

Preferred dynamic page pattern:

```tsx
export default async function Page(
  props: PageProps<"/transactions/[transactionId]">
) {
  const { transactionId } = await props.params;
  const data = await getTransactionPageData(transactionId);

  return <TransactionDetailView transaction={data.transaction} />;
}
```

Preferred route-handler pattern:

```tsx
export async function PATCH(
  request: NextRequest,
  context: RouteContext<"/api/transactions/[transactionId]">
) {
  const { transactionId } = await context.params;

  return updateTransactionController(request, { transactionId });
}
```

Acceptance criteria:

* no synchronous access to page `params` or `searchParams` remains
* no synchronous access to route-handler `context.params` remains
* page-data functions receive plain values
* App Router examples in the TRD match Next.js 16.1 syntax

## 8. Mutation Model

All mutations will use API calls.

Server Actions will not be used in this version.

```txt
Client component / form
  -> typed API client
  -> /api/* route handler
  -> controller
  -> requireSessionUser / token auth
  -> Zod validation
  -> service
  -> HTTP response
```

Examples:

```txt
Create transaction      -> POST /api/transactions
Update transaction      -> PATCH /api/transactions/:id
Delete transaction      -> DELETE /api/transactions/:id
Create category         -> POST /api/categories
Update category         -> PATCH /api/categories/:id
Delete category         -> DELETE /api/categories/:id
Revoke device token     -> API route
SMS import              -> API route
```

### 8.1 Server Actions Policy

Server Actions are intentionally excluded.

The project will not maintain two mutation paths for the same product behavior.

The following pattern is not allowed:

```txt
Some mutations -> Server Action -> service
Other mutations -> API -> controller -> service
```

The accepted pattern is:

```txt
All frontend mutations -> API -> controller -> service
```

## 9. API Client Policy

Frontend components must not scatter raw `fetch()` calls.

All API access must go through typed API modules.

Required structure:

```txt
src/lib/api/
  client.ts
  transactions.ts
  categories.ts
  recipients.ts
  dashboard.ts
  device-tokens.ts
```

`client.ts` owns:

* base URL handling
* credentials behavior
* JSON parsing
* extraction of a user-safe message from the current backend response shape
* lightweight error normalization around the existing backend contract
* common headers
* typed response handling

Feature API files own endpoint-specific functions.

Browser API calls must use relative same-origin `/api/*` URLs by default.

`NEXT_PUBLIC_API_BASE_URL` is allowed only if the frontend and API are intentionally deployed on separate origins.

Example shape:

```txt
src/lib/api/transactions.ts
  listTransactions()
  getTransaction()
  createTransaction()
  updateTransaction()
  deleteTransaction()
```

## 10. TanStack Query Policy

TanStack Query will manage client-side server state.

Use `useQuery` for client-side reads.

Use `useMutation` for create/update/delete flows.

Use `invalidateQueries` after successful mutations.

Example invalidation policy:

```txt
create/update/delete transaction
  -> invalidate transaction query keys
  -> invalidate dashboard query keys
  -> invalidate transaction detail keys if loaded

create/update/delete category
  -> invalidate category query keys
  -> invalidate transaction query keys if category names are displayed there

transaction mutation affecting recipient-derived UI
  -> invalidate recipient query keys when transaction writes may have implicitly created or changed displayed recipient data
  -> invalidate transaction query keys when transaction data itself changes
```

Backend data must not be copied into Zustand or long-lived local React state.

### 10.1 Query Key Policy

Implement centralized TanStack Query key factories for TrackCrow.

Create feature-owned query key modules for:

* transactions
* categories
* recipients
* dashboard
* settings/device tokens if needed

Use this structure where appropriate:

```txt
src/features/transactions/query-keys.ts
src/features/categories/query-keys.ts
src/features/recipients/query-keys.ts
src/features/dashboard/query-keys.ts
src/features/settings/query-keys.ts
```

Requirements:

1. Replace all raw query key arrays in components and hooks with query-key factory calls.
2. Ensure list, detail, and infinite-query keys are separate.
3. Ensure every query key includes all variables that affect returned data, including filters, month, category, sort, page, search text, and IDs.
4. Normalize optional values in query keys so equivalent states produce the same key. Use `null` or defaults consistently instead of mixing `undefined`, empty string, and omitted fields.
5. Update mutation hooks so invalidation uses the factories, not raw arrays.
6. For transaction create/update/delete, invalidate transaction list keys and dashboard keys.
7. For category mutations, invalidate category keys and transaction list keys if category names appear in transactions.
8. For recipient-related cache refresh, invalidate recipient keys after transaction mutations only when the affected UI depends on recipient lists or recipient-derived display data.
9. If server prefetching with `HydrationBoundary` is used, ensure the server prefetch and client `useQuery` use the exact same key factory call.
10. Do not reuse a normal `useQuery` key for `useInfiniteQuery`.

Query key factories should follow hierarchical tuple shapes.

Preferred examples:

```txt
["transactions", "all"]
["transactions", "list", { filters }]
["transactions", "detail", id]
```

This allows broad invalidation at the feature root and predictable cache grouping below it.

Expected output:

* `query-keys.ts` files for each feature
* updated hooks using those keys
* updated mutation invalidation
* no raw query key arrays outside query-key modules, except tests if explicitly justified

### 10.2 Server-to-Client Hydration Policy

Hydration strategy must match the selected ownership mode in section 7.2.1.

Rules:

* do not mix Mode A and Mode B for the same page-level dataset on initial render
* use Mode B when the page surface is query-owned after first paint
* use Mode C only when nested query ownership is justified by component structure
* server-provided `initialData` and client `useQuery` must use the exact same normalized filter state and query key factory call

Current page guidance:

* transactions list should use Mode B
* dashboard overview should use Mode A unless interactive refresh is required

TanStack Query Provider Policy:

* the browser must use a stable `QueryClient` instance
* server prefetching must create a per-request `QueryClient`
* server-prefetched queries must use the same query-key factory calls as client `useQuery`
* do not share a global `QueryClient` across server requests

### 10.3 Optimistic UI Policy

Optimistic UI is allowed for:

* table row rename/edit where server normalization is minimal
* delete row removal with rollback
* local status toggles

Optimistic UI is not allowed for:

* dashboard metric totals
* category suggestion results
* recipient inference
* imported SMS parsing results
* anything affecting subscription or permission state

Row-level optimistic updates may still invalidate dashboard data after success.

## 11. Auth Policy

The project uses `next-auth` v4 / NextAuth.js v4.

Auth.js v5 migration is not part of this rewrite.

The backend remains the source of truth for users, subscriptions, ownership, and permissions.

### 11.1 Auth Helper Policy

Server-side product auth must go through local server-only helpers:

```txt
src/server/auth/session.ts
  requireSessionUser()
  optional future wrappers if later introduced
```

Current v1 requirement:

* protected API controllers continue to use `requireSessionUser()`
* `(app)/layout.tsx` must use a server-only session helper that can redirect unauthenticated users to `/login`
* if the existing `requireSessionUser()` is not suitable for layout/page usage, add one minimal helper for page auth only
* do not perform a broad auth-helper refactor as part of v1
* application code must not call `getServerSession(authOptions)` directly outside this helper module

### 11.2 Page Auth Boundary

Authenticated product routes under `(app)` must be protected on the server.

```txt
(app)/layout.tsx
  -> server-only session helper in `src/server/auth/session.ts`
  -> redirect("/login") when session is missing
```

Public marketing pages must not depend on `useSession()` to render.

### 11.3 API Auth Boundary

Every protected API controller must call `requireSessionUser()`.

A protected page does not make its API routes automatically safe.

API responses must use status codes:

```txt
401 -> unauthenticated
403 -> authenticated but forbidden
404 -> missing resource or inaccessible resource
409 -> conflict
400 -> validation error
500 -> unexpected server error
```

The frontend should rely primarily on HTTP status plus the JSON `message` field for user-safe error handling. It must not assume a richer machine-readable error code is present in every API response body.

### 11.4 Client Auth Policy

Client components may display session-derived UI, but they must not be the primary auth gate.

The root layout must not become a client-only auth wrapper.

## 12. Client Component Policy

Client Components are interaction layers.

They can own:

* local open/close state
* form state
* search input behavior
* table sorting and selection UI
* optimistic UI
* toast display
* browser-only behavior
* TanStack Query hooks
* API mutation hooks

They must not own:

* auth gating
* ownership checks
* primary business rules
* recipient resolution
* category suggestion logic
* subscription enforcement
* API response normalization
* large orchestration flows

`"use client"` must be placed at the smallest practical boundary.

Pages and layouts must remain Server Components unless they require client-only behavior.

## 13. URL State Policy

Only meaningful, shareable state goes in the URL.

For transactions, the URL may contain:

```txt
q
month
category
sort
page
```

Temporary UI state must not go in the URL.

Do not put these in URL params:

```txt
modal open state
dropdown open state
unsaved form values
temporary draft search text before apply
hover state
selected table rows unless it is explicitly shareable
```

URL parsing and URL building must be centralized.

Required helper shape:

```txt
src/features/transactions/query-state.ts
  parseTransactionSearchParams()
  buildTransactionSearchParams()
  transactionQueryStateSchema
```

Canonical normalization rules:

* `page=1` must be stripped from the URL
* empty strings must be removed from the URL
* missing filters must map to `null` in query-key variables where applicable

Equivalent URL states must normalize to the same parsed query-state object and query-key variables.

Server pages must parse the plain App Router `searchParams` object through feature query-state helpers.

Client components must not scatter `URLSearchParams` parsing inside random `useEffect` blocks.

### 13.1 Transaction Filter Contract

The transactions frontend must preserve the existing backend filter semantics for v1.

Product URL state may remain simplified for UX, but the page-data layer and typed API client must map it to the current backend query contract exactly.

Current backend query contract for `GET /api/transactions`:

* `page` is a 1-based positive integer
* `size` is a positive integer and the backend clamps it to a maximum of 100
* `q` is a trimmed free-text search string
* `sortBy` is `amount` or `timestamp`
* `sortOrder` is `asc` or `desc`
* `startDate` and `endDate` are date inputs parsed by the backend as dates
* categories are accepted through repeated `category` params and through a CSV `categories` param

Frontend contract for v1:

* user-facing transactions URL state may use `q`, `month`, `category`, `sort`, and `page`
* page-data and query-state helpers must normalize that URL state into the backend request shape before calling the API
* if `month` is used in the product URL, it must be converted into backend `startDate` and `endDate` values by a centralized helper
* if `sort` is used in the product URL, it must be converted into backend `sortBy` and `sortOrder` values by a centralized helper
* the frontend must prefer repeated `category` params as the canonical URL form
* the frontend may continue to read legacy CSV `categories` input because the backend currently accepts it, but it should not emit that form as the preferred canonical state

Category filter semantics:

* category filters are category names, not category IDs
* category matching is based on transaction category name as implemented by the backend service
* the reserved category token `uncategorized` maps to transactions where `categoryId` is `null`
* category tokens should be normalized case-insensitively for comparison with the reserved `uncategorized` value

Date filter semantics:

* list transactions currently uses inclusive bounds: `startDate >=` and `endDate <=`
* dashboard date filtering currently also uses inclusive bounds
* `listTransactionsForRange()` currently uses an exclusive upper bound for `endDate`
* for v1 page-data and API-client work, the transactions list UI must follow the inclusive `GET /api/transactions` semantics
* if helper code is shared with range-based reads, those differences must be handled explicitly rather than assumed away

Search semantics:

* `q` searches `recipientRaw`, `recipientName`, `remarks`, and recipient `displayName`
* if `q` can be parsed into a finite number after backend normalization, the backend also attempts an exact amount match

Canonical frontend normalization requirements:

* equivalent URL states must map to the same backend request object
* query keys must be built from normalized backend-effective filter state, not raw URL strings
* category order should be normalized when it does not affect backend results
* absent filters must not produce distinct cache keys from empty-equivalent filter states

### 13.2 `useSearchParams()` Suspense Policy

Prefer parsing `searchParams` on the Server Page and passing normalized values down.

Failing to wrap `useSearchParams()` correctly can de-optimize the entire route into client-side rendering during the build process.

Strict rule:

* avoid `useSearchParams()` in Client Components when the Server Page can parse `searchParams`
* if a Client Component uses `useSearchParams()`, it must be rendered under an explicit `<Suspense>` boundary
* dynamic import does not replace the Suspense requirement unless the component is intentionally isolated as client-only and the route behavior is understood

Server pages should await plain App Router `searchParams` and pass them into page-data functions.

Preferred pattern:

```txt
page.tsx
  -> await searchParams
  -> getTransactionsPageData(searchParams)
  -> page-data parses searchParams
  -> pass DTO to TransactionsPageView
```

## 14. Form Policy

Forms will use React Hook Form and Zod.

Frontend Zod schemas are UX validation schemas.

Backend Zod schemas remain authoritative for API correctness.

Frontend validation must not be treated as a security or ownership boundary.

Frontend form schemas may differ from backend API schemas when the UI shape is different.

Each form must have an explicit mapper from form values to API payload.

Each form must export a pure mapper function:

```txt
mapFormToApi(values: FormValues): ApiPayload
```

```txt
Form values
  -> form validation schema
  -> mapper
  -> API request payload
```

Form components must not directly send raw form state to APIs when conversion is required.

Examples of required conversion:

* string amount to numeric amount
* date picker value to API date string
* empty string to `null`
* selected option object to ID
* trimmed note text

Form mapper functions must be unit tested.

Pure mapper tests are required because data coercion errors are a high-risk source of silent frontend corruption before API submission.

## 15. Design System Policy

The selected [design.md](design.md) is the visual source of truth for TrackCrow.

### 15.1 Design Source Policy

Accepted product design source:

```txt
./design.md
```

This file is authoritative only if it describes the accepted TrackCrow product UI direction.

The rewrite must not derive product tokens from any old marketing-only or ClickHouse-inspired design file unless that design has been explicitly reaccepted.

The design system will be implemented through:

* Tailwind tokens
* CSS variables
* shadcn/ui primitives
* shared product components
* consistent layout rules

`design.md` defines visual direction. Code tokens and reusable components enforce it.

Required implementation path:

```txt
design.md
  -> semantic tokens
  -> globals.css / Tailwind theme
  -> shadcn/ui primitives
  -> shared TrackCrow components
  -> feature screens
```

## 16. Theme Policy

TrackCrow will ship dark mode only in the first frontend version.

Light mode will be implemented later.

Even though only dark mode is implemented now, styling must use semantic tokens.

Allowed:

```txt
bg-background
text-foreground
bg-card
text-muted-foreground
border-border
text-primary
bg-destructive
```

Avoid:

```txt
bg-black
text-white
border-zinc-800
bg-neutral-950
text-gray-400
```

Hardcoded colors are allowed only inside the token definition layer.

The app must not expose a theme toggle until light mode is implemented.

### 16.1 Accessibility and Token Contrast Policy

* Every interactive `shadcn/ui` component must have a visible focus state.
* All foreground/background token pairs must pass WCAG contrast for normal text.
* Error/destructive colors must be distinguishable from primary/accent colors in dark mode.

## 17. Component Structure

Feature code should stay near the route that owns it.

Example:

```txt
app/(app)/transactions/
  page.tsx
  _components/
    transactions-page.tsx
    transaction-table.tsx
    transaction-filters.tsx
    transaction-form.tsx
  _hooks/
    use-transactions.ts
    use-transaction-mutations.ts
  _schemas/
    transaction-form.schema.ts
  _utils/
    query-state.ts
```

Shared code belongs in:

```txt
src/components/ui/
src/components/common/
src/lib/api/
src/lib/auth/
src/lib/query/
src/lib/design/
```

Do not create large global folders for feature-specific components.

## 18. Table Policy

TrackCrow table workspaces should use a shared foundation and feature-owned columns.

The current decision is to standardize tables now because transactions and recipients already repeat the same table shell, sorting, pagination, empty-state, and URL-state concerns.

Full data workspaces must use:

* shadcn-style semantic table primitives from `src/components/ui/table.tsx`
* TanStack Table for table state and rendering where the surface is sortable, pageable, selectable, or otherwise data-grid-like
* TanStack Table manual server-side behavior for paginated API data
* TanStack Query for client-side server-state refetches
* URL search params for shareable state such as `q`, `page`, `size`, `sortBy`, `sortOrder`, and feature filters

This table pass does not include new automated test work by default. Validation for the pass is manual product verification unless a touched area already requires a narrow regression test to stay shippable.

The standard data flow is:

```txt
server page initial fetch
  -> client table view
  -> TanStack Query refetch
  -> API route
  -> same service
```

Transactions and recipients should converge on this shape. Recipients already uses server/API-backed search, sort, and pagination, so it is the first UI rewrite candidate for the shared table foundation.

Recipient list columns for the current rewrite target are:

* recipient
* identifiers
* transactions
* total amount sent

`normalizedName` and the current list `status` badge should not remain visible columns in the recipients workspace table. Supporting `total amount sent` requires the recipients backend list/query DTOs to expose an aggregate amount field for each row.

Shared table code should stay small and composable:

```txt
src/components/product/data-table-shell.tsx
src/components/product/data-table-pagination.tsx
src/components/product/sortable-table-head.tsx
src/components/product/data-table-empty.tsx
src/components/product/data-table-loading.tsx
```

Feature-owned table code remains responsible for domain columns and row actions:

```txt
transaction-table.tsx
transaction-columns.tsx
transaction-filters.tsx
use-transactions.ts
```

Equivalent recipient files may use recipient-specific names.

Tables may own view-level UI state such as:

* selected rows
* column visibility
* local sort UI
* pagination controls

Tables must not own backend business rules.

Dashboard and detail-page mini tables should use the semantic table primitives without TanStack Table unless they become independently sortable, pageable, selectable, or data-grid-like.

Deferred table scope:

* bulk-selection bars until a real bulk workflow exists
* column-visibility menus until optional columns create a real usability need
* one magic global table component that owns domain columns, row actions, and backend rules
* broad new automated table test coverage as a prerequisite for this pass

## 19. Landing Page Policy

The landing page is a marketing surface.

It is separate from the authenticated product UI.

The landing page will live under `(marketing)` and will have its own layout, public navigation, content structure, SEO, hero section, CTA sections, and public error/not-found behavior.

The landing page rewrite will happen after:

* app route structure is fixed
* dark-mode tokens are implemented
* product shell is stable
* core dashboard screens have a settled visual pattern

The landing page must not inherit dashboard shell decisions such as:

* sidebar layout
* authenticated navigation
* dense table spacing
* product card layout
* dashboard loading skeletons

Marketing and product UI may share brand tokens. They must not share layout constraints.

## 20. Error Handling Policy

App Router boundaries must be implemented from the start.

Required files:

```txt
app/global-error.tsx
app/not-found.tsx

app/(marketing)/error.tsx
app/(marketing)/not-found.tsx
app/(marketing)/loading.tsx

app/(auth)/error.tsx
app/(auth)/loading.tsx

app/(app)/error.tsx
app/(app)/not-found.tsx
app/(app)/loading.tsx
```

### 20.1 `error.tsx`

Each route group must have its own `error.tsx`.

`(app)/error.tsx` must show product-safe recovery actions:

* retry
* go to dashboard
* contact/support fallback if available

It must not expose:

* stack traces
* Prisma errors
* raw service errors
* internal error codes not meant for users

### 20.2 `global-error.tsx`

`global-error.tsx` is the final fallback for root-level failures.

It must be self-contained and must not depend on the normal app shell.

It must include its own document structure.

### 20.3 `not-found.tsx`

Missing domain resources must use not-found behavior.

Examples:

```txt
transaction not found
category not found
recipient not found
resource belongs to another user
unknown public page
```

For user-owned resources, inaccessible and missing records should not reveal unnecessary existence information.

### 20.4 Unauthorized Strategy

Unauthenticated app pages must redirect to `/login`.

APIs must not redirect to login HTML.

APIs must return JSON:

```txt
401 unauthenticated
403 forbidden
404 not found
```

The experimental `unauthorized.tsx` strategy will not be used for the initial version.

### 20.5 Loading States

Route-level `loading.tsx` files must exist for the listed route groups, but they may stay minimal.

They may render a lightweight shell placeholder when most loading UX is handled by feature-level Suspense boundaries and skeletons.

Real, data-dependent loading states must be handled by targeted Suspense boundaries and feature skeletons inside the page.

Required skeletons:

```txt
dashboard metric cards
transactions table
category tree/list
recipients list
settings form shell
```

Full-page spinners must not be the default loading UI for product screens.

Skeletons must not rely on color alone to imply loading.

## 21. API Error Handling Policy

The frontend must consume the existing backend error format consistently.

API error handling must be centralized in the API client.

Every mutation UI must handle:

* validation error
* unauthenticated error
* forbidden error
* not found error
* conflict error
* unexpected error

Form-level validation errors must map to fields when the API provides field-level information.

Non-field errors must render in a stable form-level error area.

Toast-only error handling is not enough for forms.

### 21.1 `ApiClientError` Shape

The frontend API client must adapt to the existing backend response shape without requiring backend changes.

Preferred shape:

```ts
type ApiError = {
  message: string;
  issues?: unknown;
  details?: unknown;
}
```

The API client throws `ApiClientError` with:

* `status`
* `message`
* raw parsed response body for endpoint-specific handling when needed

Notes:

* the backend currently guarantees a user-safe `message` field through shared response helpers
* the frontend may derive coarse behavior from HTTP status codes
* the frontend must not require a JSON `code` field for v1
* the frontend must not require a universal `fields` object for v1

### 21.2 Form Server Error Mapping

Forms must call `setError()` for field errors when the backend response can be mapped safely, and render non-field errors inline.

Field-level API errors should populate form fields when the API provides field-level information.

For v1, field-level mapping is best-effort:

* 400 validation responses commonly expose Zod-style `issues`
* some endpoints may expose endpoint-specific `details`
* when field-level mapping is not safely derivable, render the backend `message` as a stable form-level error instead of inventing field assignments

Non-field API errors must render in a stable form-level error area.

### 21.3 Global API Error Handling and Auth Expiration

Global authentication failures must be handled centrally in the TanStack Query client.

The browser query client should define shared `QueryCache` and `MutationCache` error handling for `401` API responses.

Recommended behavior:

* on any `401` response from `ApiClientError`, trigger a global auth-expiration flow
* the auth-expiration flow may call `signOut()` or redirect to `/login`
* individual mutation hooks should not each implement their own ad hoc `401` redirect logic

This ensures that expired sessions are handled consistently when users leave product pages open and later trigger mutations or refetches.

## 22. SMS Import and Device Token Policy

SMS import remains an API-only integration.

It must continue to use:

```txt
Authorization: Token <token>
```

The frontend must not convert SMS import into Server Actions or UI-only functions.

Device tokens remain auditable and revocable through API-backed UI.

The frontend settings UI may call device-token APIs, but token hashing, prefix display, lookup, and revocation logic remain server-side.

## 23. Dashboard Policy

Dashboard data must come from `dashboard/service.ts`.

The dashboard page may fetch initial data server-side.

Interactive dashboard refresh or filter changes may use TanStack Query through API calls.

Dashboard UI must not recompute authoritative metrics in the browser.

The browser may format and display metrics, but aggregation logic remains server-side.

## 24. Transactions Policy

Transaction business behavior remains in `transactions/service.ts`.

Frontend transaction UI must not duplicate:

* category ownership validation
* subcategory ownership validation
* recipient resolution
* recipient creation
* normalized transaction field handling
* category/subcategory suggestion logic

Frontend transaction forms only collect, validate UI shape, map values, and call APIs.

## 25. Categories Policy

Category tree behavior remains in `categories/service.ts`.

The frontend may render, reorder visually if supported, and submit changes.

It must not duplicate:

* default seeding behavior
* reset-to-default behavior
* conflict handling
* ownership rules

The frontend categories UX must explicitly account for current backend delete/reset behavior:

* deleting a category or subcategory may remove the current assignment from existing transactions
* reset-to-default replaces the user category tree and may leave historical transactions uncategorized where relations are cleared
* destructive category actions should use clear confirmation copy and trigger transaction/dashboard cache invalidation

## 26. Recipients Policy

Recipient normalization and identifier inference remain in `recipients/service.ts`.

The frontend may display recipients and submit user-entered recipient fields only through transaction forms.

For v1, recipients are a read-only derived resource:

* the frontend may list recipients
* the frontend may show recipient detail data if needed
* the frontend does not own standalone recipient create/edit/delete flows
* recipient creation continues to happen implicitly during transaction create/update flows through backend recipient resolution

It must not duplicate:

* UPI inference
* phone inference
* card inference
* text identifier inference
* deduplication rules

## 27. URL Change Policy

The rewrite accepts the planned product URL changes in the new route structure.

Compatibility redirects from old product paths are optional and are not required for the initial rewrite.

Navigation, internal links, and tests should be updated to the new route structure as part of the rewrite.

## 28. Environment Variable Policy

Only public runtime configuration may use `NEXT_PUBLIC_`.

Allowed:

```txt
NEXT_PUBLIC_APP_URL
NEXT_PUBLIC_API_BASE_URL only when frontend and API are intentionally deployed on separate origins
```

Not allowed:

```txt
NEXT_PUBLIC_AUTH_SECRET
NEXT_PUBLIC_DATABASE_URL
NEXT_PUBLIC_GOOGLE_CLIENT_SECRET
NEXT_PUBLIC_API_SECRET
NEXT_PUBLIC_DEVICE_TOKEN_SECRET
```

Secrets must remain server-only.

## 29. Accepted Frontend Stack

The frontend will use:

```txt
Next.js App Router
TypeScript
Tailwind CSS
shadcn/ui
React Hook Form
Zod
TanStack Query
TanStack Table where needed
NextAuth/Auth.js
```

Zustand is not part of the default stack.

Zustand may be introduced only for durable cross-page UI state that is not server data.

Valid Zustand examples:

```txt
sidebar collapsed state
command palette open state
local UI preferences
```

Invalid Zustand examples:

```txt
transactions data
categories data
current user from backend
API loading state
API errors
```

## 30. Final Architecture Summary

```txt
Server-rendered read:
page.tsx
  -> page-data function
  -> session helper in `src/server/auth/session.ts`
  -> parse/validate plain params/searchParams
  -> service
  -> map service result to page DTO / notFound()
  -> render

Client-side read:
client component
  -> TanStack Query
  -> typed API client
  -> /api/*
  -> controller
  -> service

Client-side mutation:
form/client component
  -> React Hook Form / local state
  -> typed API client
  -> /api/*
  -> controller
  -> requireSessionUser
  -> Zod validation
  -> service
  -> HTTP response
  -> TanStack Query invalidation

External integration:
external caller / SMS importer
  -> /api/*
  -> controller
  -> token/session auth
  -> Zod validation
  -> service
  -> HTTP response
```


### 30.1 Implementation Sequence

Suggested order:

1. App route groups and protected app shell
2. Design tokens + `shadcn/ui` base components
3. API client + status/message-based `ApiClientError` + query keys
4. Auth boundaries and typed page-data functions
5. Dashboard read path
6. Categories and subcategories
7. Transactions list + URL state
8. Transaction create/edit/delete forms
9. Recipients read views
10. Settings/device tokens
11. Error/loading/not-found hardening
12. Landing page

### 30.2 CI Policy

CI must pass in this order:

1. `next typegen`
2. `tsc --noEmit`
3. `next build`
4. lint/check for no Server Actions
5. lint/check for no raw query key arrays outside query-key modules
6. lint/check for no direct `getServerSession(authOptions)` outside auth helper
7. lint/check for no client imports from `src/server/**`
8. lint/check for duplicate route paths across route groups

## Acceptance Criteria

The rewrite is acceptable only when:

* route groups are implemented as `(marketing)`, `(auth)`, and `(app)`
* authenticated app pages are protected server-side
* server-side auth flows use the local helpers in `src/server/auth/session.ts`
* API routes still enforce their own auth
* Server Actions are not used
* all mutations go through typed API client calls
* client-side server state uses TanStack Query
* query keys are centralized in feature-owned query-key modules
* backend business rules remain in services
* client components are limited to interaction and presentation
* meaningful transaction filters are stored in URL params
* query-state parsing is centralized
* App Router code follows Next.js 16.1 async dynamic API syntax
* dark-mode semantic tokens are implemented
* no theme toggle is exposed
* selected `design.md` is reflected in tokens and shared components
* App Router error/loading/not-found boundaries exist
* landing page remains separate from product shell decisions
* SMS import remains API/token based
* API error handling is centralized
* no raw backend URLs are scattered across components

## Dropped or Deferred Items

The following items are intentionally dropped or deferred from the v1 rewrite because the frontend must reuse the existing backend as-is.

### Dropped for V1

* standalone recipient create/edit/delete flows
* `POST /api/recipients` or any other new recipient mutation endpoint
* a mandatory JSON API error contract with machine-readable `code` fields across all endpoints
* a mandatory JSON API error contract with universal `fields: Record<string, string[]>`
* a broad auth-helper refactor or renaming pass as a prerequisite for the rewrite

### Deferred

* richer backend-standardized field error payloads beyond the current `message` plus endpoint-specific `issues` or `details`
* one minimal page-auth helper in `src/server/auth/session.ts` if layout/page redirect behavior needs it
* standalone recipient management if a future product need justifies backend expansion
* query hydration with `dehydrate()` and `HydrationBoundary` for top-level page surfaces that work cleanly with Mode A or Mode B
* dashboard interactive refresh ownership under TanStack Query unless the product surface later requires it
* backend query contract cleanup such as removing legacy CSV `categories` input or unifying all range readers to the same `endDate` bound semantics

