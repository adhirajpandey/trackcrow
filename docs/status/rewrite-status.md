# TrackCrow Rewrite Status

This document tracks current implementation status and intentionally deferred scope. For implementation details, use the canonical reference docs in [`docs/reference/`](../reference/).

## Completed

- The rewrite schema is the active Prisma baseline.
- The production rewrite migration is complete and is no longer a planning dependency.
- The backend is organized around `/api/*` route handlers, controllers, services, and page-data helpers.
- Current implemented workspace surfaces include dashboard, transactions, transaction detail, recipients, and recipient detail.
- SMS import, category/subcategory management APIs, recipient APIs, dashboard summaries, transaction CRUD, and device-token APIs are in place.

## Active

- The authenticated workspace shell and drilldown UX are still being refined.
- `/categories`, `/settings`, and `/imports/review` remain placeholder routes with preserved route shape and carried context.
- The frontend implementation spec remains in [frontend-trd.md](./frontend-trd.md).
- Table workspace standardization is active. The target is a shared semantic table foundation using shadcn-style table primitives and TanStack Table for full data workspaces.
- Transactions and recipients should share the same server-driven table pattern: server page initial fetch -> client table view -> TanStack Query refetch -> API route -> service.
- Recipients already uses the target server/API-backed query flow for search, sort, and pagination; it is the first UI rewrite candidate for the shared table foundation.
- Mobile row-detail drawer behavior is included in this table pass for full data workspaces. Desktop and tablet may keep normal detail-page navigation in the same pass.
- Full data workspaces should preserve URL state for shareable table state, including `q`, `page`, `size`, `sortBy`, `sortOrder`, and feature-specific filters.
- The recipients workspace table should replace `normalizedName` and list `status` columns with `total amount sent`, which requires a recipients list aggregate in the backend/API contract.
- Dashboard and detail-page mini tables should move to semantic table markup, but they do not need TanStack Table unless they become independently sortable, pageable, or selectable.
- This pass does not require new broad automated table tests; verification is primarily manual unless a touched area needs a narrow regression test to stay safe.

## Deferred

- `crowbot/chat`
- AI extraction beyond deterministic SMS parsing
- advanced categorization suggestions beyond the current recipient-history behavior
- budgets
- recurring spend detection
- exports/imports beyond SMS
- subscription or billing complexity
- standalone recipient management beyond the current existing backend surface
- richer backend-standardized field error payloads
- top-level query hydration with `dehydrate()` / `HydrationBoundary`
- dashboard interactive refresh ownership under TanStack Query unless the product surface requires it
- backend query contract cleanup such as legacy CSV category input normalization and date-range consistency work
- repository/data-access extraction as optional architectural cleanup, no longer blocked on migration
- table bulk-selection bars until a real bulk workflow exists
- column-visibility menus until a full data workspace has enough optional columns to justify them
- a single magic global table component that owns domain columns, actions, and backend rules
- broad new automated table test coverage as a prerequisite for this pass

## Historical Context

- The migration-period rewrite plan is preserved at [history/plans/rewrite-plan-archived-2026-06.md](../history/plans/rewrite-plan-archived-2026-06.md).
- The pre-rewrite baseline is preserved at [history/baselines/project-baseline-pre-rewrite.md](../history/baselines/project-baseline-pre-rewrite.md).
