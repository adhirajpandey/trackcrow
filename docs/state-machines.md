# State machines

This is a source audit of the web app, HTTP/MCP backend, and Android client at `238f151`, with the recipient creation and SMS response changes described below. It groups repeated implementations of the same workflow. It is an inventory of discovered machines, not a claim that static inspection proves every possible runtime transition safe.

A machine can be a discriminated union, a database record with timestamps, a query library, or a set of component fields. Independent facts such as a permission and a user's preference should remain independent. Derive whether an operation is allowed from both facts.

## Decisions

Keep the existing React Query, React Hook Form, database transactions, and local pure-function patterns. A new state-machine dependency or an application-wide rewrite would add migration risk without solving the observed failures.

Make multi-step outcomes explicit where they affect recovery or data loss. Keep a single boolean for simple open/closed disclosure. Keep durable state on the server for shared operations; client state only describes a draft or the progress of a request. New clients and agents should call the same services through the existing APIs and MCP tools.

This change makes two workflows explicit:

- Recipient creation uses `RecipientCreateState` and `recipientCreateTransition`. Editing clears conflict/error feedback. Submitting freezes the name and rejects another submit. A request identity guards asynchronous completion; cancel and unmount invalidate that identity. Closing does not undo a server create that already reached the server; the late response cannot select a recipient into the transaction draft.
- SMS upload uses `SmsResponseOutcome`. HTTP 200/201 acknowledges an import, 400/422 discards an invalid payload, and 401/403 clears the rejected session's queue. Every other response retains the item and stops the drain for a later retry. Previously, unexpected responses silently removed queued text. Existing seven-day expiry, 200-item limit, owner binding, and arrival idempotency keys still apply.

The changes improve recovery for users, provide typed transitions for developers, and give agents concrete guards and outcomes to inspect. They do not change HTTP contracts, persisted formats, or database schemas.

## Web workflows

Paths below are relative to the repository root. Repeated CRUD screens share a row when their transition rules match.

| Machine | States and transitions | Owner and invariant |
| --- | --- | --- |
| Landing navigation | Initial visit or internal return; session present, absent, or unavailable | `src/components/product/landing-navigation.tsx`, `src/app/(marketing)/page.tsx`. Only the authenticated initial visit redirects. |
| Web authentication | Unauthenticated, sign-in pending, authenticated, sign-in failure, signed out | `src/components/product/google-sign-in-button.tsx`, `src/lib/auth.ts`, `src/server/auth/`. Page and API guards remain authoritative. |
| Query lifecycle | Pending, data, error, refetch with existing data | `src/features/*/queries.ts`, `src/lib/query/query-client.tsx`. React Query owns request state; 401 triggers sign-out. |
| URL filters and pagination | Applied URL state, local draft, apply, reset, page change | `src/features/*/query-state.ts`, `src/features/transactions/url-state.ts`, page filter controls. A draft does not change results until applied. |
| Date-range picker | Closed, preset/custom draft, invalid range, applied range, cancelled | `src/components/product/timeframe-picker.tsx`, `src/components/product/mobile/mobile-time-period-row.tsx`. Cancel preserves the applied range. |
| Popovers, navigation and disclosures | Closed/open; select additionally has active keyboard option and placement | `src/components/ui/select.tsx`, `src/components/product/app-shell.tsx`, dashboard/insights UI. Keep these local; no domain workflow engine needed. |
| Transaction creation | Draft, invalid, pending create, created or ignored by rule, failure | `src/app/(app)/transactions/new/_components/transaction-create-page-view.tsx`, `transaction-create-model.ts`. Validation and rule outcomes precede navigation. |
| Recipient search/creation | Search/debounce, results or empty/error, selection, create dialog | `src/app/(app)/transactions/new/_components/recipient-picker.tsx`, `recipient-create-state.ts`. Conflict belongs to the submitted name; a dismissed request cannot select into the form. |
| Transaction edit and suggestion | Clean/dirty, suggesting, suggestion applied, saving, saved but refetch failed, error, deleting | `src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx`, `transaction-detail-model.ts`. Operation ref excludes save/suggest overlap; classification revisions reject stale suggestions; dirty drafts survive refetch. |
| Deletion confirmation | Closed, confirmation, pending deletion, success/error | `src/app/(app)/transactions/_components/transaction-delete-dialog.tsx`. Confirmation precedes mutation. |
| Recipient edit and alias transfer | Clean/dirty, saving, alias conflict/impact, confirm transfer, success/error | `src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx`. Transfer requires explicit confirmation of impact. |
| Rule editor | Closed/create/edit, local valid/invalid action, submitting, conflict/error, saved | `src/app/(app)/rules/_components/rules-page-view.tsx`. Category/subcategory must agree; repair precedes enabling. |
| Bulk categorization and undo | Applying, partial/full failure or success, optional rule creation, undo, partial undo | `src/features/dashboard/mutations.ts`. Restore only successfully updated transactions; report rule and transaction failures separately. |
| Account editor | Closed, creating/editing, validating, pending, conflict/error, saved | `src/components/product/account-dialog.tsx`, `src/app/(app)/settings/account-settings.tsx`. Mutation success precedes selecting the account. |
| Personal token UI | Draft scopes/label, creating, plaintext revealed once, copy, revoked | `src/app/(app)/settings/token-settings.tsx`. Plaintext is a transient creation response. |
| Connected apps | Loading/data/error, active/expired/revoked, revoke pending | `src/app/(app)/settings/connected-apps.tsx`, `src/features/oauth/`. Server expiry and revocation determine access. |
| Route recovery | Loading, rendered, not found, error/retry | App Router `loading.tsx`, `error.tsx`, `not-found.tsx`. Route boundaries own recovery. |

