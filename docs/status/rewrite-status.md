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

## Historical Context

- The migration-period rewrite plan is preserved at [history/plans/rewrite-plan-archived-2026-06.md](../history/plans/rewrite-plan-archived-2026-06.md).
- The pre-rewrite baseline is preserved at [history/baselines/project-baseline-pre-rewrite.md](../history/baselines/project-baseline-pre-rewrite.md).
