# TrackCrow Architecture

This document describes the current runtime structure of the Next.js monolith.

## Runtime Shape

TrackCrow has five top-level surfaces:

- public marketing pages in `src/app/(marketing)`
- authentication pages in `src/app/(auth)`
- authenticated product pages in `src/app/(app)`
- HTTP APIs in `src/app/api/*`
- the stateless MCP endpoint at `/mcp`

Current authenticated page routes are:

- `/dashboard`
- `/transactions`
- `/transactions/new`
- `/transactions/[id]`
- `/recipients`
- `/recipients/[id]`
- `/rules`
- `/settings`

`/settings` manages accounts and scoped personal API tokens. `/categories` and `/imports/review` are not current App Router pages even though category and import APIs already exist.

## Backend Boundaries

- `src/app/api/**/route.ts` stays thin and re-exports controller handlers.
- `src/server/modules/*/controller.ts` owns request parsing, auth checks, validation, and HTTP response mapping.
- `src/server/modules/*/service.ts` owns business logic and Prisma access.
- `src/server/modules/*/schemas.ts` owns request validation contracts.
- `src/server/page-data/*` prepares server-rendered page data.

Business logic is grouped by module:

- `accounts`
- `categories`
- `dashboard`
- `api-tokens`, with legacy `device-tokens` route adapters
- `imports`
- `recipients`
- `rules`
- `transactions`
- `users`

## Frontend Boundaries

- `src/components/` holds shared layout and UI primitives.
- `src/features/` holds frontend query keys, query-state helpers, mutations, and DTO shaping for interactive product surfaces.
- `src/common/types.ts` holds shared frontend-facing domain types.
- `src/app/(app)/**/_components` holds route-local page UI and view-model code.

The current frontend pattern is server-first:

- `page.tsx` calls a `src/server/page-data/*` function.
- page-data either calls services directly or reuses the internal HTTP contract through `src/lib/internal-api.ts`.
- client components use feature-level query and mutation helpers when the page needs interactive refetch or mutation flows.

## Auth And Request Flow

Authentication uses NextAuth with Google OAuth.

- `src/lib/auth.ts` defines the auth configuration.
- `requirePageSessionUser()` protects authenticated pages and redirects unauthenticated users to `/login`.
- `requireSessionUser()` protects most API routes and returns the current `userUuid`.
- `ensureUserBootstrap()` upserts the user on sign-in and seeds default categories when needed.

SMS import is separate from the browser session. `POST /api/imports/sms` accepts `Token` and `Bearer` credentials with `sms:import`. MCP accepts only Bearer credentials. The shared resolver hashes every supplied token, rejects revoked tokens, returns the owning user and scopes, and conditionally updates `lastUsedAt` at most once every ten minutes.

SMS parsing leaves account text in the parsed payload for auditability. The import service normalizes that text and links an existing account only when one account for the authenticated user matches. Account creation and renaming use the browser API.

`/mcp` runs on the Node runtime outside the authenticated page layout. Request protection checks the hashed client-IP failure budget before token lookup and consumes the token budget after authentication. The MCP layer constructs a new server for each request, enforces scopes, and calls domain services directly. Tools never import Prisma or call internal HTTP APIs.

Rate-limit policy lives in `src/server/mcp/request-protection.ts`. Storage implements the `RateLimiter` interface in `src/server/rate-limit/`; PostgreSQL is the first adapter.

## Data Flow

```txt
Browser
  -> App Router page or /api/* route

Server-rendered page
  -> src/server/page-data/*
  -> service calls or src/lib/internal-api.ts
  -> Prisma

HTTP API request
  -> src/app/api/*/route.ts
  -> controller
  -> service
  -> Prisma

MCP POST
  -> origin, body, authentication, and rate-limit protection
  -> fresh MCP server
  -> domain service
  -> Prisma
```

## Persistence

The persistence layer is defined in [prisma/schema.prisma](/D:/projects/trackcrow/prisma/schema.prisma:1).

- Prisma client output is generated into `src/generated/prisma-rewrite`.
- `src/lib/prisma-rewrite.ts` exposes the singleton Prisma client.
- The datasource is PostgreSQL.
