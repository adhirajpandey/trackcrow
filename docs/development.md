# TrackCrow Development

This document covers local setup, commands, and the current contributor workflow.

## Requirements

- Node.js with `pnpm`
- Docker, for the local Postgres container
- A Google OAuth client that allows `http://localhost:3000`, for NextAuth sign-in

## Environment Variables

Copy `.env.example` to `.env`. It holds local values for every variable below, plus the screenshot script's settings. Fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. A checkout's `.env` must never hold production credentials: every local command reads it.

The code currently reads these variables directly:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`, matching the public origin used for Google sign-in
- `OAUTH_ISSUER_URL`, the trusted public HTTPS origin for MCP OAuth, without a path. Must match the browser origin. Local HTTP loopback origins are accepted only outside production.
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_API_BASE_URL` for the frontend API client when a non-relative base URL is needed
- `LOG_LEVEL` for logger verbosity
- `MCP_ALLOWED_ORIGINS`, a comma-separated exact allowlist for browser-origin MCP requests. Native clients may omit `Origin`.

`src/app/config.ts` also looks for `.env.local` in non-production and `.env.production` in production, but most of the app reads from `process.env` directly through Next.js runtime conventions.

## Install And Run

```bash
pnpm install
cp .env.example .env
pnpm db:reset
pnpm dev
```

The app runs at `http://localhost:3000` by default. Sign in with the Google account whose email matches the seeded user to see the sample data. Any other account starts empty.

## Local Database

`docker-compose.yml` runs Postgres 17 as the `db` service on `127.0.0.1:5434`. `pnpm db:reset` rebuilds the local database from the migrations and loads `prisma/seed.sql`, with the newest seeded activity moved to today. Run it again at any time to return to a clean state. `scripts/local-db.mjs` uses hardcoded local URLs and never reads `DATABASE_URL`.

`prisma/seed.sql` is a one-time sample of production taken in September 2026. It holds about 200 transactions from the previous six months across every category, source, type, classification, and account, plus the recipients, identifiers, rules, and SMS imports they reference. Rules named `seed: ...` (needs repair, disabled, deleted) and one `FAILED` import are added edge cases. A second placeholder user holds copies of 20 rows for checking that users can't see each other's data. The seed is not refreshed from production. Edit it by hand when a migration changes seeded tables.

