> Historical artifact. This file preserves the migration-period rewrite plan and decision context. Use `docs/status/rewrite-status.md` for current state and `docs/reference/` for current implementation truth.

# TrackCrow Rewrite Plan

## Status

Working rewrite plan based on current codebase discovery and your product decisions. This document contains:

- the current-state inventory from the existing repo
- the proposed backend-first rewrite plan
- the locked product decisions that now shape backend scope

Where intent is still not fully settled, the document records the open design item explicitly instead of guessing.

## Current State Summary

TrackCrow is currently a Next.js App Router application with Prisma/PostgreSQL, NextAuth Google sign-in, route handlers, server actions, and a backend-first rewrite that is now largely behind `/api/*`.

Observed backend shape:

- API routes exist for `me`, `categories`, `categories/reset-defaults`, `device-tokens`, `imports/sms`, `recipients`, `subcategories`, `transactions`, `transactions/[id]/suggest`, and dashboard summaries.
- Server actions remain as UI adapters for form submission, but they now call the API surface instead of the backend modules directly.
- Backend service modules still contain the reusable business logic, while page-level server components now consume the internal API boundary.
- `crow-bot` has been removed from the rewrite branch.

Observed domain shape:

- `User`
- `Transaction`
- `Category`
- `Subcategory`
- `Recipient`
- `RecipientIdentifier`
- `RawMessage`
- `DeviceToken`
- app-local transaction type/source literals in `src/common/types.ts`
- device-token based SMS ingestion auth

Observed product shape from the code:

- Google sign-in
- default category bootstrapping on first login
- manual transaction entry
- SMS-driven transaction ingestion with parser templates
- transaction list/search/filter/sort
- dashboard summaries and categorical analytics
- user-managed categories and subcategories
- simple suggestion engine based on prior recipient categorization
- profile page with device token create/revoke

## Capability Map

| Area | Current behavior | Rewrite disposition |
| --- | --- | --- |
| Auth | Google OAuth via NextAuth, JWT session, user bootstrap | Keep, but simplify and isolate |
| User profile | Basic profile read, subscription flag, token utilities | Keep core profile, rethink subscription handling |
| Transactions | CRUD, list, search, filter, sort, category assignment | Keep as core v1 |
| SMS ingestion | Auth token + parser-based extraction + transaction creation | Keep as core candidate, redesign around source/import model |
| Categories | Default seed + user CRUD + nested subcategories | Keep, but reconsider taxonomy depth |
| Dashboard | Page-level analytics derived from transactions | Keep, but redesign query/read model boundaries |
| Suggestion | Recipient-based category suggestion | Defer until core categorization model is stable |
| Crowbot/chat | Route, orchestrator, prompts, tool execution | Defer from rewrite v1 |
| Preferences | Category management lives here today | Keep behavior, move behind clearer APIs/services |
| Profile token | Single per-user device token | Keep capability, redesign token/device ownership model |

## Rewrite Objectives

The rewrite should optimize for a cleaner backend foundation before any frontend rewrite. Since there are no active users, breaking changes are acceptable in schema, APIs, and route contracts.

Primary rewrite goals:

1. Define the actual product use case before finalizing schema and APIs.
2. Rebuild the backend around explicit domain boundaries instead of page-driven data access.
3. Standardize backend surfaces so the future frontend consumes stable, deliberate APIs.
4. Defer crowbot/chat until the core expense-tracking domain is stable.

## Locked Product Decisions

- Primary audience: you and people with similar profiles who want to track expenses.
- Product type: personal expense tracking, not household or business-first finance management.
- Core workflow: SMS-first, while still supporting manual entry properly.
- Category model: seeded defaults plus user edits.
- Raw SMS retention: store permanently.
- Client strategy: backend should stay client-agnostic even though the current client is the Next.js app.
- Backend v1 requirements: transaction CRUD, SMS ingestion, dashboard analytics, category management, device token flow, and suggestion engine.
- Deferred from v1: crowbot/chat.
- Privacy/security target for v1: standard app-level protection, with stronger privacy controls later.
- Migration target: the rewrite must support full production-database migration, not only one-user validation imports.
- Prisma migration strategy: the rewrite schema becomes the new clean baseline; old Prisma migration history will not be preserved.
- SMS duplicate policy: allow duplicate transactions, matching prior product behavior.
- Service/repository extraction: defer repository/data-access separation until the backend is running end-to-end.

## Proposed Rewrite Process