## Server workflows

| Machine | States and transitions | Owner and invariant |
| --- | --- | --- |
| User bootstrap | Missing user/defaults, upserted user, initialized defaults | `src/server/modules/users/service.ts`. Web and mobile share identity/bootstrap. |
| Transaction classification | Automatic/unassigned, rule assigned or ignored, manual, suggested, cleared | `src/server/modules/rules/evaluator.ts`, `src/server/modules/transactions/service.ts`. Manual intent wins; category, subcategory, source and rule provenance must agree. |
| Rule lifecycle | Enabled valid, disabled valid, needs repair, soft-deleted | `src/server/modules/rules/service.ts`, `src/server/modules/categories/service.ts`. Category deletion/movement disables affected rules and marks repair; unusable rules cannot be enabled. |
| Category/subcategory lifecycle | Create, rename/move, delete; dependent transactions and rules updated | `src/server/modules/categories/service.ts`. Multi-record changes use transactions. |
| Recipient identifier ownership | Unowned, attached, conflict, transferred or removed | `src/server/modules/recipients/service.ts`. Conflict returns transfer impact; ownership changes and dependent records stay transactional. |
| Account matching | No normalized match, unique match, ambiguous match; rename/delete | `src/server/modules/accounts/service.ts`, `normalize.ts`, import service. SMS links only a unique user-owned match. |
| SMS import/deduplication | Key absent, reserved inside transaction, parsed/ignored/unparseable/failed; duplicate replay | `src/server/modules/imports/service.ts`, `prisma/schema.prisma`. Unique user/key reservation and domain write commit together; transient internal failures roll back the reservation. |
| PAT authentication | Issued, active, revoked; last-used update throttled | `src/server/modules/api-tokens/service.ts`, `src/server/auth/`. Scope and revocation are checked on each request; supplied credentials do not fall back to a browser session. |
| OAuth metadata | Uncached, fetching/validated, cached, expired, rejected | `src/server/modules/oauth/cimd.ts`. Validate public HTTPS destinations and bound fetching/cache lifetime. |
| OAuth consent | Validated request, cookie/account-bound consent, approve/deny, expired or consumed nonce | `src/server/modules/oauth/controller.ts`, `crypto.ts`, `browser-consent.ts`. Consent identity and nonce prevent substituting or repeating approval. |
| Authorization code | Issued, consumed, expired | `src/server/modules/oauth/service.ts`. Conditional consume under a connection lock makes exchange single-use. |
| OAuth connection/access | Active, expired or revoked; access token also expires independently | Same service and `prisma/schema.prisma`. Both token and connection must permit access. |
| Refresh rotation | Unused, consumed with successor, expired; replay revokes connection | Same service. Row locks serialize rotation/revocation. Replay revocation commits before the protocol error is returned. |
| Rate limit | Available budget, exhausted, window expired/reset | `src/server/rate-limit/`, `src/server/mcp/request-protection.ts`. Storage owns atomic budget changes. |
| Diagnostics submission | Validated, rate limited, stored or failed | `src/server/modules/diagnostics/`. Explicit client submission, bounded payload and user ownership. |

## Android workflows