## Build And Test Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm test:db
pnpm db:reset
pnpm db:migrate --name <change>
pnpm exec prisma generate
```

Notes:

- `pnpm install` runs `prisma generate`, so a fresh checkout has the generated client that tests and builds import
- `pnpm build` runs `prisma generate` before `next build`
- `pnpm typecheck` runs `tsc --noEmit`. Jest compiles tests without type-checking them, so run it alongside `pnpm test`
- `pnpm test` runs the full Jest suite
- `pnpm test:unit` scopes Jest to `src/common` and `src/server`
- `pnpm test:db` runs the PostgreSQL OAuth integration suite against a fresh `trackcrow_oauth_test` database in the local container

## Database Workflow

- Prisma schema lives in `prisma/schema.prisma`
- Prisma client output is generated into `src/generated/prisma-rewrite`
- server modules import the client from `src/lib/prisma-rewrite.ts`
- data-model changes should be accompanied by a Prisma migration

Typical workflow:

1. Update `prisma/schema.prisma`.
2. Run `pnpm db:migrate --name <change>`. It runs `prisma migrate dev` against the local database only, even if a `DATABASE_URL` is exported in your shell.
3. Run `pnpm exec prisma generate` if needed.
4. Update `prisma/seed.sql` if the migration changes seeded tables, then check that `pnpm db:reset` still succeeds.
5. Verify affected tests and flows.

## Production Migrations

Vercel deploys code from `main` but never runs migrations, so a migration must reach production before the code that depends on it. Only run `prisma migrate deploy` against production. `prisma migrate dev` and `prisma migrate reset` can drop data.

1. Write the migration so the currently deployed code keeps working after it runs.
2. Check it locally with `pnpm db:reset`, `pnpm test`, and `pnpm test:db`.
3. Confirm a recent database backup exists.
4. Apply it with the Supabase session pooler URL on port `5432`, set for this one command only. Do not save it in `.env`:

   ```bash
   DATABASE_URL='<session pooler URL>' pnpm exec prisma migrate deploy
   ```

5. Merge the pull request and check the changed screens after Vercel deploys.

## Code Organization

- `src/app/` contains route groups, pages, layouts, and API entry points.
- `src/features/` contains frontend query keys, query state, mutations, and DTO helpers.
- `src/server/modules/*` contains controllers, services, schemas, and module tests.
- `src/server/page-data/*` contains server-only page read models.
- `src/components/` contains shared UI and layout components.
- `src/common/` contains shared parser and frontend-facing domain helpers.
- `src/lib/` contains auth, Prisma, logging, and API client utilities.

## Frontend Maintenance Rules

### Transaction detail classification

The detail form keeps a saved baseline separate from its draft. Classification badges describe the draft: `Needs category` when empty, otherwise `Suggested`, `Manual`, or the saved `Rule` source. Only an empty category uses the yellow panel and categorization helper. `Unsaved changes` appears only in the section containing edits: Classification for a changed category/subcategory pair, and Transaction details for other changed fields. Neither desktop nor mobile Save controls have a separate unsaved label.

Suggest category and its `c` shortcut are available only when the draft category is Uncategorized, including after clearing a saved category. Applying a suggestion records draft intent and hides the action once a category is selected. A manual classification change clears that intent; returning to an unsaved suggestion manually stays Manual. Returning to the exact saved pair restores the saved source. A suggestion matching the saved pair is already saved and does not change provenance. Only a different, unedited suggested pair sends `classificationIntent: "SUGGESTION"`. The loading skeleton reserves space for one classification action.

Incidental refetches and failed saves preserve drafts. A successful save and refresh establish the new baseline. Save and Suggest cannot overlap; a late suggestion cannot overwrite a newer manual classification. Dirty checks compare normalized form defaults, and unrelated saves preserve the original timestamp precision.

Create/Edit rule links use saved values and appear only when the entire form is clean and no save or suggestion is pending. Verify both desktop and mobile indicators, manual edits after suggestions, reverting edits, failed saves, delayed suggestions, and source persistence after reload. Use mocked responses or test records for write verification.

### General conventions

These are the current durable rules distilled from the archived frontend TRD:

- Prefer server-first page reads: `page.tsx` should load from `src/server/page-data/*`.
- Reuse `src/lib/internal-api.ts` when a server-rendered page should consume the same HTTP contract as the client.
- Keep interactive client reads and mutations in `src/features/*` using TanStack Query where the page needs refetch, mutation state, or cache updates.
- Treat URL search params as the source of truth for pageable and filterable list screens.
- Use API routes for browser-owned mutations instead of adding new server actions by default.
- Do not add top-level `dehydrate()` / `HydrationBoundary` plumbing unless a page actually benefits from it.

## Testing Conventions

- Jest is configured through [jest.config.mjs](../jest.config.mjs).
- Test files live next to the code they exercise.
- Current coverage is strongest in `src/common`, `src/server/modules`, and `src/server/page-data`.
- `jest.setup.ts` installs `crypto` for tests and mocks the logger.

## MCP client setup

CIMD-capable public clients can connect to `/mcp` using browser OAuth. No client registration or client secret is needed. The client must supply its HTTPS metadata URL and use PKCE `S256`. Users choose permissions after Google sign-in and can revoke each connection in Settings → Connected Apps. A connection requires new consent after 90 days.

Apply `20260918_add_mcp_oauth` before enabling OAuth and set `OAUTH_ISSUER_URL` plus the existing `NEXTAUTH_SECRET`. The secret also derives the authenticated-encryption key for short-lived consent state; rotation invalidates pending consent. Configure the same origin in `NEXTAUTH_URL`. Do not derive issuer/resource URLs from forwarded host headers. `MCP_ALLOWED_ORIGINS` controls cross-origin token/MCP browser requests; native clients can omit Origin. Discovery is public.

Metadata fetching uses Node HTTPS with pinned, validated DNS results. Do not replace it with an unrestricted fetch or relax network protections for development. Public CIMD documents may advertise additional grant types, but TrackCrow only implements authorization-code and refresh grants with auth method `none`.

OAuth regression tests are included in `pnpm test`. PostgreSQL concurrency tests run only when `OAUTH_TEST_DATABASE_URL` points to a local disposable database whose name contains `oauth_test`. `pnpm test:db` sets this up in the local container and runs them.

The integration suite creates and deletes only its own test users. It verifies concurrent redemption/rotation, replay revocation, owner isolation, deadline preservation, throttled usage writes, and real MCP tool/PAT behavior. Before deployment, verify Google login, consent, refresh, a read/write permission check, and revocation against the deployed origin. Record client versions tested; protocol support alone does not guarantee every Codex/Claude release supports public CIMD.

For clients without compatible OAuth support, use the existing PAT flow below.

Create a token under `/settings`, copy it once, and give it only the permissions the client needs.

Codex CLI supports remote HTTP MCP servers and reads the Bearer value from an environment variable:

```bash
export TRACKCROW_TOKEN="<one-time-token>"
codex mcp add trackcrow \
  --url https://your-trackcrow-domain/mcp \
  --bearer-token-env-var TRACKCROW_TOKEN
```

For VS Code, create `.vscode/mcp.json` or a user-level MCP configuration. The password input is kept in VS Code's secret storage:

```json
{
  "inputs": [
    {
      "type": "promptString",
      "id": "trackcrow-token",
      "description": "TrackCrow personal API token",
      "password": true
    }
  ],
  "servers": {
    "trackcrow": {
      "type": "http",
      "url": "https://your-trackcrow-domain/mcp",
      "headers": {
        "Authorization": "Bearer ${input:trackcrow-token}"
      }
    }
  }
}
```

Configurations that use `${input:trackcrow-token}` are not forwarded to Agent Host because Agent Host does not support interactive inputs. To use TrackCrow from Agent Host, add this noninteractive configuration to a workspace `.mcp.json` or `~/.copilot/mcp-config.json`:

```json
{
  "servers": {
    "trackcrow": {
      "type": "http",
      "url": "https://your-trackcrow-domain/mcp",
      "headers": {
        "Authorization": "Bearer <your-token>"
      }
    }
  }
}
```

This stores the token as plain text, so keep the file out of version control and restrict access to it. Continue using the password input above when running the server through VS Code so the token stays in VS Code's secret storage.

The Codex command was checked against the installed CLI help. The VS Code fields match its current MCP configuration reference. Test discovery, one read, one mutation where allowed, revocation, and the next-call `401` against a preview deployment before production rollout.

## Deployment order and rollback

Apply `20260915_track_accounts` during a coordinated write pause after taking a database backup. Rehearse it against a recent database copy first. The migration creates one account per user and normalized legacy label, links transactions, verifies the links, then drops `account_label`. Deploy the application immediately after the migration because older application versions require that dropped column. A rollback requires restoring the backup or writing a reverse data migration.

## Current runtime notes

- authenticated app pages use a shared shell from `src/app/(app)/layout.tsx`
- implemented page-data reads currently back dashboard, transactions, transaction detail, transaction create, recipients, and recipient detail routes
- `/settings` manages accounts and scoped personal API tokens
- `/mcp` runs stateless MCP v2 with legacy stateless compatibility
- Next.js remote image loading is currently enabled for `lh3.googleusercontent.com`

## Docs Maintenance

- Keep active docs in `docs/` small and current.
- Update `docs/api.md` with route contract changes.
- Update `docs/data-model.md` with Prisma or ownership changes.
- Update `docs/architecture.md` when route surfaces, module boundaries, or data flow changes.
- Update `docs/development.md` when setup, scripts, or contributor workflow changes.
- Update `docs/roadmap.md` when priorities or product status change.
- Move superseded plans and reviews into `docs/archive/` instead of extending live docs with historical context.