### Phase 1: Product Discovery and Scope Lock

Produce a short product brief before schema design:

- who the first real user is
- the primary workflow
- what must work in backend v1
- what is explicitly deferred
- what privacy expectations apply to financial and SMS data

Output of this phase:

- a locked v1 use case statement
- keep/rethink/defer/remove decisions for each current capability
- a list of non-goals for the first backend rewrite

Locked v1 use case statement:

- TrackCrow is a personal expense tracker for users like you who primarily want expenses to be captured from SMS, then reviewed, corrected, categorized, and analyzed through a clean app workflow.

### Phase 2: Backend Domain Design

Redesign the data model around the chosen use case, not around the current Prisma schema.

Core entities that likely remain necessary:

- `User`
- `Transaction`
- `Category`
- `TransactionSource` or equivalent import/source model
- `DeviceToken` or equivalent token/device auth model

Entities that should be evaluated, not assumed:

- `Subcategory`
- `Merchant` or `Counterparty`
- `Account` or `PaymentInstrument`
- `RawMessage`
- `SavedFilter` or user dashboard preferences

Working design direction:

- Make transactions the center of the domain.
- Treat ingestion source as explicit metadata rather than only `input_mode`.
- Separate auth identity from device/API ingestion auth.
- Avoid burying business logic inside pages and server actions.
- Prefer additive metadata for imports instead of overloading the transaction row.
- Keep permanent raw message retention, but model it deliberately instead of leaving it as an incidental nullable field.
- Resolve accounts/payment instruments during schema design, since this is the main remaining domain question.

### Phase 3: API-First Backend Surface

The rewrite should expose deliberate backend surfaces for the future frontend. The current mix of API routes, server actions, and direct page queries should be replaced with clearer boundaries.

Draft backend surfaces:

- `GET /api/me`
- `GET /api/categories`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `DELETE /api/categories/:id`
- `POST /api/categories/reset-defaults`
- `POST /api/subcategories`
- `PATCH /api/subcategories/:id`
- `DELETE /api/subcategories/:id`
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `GET /api/transactions/:id/suggest`
- `POST /api/imports/sms`
- `GET /api/device-tokens`
- `POST /api/device-tokens`
- `DELETE /api/device-tokens/:id` or revoke endpoint
- `GET /api/dashboard/summary`
- `GET /api/dashboard/spending-by-category`
- `GET /api/dashboard/spending-by-period`

Supporting but non-core v1 surfaces currently present in the rewrite:

- `GET /api/recipients`
- `GET /api/recipients/:id`

API contract decision:

- `recipients` should remain available in code for now as internal/supporting endpoints around the normalized recipient model.
- `recipients` are not part of the official backend v1 product contract.
- `subcategories`, `categories/reset-defaults`, and `GET /api/device-tokens` are part of the official backend v1 contract because the original product behavior depends on them.

Draft API design principles:

- JSON-first request/response contracts
- frontend should not depend on Prisma-specific shapes
- validation at the route boundary
- service layer owns business logic
- repository/data access layer owns persistence concerns

### Phase 4: Frontend Rewrite Preparation

Only after backend contracts are stable:

- redesign frontend routes against the new API surfaces
- remove page-level direct Prisma coupling
- replace server-action-only flows where API boundaries are required

Crowbot remains deferred and is not part of this rewrite branch.

## Backend V1 Proposal

This is the current backend v1 proposal based on the product decisions locked so far.

### In Scope

- authentication and user bootstrap
- user profile read for the signed-in user
- transaction CRUD
- category management
- SMS transaction ingestion
- dashboard summary read models
- device token management for ingestion clients
- recipient- or history-based suggestion behavior

### Deferred

- crowbot/chat
- AI-driven extraction beyond deterministic parsing
- advanced categorization suggestions
- budgets
- recurring spend detection
- exports/imports beyond SMS
- subscription/billing complexity

### Default Domain Assumptions

These are now active defaults unless changed later:

- TrackCrow is a personal expense tracker for users like you.
- SMS ingestion and manual entry are both supported, with SMS as the first-class workflow.
- Categories should start as default-provided plus user-editable.
- Raw SMS should be stored permanently.
- The backend should remain client-agnostic.
- Subcategories are optional and should stay only if they prove useful in the primary workflow.
- Device ingestion auth should not stay as a single naked token on the user row long-term.
- Chat should not drive any core schema decisions for v1.

## Current Technical Risks

