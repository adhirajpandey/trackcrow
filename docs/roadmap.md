# TrackCrow Roadmap

This document tracks current implementation status and near-term priorities. For current technical behavior, use the active docs in `docs/`.

## Completed Foundations

- The rewrite Prisma schema is the active data model.
- The app runs as a single Next.js monolith with stable route-handler, controller, service, and page-data boundaries.
- Google sign-in, user bootstrap, category seeding, and session-protected app routes are in place.
- SMS import, category/subcategory management APIs, transaction CRUD, dashboard summaries, recipient APIs, rule lifecycle APIs, and scoped personal API tokens are implemented.
- MCP v1 exposes transaction search, summaries, categories, recipients, manual creation, and categorization with PostgreSQL-backed fixed-window limits.
- MCP OAuth supports public CIMD clients, PKCE, selectable transaction scopes, rotating refresh tokens, and revocable Connected Apps while retaining PAT authentication.
- Recipient-based rules classify new imported transactions while preserving manual, suggestion, and rule provenance.
- The current authenticated product surface includes dashboard, transactions, transaction detail, transaction create, recipients, recipient detail, rules, and token settings.

## Active Work

- The authenticated workspace shell and drilldown UX are still being refined.
- Transactions and recipients are the main active frontend patterns for server-first list pages with client-side query refetch.
- Shared table semantics and consistent URL-driven filter state are still being standardized across full data workspaces.

## Next Priorities

- Budgets: add budget tracking so limits and notifications are built on top of stable categorization behavior.
- Rate limits: replace the PostgreSQL adapter with a shared store if MCP traffic makes per-request database writes too costly.
- Categories: decide whether category management stays API-only for now or gets a dedicated authenticated page.
- Imports review: decide whether a manual review surface is still needed alongside the current deterministic SMS pipeline.

## Deferred

- `crowbot/chat`
- AI extraction beyond deterministic SMS parsing
- advanced categorization suggestions beyond current recipient-history behavior
- recurring spend detection
- exports or imports beyond SMS
- subscription or billing complexity
- OAuth consent reuse, HTTP insufficient-scope upgrade challenges, and token management through MCP
- richer backend-standardized field error payloads
- top-level `dehydrate()` / `HydrationBoundary` adoption as a default pattern
- repository or data-access extraction as optional architectural cleanup
- broad new automated table coverage as a prerequisite for UI iteration
