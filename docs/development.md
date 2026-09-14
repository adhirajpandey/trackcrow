# TrackCrow Development

This document covers local setup, commands, and the current contributor workflow.

## Requirements

- Node.js with `pnpm`
- PostgreSQL reachable through `DATABASE_URL`
- Google OAuth credentials for NextAuth sign-in

## Environment Variables

The code currently reads these variables directly:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_API_BASE_URL` for the frontend API client when a non-relative base URL is needed
- `LOG_LEVEL` for logger verbosity
- `MCP_ALLOWED_ORIGINS`, a comma-separated exact allowlist for browser-origin MCP requests. Native clients may omit `Origin`.

`src/app/config.ts` also looks for `.env.local` in non-production and `.env.production` in production, but most of the app reads from `process.env` directly through Next.js runtime conventions.

## Install And Run

```bash
pnpm install
pnpm dlx prisma migrate deploy
pnpm dev
```

The app runs at `http://localhost:3000` by default.

## Build And Test Commands

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm test
pnpm test:unit
pnpm dlx prisma migrate dev --name <change>
pnpm dlx prisma migrate deploy
pnpm dlx prisma generate
```

Notes:

- `pnpm build` runs `prisma generate` before `next build`
- `pnpm test` runs the full Jest suite
- `pnpm test:unit` scopes Jest to `src/common` and `src/server`

## Database Workflow

- Prisma schema lives in `prisma/schema.prisma`
- Prisma client output is generated into `src/generated/prisma-rewrite`
- server modules import the client from `src/lib/prisma-rewrite.ts`
- data-model changes should be accompanied by a Prisma migration

Typical workflow:

1. Update `prisma/schema.prisma`.
2. Run `pnpm dlx prisma migrate dev --name <change>`.
3. Run `pnpm dlx prisma generate` if needed.
4. Verify affected tests and flows.

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

- Jest is configured through [jest.config.mjs](/D:/projects/trackcrow/jest.config.mjs:1).
- Test files live next to the code they exercise.
- Current coverage is strongest in `src/common`, `src/server/modules`, and `src/server/page-data`.
- `jest.setup.ts` installs `crypto` for tests and mocks the logger.

## MCP client setup

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

The Codex command was checked against the installed CLI help. The VS Code fields match its current MCP configuration reference. Test discovery, one read, one mutation where allowed, revocation, and the next-call `401` against a preview deployment before production rollout.

## Deployment order and rollback

Deploy `20260914_generalize_api_tokens` and `20260914_add_rate_limit_buckets` before application code. These migrations only add scope data and the rate-limit table. Rolling back application code does not require deleting scopes or regenerating tokens. Keep the physical `device_token` table and compatibility routes.

## Current runtime notes

- authenticated app pages use a shared shell from `src/app/(app)/layout.tsx`
- implemented page-data reads currently back dashboard, transactions, transaction detail, transaction create, recipients, and recipient detail routes
- `/settings` manages scoped personal API tokens
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