- Backend logic is split across routes, actions, services, and direct page queries, which will make partial rewrites brittle.
- Current schema mixes source/import concerns directly into `Transaction`.
- Category and subcategory design may be more complex than the real use case needs.
- `lt_token` on `User` is workable for v1 but weak as a long-term device auth model.
- Current dashboard behavior is tightly coupled to UI-oriented transaction fetch patterns rather than explicit analytics endpoints.
- Crowbot already depends on transaction/category semantics, so schema changes need a deliberate future compatibility plan even if chat is deferred.
- Permanent raw SMS retention increases privacy and schema design pressure, so message storage needs a clear purpose and boundary.
- Suggestion behavior is in v1 scope, so transaction, recipient, and category relationships need to support lightweight inference without depending on chat.
- Production migration now matters more than local architecture cleanup, so migration correctness and repeatability are the primary delivery risks.

## Implementation Strategy For The Rewrite

1. Freeze current behavior in a discovery note and route/service test inventory.
2. Lock the remaining domain design choices, especially account and payment-instrument modeling.
3. Design the new Prisma schema from the locked use case.
4. Define route contracts and payload schemas before writing handlers.
5. Implement backend modules in layers:
   - route validation
   - application/service logic
   - persistence access
6. Add Jest coverage around the new route contracts and service behavior.
7. Rewrite frontend pages only after backend contracts stop moving.

Implementation priority update:

- With the backend rewrite and internal API boundary now in place, the next priority is production migration readiness rather than service/repository layering.
- Repository/data-access extraction remains desirable, but it is explicitly deferred until the backend is operating correctly against the migrated rewrite database.

Recommended backend delivery order:

1. auth and user bootstrap
2. categories and taxonomy rules
3. transaction core model and CRUD
4. device token flow
5. SMS ingestion pipeline
6. suggestion behavior
7. dashboard analytics read models

## Test Plan For The Rewrite

The new backend plan should preserve or replace current behavior through tests in these areas:

- auth required vs unauthorized responses
- signed-in user read endpoint
- transaction create/read/update/delete
- transaction filtering, pagination, search, and sorting
- category CRUD and category-to-transaction constraints
- SMS ingestion success path
- SMS ingestion invalid payload, unauthorized token, and unparseable message paths
- suggestion behavior based on historical transactions or recipients
- dashboard summary aggregation correctness
- device token creation and revocation

Where possible, existing API tests should be used as reference behavior, not copied blindly.

## Remaining Open Design Item

One product-model decision is still intentionally open:

- Should accounts or payment instruments become first-class entities in backend v1, or should the rewrite continue to keep them as transaction-level attributes and revisit normalization later?

Current recommendation:

- Keep them as transaction-level attributes in the first backend rewrite unless the schema design shows a strong need for account-level reporting, account-specific filters, or import deduplication logic.

## Next Update To This Document

The next revision of this document should add:

- the proposed Prisma model set
- final API payload shapes
- migration/reset strategy
- frontend dependency notes for the later rewrite phase

That migration/reset strategy is now partially implemented for local validation and should be treated as the seed for the real production migration workflow, not the final production procedure itself.

## Implementation Status Update

This section records what has already been done in the backend rewrite branch so the document reflects the actual repo state rather than only the original intent.

### Completed In This Rewrite Branch

- Replaced the old core schema direction with a new backend-first Prisma model set centered on:
  - `User`
  - `Category`
  - `Subcategory`
  - `Recipient`
  - `RecipientIdentifier`
  - `Transaction`
  - `RawMessage`
  - `DeviceToken`
- Added a new generated Prisma client path for the rewrite backend and moved it out of git tracking:
  - `src/generated/prisma-rewrite`
  - `src/lib/prisma-rewrite.ts`
- Updated auth/bootstrap flow to use the rewrite backend model and idempotent default category setup.
- Implemented the new backend module structure under `src/server/`:
  - `api/`
  - `auth/`
  - `modules/categories/`
  - `modules/dashboard/`
  - `modules/device-tokens/`
  - `modules/imports/`
  - `modules/recipients/`
  - `modules/transactions/`
  - `modules/users/`
  - `shared/`
