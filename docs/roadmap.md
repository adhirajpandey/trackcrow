# TrackCrow Roadmap

This document tracks current implementation status and near-term priorities. For current technical behavior, use the active docs in `docs/`.

## Completed Foundations

- The rewrite Prisma schema is the active data model.
- The app runs as a single Next.js monolith with stable route-handler, controller, service, and page-data boundaries.
- Google sign-in, user bootstrap, category seeding, and session-protected app routes are in place.
- SMS import, category/subcategory management APIs, transaction CRUD, dashboard summaries, recipient APIs, and device-token APIs are implemented.
- The current authenticated product surface includes dashboard, transactions, transaction detail, transaction create, recipients, recipient detail, and settings placeholder routes.

## Active Work

- The authenticated workspace shell and drilldown UX are still being refined.
- Transactions and recipients are the main active frontend patterns for server-first list pages with client-side query refetch.
- Shared table semantics and consistent URL-driven filter state are still being standardized across full data workspaces.
- `/settings` is still a placeholder route for account, device-token, and import configuration work.

## Next Priorities

- Rules: ship explicit rule-management and categorization workflows on top of the current deterministic import and recipient-history foundation.
- Budgets: add budget tracking after rules so limits and notifications are built on top of stable categorization behavior.
- Settings: replace the current placeholder with real account, device-token, and import-management flows.
- Categories: decide whether category management stays API-only for now or gets a dedicated authenticated page.
- Imports review: decide whether a manual review surface is still needed alongside the current deterministic SMS pipeline.

## Deferred

- `crowbot/chat`
- AI extraction beyond deterministic SMS parsing
- advanced categorization suggestions beyond current recipient-history behavior
- recurring spend detection
- exports or imports beyond SMS
- subscription or billing complexity
- richer backend-standardized field error payloads
- top-level `dehydrate()` / `HydrationBoundary` adoption as a default pattern
- repository or data-access extraction as optional architectural cleanup
- broad new automated table coverage as a prerequisite for UI iteration

## Archive

- Pre-rewrite baseline: [project-baseline-pre-rewrite.md](./archive/project-baseline-pre-rewrite.md)
- Migration rewrite plan: [rewrite-plan-archived-2026-06.md](./archive/rewrite-plan-archived-2026-06.md)
- Archived frontend spec: [frontend-trd-archived-2026.md](./archive/frontend-trd-archived-2026.md)