| Machine | States and transitions | Owner and invariant |
| --- | --- | --- |
| Session hydration/sign-in/sign-out | Loading, missing, ready; Google cancellation/exchange failure; local cleanup with revocation result | `mobile/src/lib/credentials.tsx`, `session.ts`, `credential-store.ts`. Commit the stored token last; clear pending SMS on session change. |
| Unauthorized response | Current session rejected, cancelling queries/signing out, settings recovery | `mobile/src/components/session-boundary.tsx`. Ignore rejection from an older session; hide authenticated content during cleanup. |
| First-run routing | Unknown/incomplete/complete setup, legacy upgrade, setup/settings exemption | `mobile/src/app/_layout.tsx`, `mobile/src/lib/onboarding.ts`. Corrupt setup stays incomplete; only absent records qualify for the upgrade exception. |
| Setup wizard | Welcome, sign-in, bank, unsupported, SMS explanation, permission, location, accounts, done; back history | `mobile/src/app/onboarding/index.tsx`. Manual mode never requests SMS permission; completing setup persists the chosen mode. |
| SMS permission | Denied, granted, never ask again; one request in flight | `mobile/src/lib/sms-permission.ts`. Persist the decision before prompting; automatic requests respect previous decisions. |
| SMS import eligibility | Setup/permission/session loading, paused/manual, enabled, auth rejected | `mobile/src/lib/sms-ingestion.tsx`, `onboarding.ts`. A session, SMS mode and granted permission are all required. |
| SMS queue/drain | Durable pending, sending, imported/discarded, retry, auth rejected, cleared/expired | `mobile/src/lib/sms-import.ts`. Serialize work; generation invalidates old jobs on clear; persist before send; retain the same UUID on retry. |
| Sender configuration | Bundled fallback, cached validated config, fetching, accepted or rejected update | `mobile/src/lib/sms-config.ts`, `mobile/modules/trackcrow-sms/`. Invalid updates preserve the working configuration; native receiver validates independently. |
| Payment location | Off, on, foreground blocked, needs background permission | `mobile/src/lib/payment-location.ts`. Preference off prevents capture and erases queued locations; retries use arrival location only while enabled. |
| Native SMS delivery | Received multipart message, assembled arrival, headless task, queued upload | `mobile/modules/trackcrow-sms/`, `mobile/index.js`, `mobile/src/lib/sms-import-native.ts`. Arrival UUID precedes upload; no inbox backfill. |
| Query cache and drafts | Pending/data/error/refetch; clean/dirty form; pending mutation, success/failure | `mobile/src/lib/query-keys.ts`, `mobile/src/lib/*-draft.ts`, `mobile/src/app/`. Tokens stay out of cache keys. |
| Classification/review/undo | Queue loading/empty/current item, choosing, saving, optional rule prompt, advance, undo | `mobile/src/components/transactions/`, `mobile/src/app/review/`. Undo restores the original classification and invalidates dependent reads. |
| Native editors and sheets | Closed/open draft, validation, saving, conflict, success/error | `mobile/src/components/`, accounts/categories/recipients/rules screens. Confirm destructive changes and alias transfers. |
| Diagnostics preview/send | Local events, compose, preview snapshot, sending, success/failure | `mobile/src/app/diagnostics.tsx`, `mobile/src/lib/debug-log.ts`. Logging uses fixed attributes; upload follows an explicit Send action. |

## Regression evidence and remaining work

`recipient-create-state.test.ts` covers conflict correction, empty input, submission exclusion, failed-request retry, and out-of-phase completions. `mobile/src/lib/sms-import.test.ts` exercises durable retry, terminal responses, authentication rejection, ownership changes, concurrent arrivals, sign-out during a request, pausing, TTL/size bounds, and location removal. Unexpected HTTP statuses are included in the retry cases.

Static inspection also identified follow-up candidates: serialize mobile credential operations against hydration and sign-out; test cache isolation during account replacement on the same server; test bulk categorization/undo overlap and failures after the write but during refresh; and separate successful transaction saves from retrying a failed read. These require dedicated concurrency regressions before changing their behavior. They are not fixed by this change.

Validation for this change: root `pnpm typecheck` and `pnpm lint` passed; `pnpm test --runInBand` passed 545 tests across 67 suites, with 28 PostgreSQL integration tests in four suites skipped. Mobile `corepack pnpm check` passed typechecking, lint, and 147 tests. No browser, physical-device, production-build, or database integration validation was run.

OAuth locking, duplicate import reservations, and database cascades retain their current implementations. Their PostgreSQL integration suites remain the authority for concurrent database behavior. Browser and physical-device behavior require separate acceptance testing; pure transition tests do not establish focus management, native permission delivery, or process-death behavior.