- Implemented the planned backend v1 route surface:
  - `GET /api/me`
  - `GET /api/categories`
  - `POST /api/categories`
  - `PATCH /api/categories/:id`
  - `DELETE /api/categories/:id`
  - `POST /api/categories/reset-defaults`
  - `GET /api/recipients`
  - `GET /api/recipients/:id`
  - `GET /api/transactions`
  - `POST /api/transactions`
  - `GET /api/transactions/:id`
  - `PATCH /api/transactions/:id`
  - `DELETE /api/transactions/:id`
  - `GET /api/transactions/:id/suggest`
  - `POST /api/imports/sms`
  - `GET /api/device-tokens`
  - `POST /api/device-tokens`
  - `DELETE /api/device-tokens/:id`
  - `GET /api/dashboard/summary`
  - `GET /api/dashboard/spending-by-category`
  - `GET /api/dashboard/spending-by-period`
- Added `GET /api/subcategories` / `PATCH /api/subcategories/:id` / `DELETE /api/subcategories/:id` support for taxonomy editing parity.
- Removed legacy API routes superseded by the rewrite:
  - `api/chat`
  - `api/transactions/sms`
  - `api/user/self`
- Removed the Crow Bot backend/application surface from the repo.
- Removed the old backend service layer and old shared backend schema helpers:
  - `src/services/**`
  - `src/common/server.ts`
  - `src/common/schemas.ts`
  - legacy `src/lib/prisma.ts`
- Added app-facing shared DTO/types and enum literals in `src/common/types.ts`.
- Moved page-level reads and server-action mutations onto the internal API boundary.
- Removed stale generated Prisma output from git tracking and updated ignore rules.
- Fixed the repo lint entry for ESLint 9 / Next 16.
- Added route-level Jest coverage for the rewritten backend routes, including subcategory routes, during the initial backend rewrite pass.
- Replaced most rewritten route-test coverage with focused service-level Jest coverage for:
  - `categories`
  - `dashboard`
  - `device-tokens`
  - `imports`
  - `transactions`
- Verified `pnpm exec tsc --noEmit`, `pnpm lint`, `pnpm exec jest --runInBand`, and `pnpm build` on the rewrite branch.

### Verified So Far

- Core rewritten service tests are passing for categories, dashboard, device tokens, imports, and transactions.
- SMS parser tests are passing.
- The rewritten backend route surface is functional, with controller/service layering in place behind `/api/*`.
- `next.config.ts` now uses `images.remotePatterns` for the Google-hosted profile images used by auth.

### What Is Still Missing Relative To The Original Plan

- Some backend cleanup items are being deferred deliberately so frontend rewrite work can start against the stabilized API surface instead of waiting for lower-priority backend refinements.
- Prisma access still lives directly inside service modules instead of a separate repository/data-access layer.
- The app still uses server actions as thin UI adapters; that is acceptable for now, but it is not the final external-client story.
- Service-level/domain-level coverage still has gaps around recipient resolution, user bootstrap/auth flows, migration invariants, and some edge-case analytics/suggestion behavior.
- The migration/deployment knowledge is captured in this document and scripts, but not yet condensed into a single canonical production runbook.

## Migration And Deployment Status

This section records the migration tooling and the completed production rewrite migration.

### Implemented Migration Tooling

- Added full-database export/import tooling under `scripts/`:
  - `rewrite_migration_lib.py`
  - `export-rewrite-source.py`
  - `import-rewrite-target.py`
  - `migrate-rewrite-production.ps1`
  - `migrate-rewrite-production-inplace.ps1`
  - `reset-production-public-schema.py`
  - `setup-raspi-rewrite-db.ps1`
  - `set-rewrite-db-env.py`
- Added local migration artifact ignore rules for `/scripts/data/` and `__pycache__/`.
- The migration tooling now:
  - exports all legacy users and their categories, subcategories, and transactions
  - creates deterministic recipient and recipient-identifier rows from legacy transaction data
  - maps legacy `input_mode` to rewrite `source`
  - maps legacy transaction fields onto rewrite transaction columns
  - migrates legacy `raw_message` values into rewrite `raw_message`
  - migrates legacy `lt_token` values into rewrite `device_token`
  - resets sequences after explicit ID inserts
  - writes `verification.json` and fails if count or timestamp checks fail

### Raspberry Pi Full Dry Run Completed

- Provisioned and force-reset a dedicated Postgres 16 container on the Raspberry Pi reachable over Tailscale.
- Ran a full production-data export/import dry run against the fresh rewrite target.
- Verified all expected counts and the locked timestamp sample before touching production.

### Production Migration Completed

