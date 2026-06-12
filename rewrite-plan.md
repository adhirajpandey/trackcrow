# TrackCrow Rewrite Plan

## Status

Working rewrite plan based on current codebase discovery and your product decisions. This document contains:

- the current-state inventory from the existing repo
- the proposed backend-first rewrite plan
- the locked product decisions that now shape backend scope

Where intent is still not fully settled, the document records the open design item explicitly instead of guessing.

## Current State Summary

TrackCrow is currently a Next.js App Router application with Prisma/PostgreSQL, NextAuth Google sign-in, server actions, API routes, and a mixed backend access pattern.

Observed backend shape:

- API routes exist for `transactions`, `transactions/sms`, `transactions/[id]/suggest`, `user/self`, `chat`, and NextAuth.
- Server actions are used for manual transaction creation, transaction updates/deletes, category management, and profile token operations.
- Service modules contain most reusable backend logic, but some page-level server components still query Prisma directly.
- `crow-bot` is a meaningful subsystem with route, orchestration, tool handlers, prompts, and tests, but it is separable from the core expense-tracking backend.

Observed domain shape:

- `User`
- `Transaction`
- `Category`
- `Subcategory`
- enum-based transaction type and input mode
- user-level long-lived device token (`lt_token`) used for SMS ingestion auth

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
- AI chat assistant tied to transaction queries and expense recording

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
- `GET /api/transactions`
- `POST /api/transactions`
- `GET /api/transactions/:id`
- `PATCH /api/transactions/:id`
- `DELETE /api/transactions/:id`
- `POST /api/imports/sms`
- `POST /api/device-tokens`
- `DELETE /api/device-tokens/:id` or revoke endpoint
- `GET /api/dashboard/summary`
- `GET /api/dashboard/spending-by-category`
- `GET /api/dashboard/spending-by-period`

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

Crowbot remains deferred unless backend schema decisions require placeholder integration points.

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

One decision is still intentionally open because you marked it as unsure:

- Should accounts or payment instruments become first-class entities in backend v1, or should the first rewrite keep them as transaction-level attributes and revisit normalization later?

Current recommendation:

- Keep them as transaction-level attributes in the first backend rewrite unless the schema design shows a strong need for account-level reporting, account-specific filters, or import deduplication logic.

## Next Update To This Document

The next revision of this document should add:

- the proposed Prisma model set
- final API payload shapes
- migration/reset strategy
- frontend dependency notes for the later rewrite phase

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
- Added a new generated Prisma client path for the rewrite backend:
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
- Added app-facing shared DTO/types in `src/common/types.ts`.
- Moved active page-level backend usage away from the deleted old service layer and onto the rewrite backend modules.
- Added route-level Jest coverage for the rewritten backend routes.

### Verified So Far

- Rewritten API route tests are passing.
- SMS parser tests are passing.
- The rewritten backend route surface is functional in test coverage.

### What Is Still Missing Relative To The Original Plan

- The frontend is not yet fully API-first:
  - several pages still call backend modules or server actions directly instead of consuming the rewritten JSON APIs.
- The backend layering is improved but not final:
  - Prisma access still lives directly inside service modules instead of a separate repository/data-access layer.
- Some frontend code still depends on Prisma-generated enums/types instead of app-local shared types.
- Repo hygiene is not fully closed out:
  - stale `.next` generated validator artifacts still exist
  - stale comments and empty leftover directories still need cleanup
  - lint/typecheck verification is not yet clean end-to-end
- The migration/reset path exists but still needs final full verification against a clean local reset/build cycle.
- Service-level/domain-level tests are thinner than originally intended; most coverage today is route-level.

## Next Steps

The next implementation steps should be:

1. Clean the repo state fully.
   - Remove empty leftover legacy directories.
   - Remove stale references/comments.
   - Ensure deleted legacy backend files are fully gone from active imports.

2. Get the branch to a clean verification baseline.
   - Stop any running Next/dev processes.
   - clear `.next`
   - run `pnpm exec tsc --noEmit`
   - fix the repo lint setup or replace the stale lint path with a working one

3. Finish the frontend boundary migration.
   - Move remaining page/server-action mutations to consume the rewritten API routes where that is the intended long-term boundary.
   - Keep the frontend client-agnostic contract aligned with the backend DTOs rather than Prisma shapes.

4. Remove remaining Prisma-specific types from frontend code.
   - keep Prisma enums/types inside `src/server` where possible
   - use `src/common/types.ts` for app-facing DTOs

5. Introduce repository/data-access separation for the highest-value modules first.
   - start with `transactions`
   - then `categories`
   - then `device-tokens`

6. Add focused service/domain tests for core behavior.
   - recipient resolution
   - SMS import persistence rules
   - category/subcategory ownership validation
   - suggestion behavior

7. Run a final backend rewrite checkpoint after cleanup.
   - schema generate
   - migration/reset verification
   - typecheck
   - route tests
   - lint