- Created final production export at `scripts/data/production-final-export-20260613-184313`.
- Reset the existing production managed Postgres `public` schema.
- Prisma `migrate deploy` could not be used against the pooled production URL during the cutover, so the rewrite baseline SQL was applied directly.
- Imported the final production export into the rewrite schema.
- Deployed the rewrite backend successfully.
- Confirmed a post-deploy transaction categorization write landed in production:
  - transaction `4881`
  - category `Shopping`
  - subcategory `Others`

### Production Verification Results

- Final migrated production counts:
  - `user`: 8
  - `category`: 28
  - `subcategory`: 112
  - `recipient`: 1360
  - `recipient_identifier`: 1686
  - `transaction`: 3840
  - `raw_message`: 1625
  - `device_token`: 3
- Timestamp sample verification:
  - transaction `4878`
  - source timestamp: `2026-06-12T16:50:34.186000`
  - migrated instant: `2026-06-12T16:50:34.186000+00:00`
  - rendered IST: `2026-06-12T22:20:34.186000+05:30`
- Production now contains only the rewrite schema tables:
  - `category`
  - `device_token`
  - `raw_message`
  - `recipient`
  - `recipient_identifier`
  - `subcategory`
  - `transaction`
  - `user`

### Mobile SMS Ingestion Contract

- Mobile clients should send SMS payloads to `POST /api/imports/sms`.
- Auth header format is `Authorization: Token <device-token>`.
- Request body shape is:

```json
{
  "data": {
    "message": "<full SMS text>"
  },
  "metadata": {
    "location": null
  }
}
```

- The removed legacy endpoint `POST /api/transactions/sms` should no longer be used.

## Timestamp Migration Decision

This section records the current timestamp interpretation decision so the migration logic does not drift later.

### Decision

- Legacy `transaction.timestamp` values should be treated as UTC-semantic timestamps even though the legacy column type is `timestamp without time zone`.
- Rewrite `transaction.timestamp` should remain `timestamptz` and preserve the same instant.
- UI rendering should continue to convert stored instants into `Asia/Kolkata` for display.

### Why This Is The Current Recommendation

- A real transaction check (`transaction.id = 4878`) showed:
  - legacy source `timestamp = 2026-06-12 16:50:34.186`
  - the app UI displayed the corresponding India wall-clock time around `22:20`
  - the migrated rewrite DB stores `2026-06-12 22:20:34.186+05:30`
- This means the existing product behavior was already effectively treating the legacy stored value as a UTC-like instant and formatting it into IST for users.
- Reinterpreting old legacy values as raw IST wall-clock times during migration would shift user-visible transaction times by `5 hours 30 minutes` relative to what users actually saw in the app.

### Operational Rule

- For migrated legacy transaction timestamps:
  - interpret the legacy naive timestamp as UTC
  - write the same instant into rewrite `timestamptz`
- Apply the same rule to legacy audit timestamps (`createdAt`, `updatedAt`) unless stronger contrary evidence appears.
- Do not rely on database server timezone defaults during migration.
- Do not mix UTC and IST interpretation rules across different legacy rows.

### Follow-Up Required

- Lock this behavior in migration tests with known examples, including `transaction.id = 4878`.
- Add compare-report output that verifies:
  - source timestamp string
  - migrated instant
  - rendered IST display value
- Document the same rule in the final production migration runbook.

## Next Steps

The next implementation steps should be:

1. Refresh this rewrite document whenever implementation status changes so it stays usable as the source of truth.
   - remove stale "pending" items once they land
   - keep the completed-vs-remaining sections aligned with git history

2. Add the remaining focused service/domain and migration tests.
   - recipient resolution behavior
   - user bootstrap/auth service behavior
   - timestamp migration invariants and verification output
   - dashboard/suggestion edge cases beyond the current representative coverage

3. Turn the migration and deployment notes into a single production runbook.
   - export/import procedure
   - baseline SQL application path
   - verification checklist
   - timestamp interpretation rule
   - failure and rollback handling

4. Run a post-migration production hardening pass.
   - SMS import behavior under production-like inputs
   - device-token lifecycle and revocation behavior
   - transaction/category/subcategory ownership enforcement
   - logging and failure-path review

Deferred until after the backend is running cleanly on the migrated rewrite database:

- This deferral is voluntary. These items are not current blockers for the frontend rewrite, and they are being postponed intentionally to keep work focused on the next highest-value phase.
- repository/data-access separation for runtime modules such as `transactions`, `categories`, and `device-tokens`
