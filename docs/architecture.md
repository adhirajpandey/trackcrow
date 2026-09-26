# TrackCrow Architecture

This document describes the current runtime structure of the Next.js monolith.

## Runtime Shape

TrackCrow has six top-level surfaces:

- public marketing pages in `src/app/(marketing)`
- authentication pages in `src/app/(auth)`
- authenticated product pages in `src/app/(app)`
- HTTP APIs in `src/app/api/*`
- the stateless MCP endpoint at `/mcp`
- MCP OAuth discovery and authorization under `/.well-known/*` and `/oauth/*`

Current authenticated page routes are:

- `/dashboard`
- `/transactions`
- `/transactions/new`
- `/transactions/[id]`
- `/recipients`
- `/recipients/[id]`
- `/rules`
- `/settings`

`/settings` manages accounts, scoped personal API tokens, and OAuth Connected Apps. `/categories` and `/imports/review` are not current App Router pages even though category and import APIs already exist.

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
- `api-tokens`
- `oauth`, with CIMD fetching, consent state, token exchange, and connection management
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

The landing page resolves an optional server session. A root-layout navigation provider tracks pathname changes in memory: authenticated initial visits to `/` replace the route with `/dashboard`, while internal returns show the landing page with "Open Dashboard" buttons. Refreshes and new tabs reset this distinction. The desktop app logo links home; the mobile logo continues to open navigation. Session lookup failures leave the public landing page available.

- `src/lib/auth.ts` defines the auth configuration.
- `requirePageSessionUser()` protects authenticated pages and redirects unauthenticated users to `/login`.
- `requireSessionUser()` protects most API routes and returns the current `userUuid`.
- `ensureUserBootstrap()` upserts the user on sign-in and seeds default categories when needed.

SMS import is separate from the browser session. `POST /api/imports/sms` accepts `Token` and `Bearer` credentials with `sms:import`. MCP accepts only Bearer credentials. The shared resolver hashes every supplied token, rejects revoked tokens, returns the owning user and scopes, and conditionally updates `lastUsedAt` at most once every ten minutes.

SMS parsing leaves account text in the parsed payload for auditability. The import service normalizes that text and links an existing account only when one account for the authenticated user matches. Account creation and renaming use the browser API.

`/mcp` runs on the Node runtime outside the authenticated page layout. Request protection checks the hashed client-IP failure budget before token lookup and consumes the token budget after authentication. The MCP layer constructs a new server for each request, enforces scopes, and calls domain services directly. Tools never import Prisma or call internal HTTP APIs.

Rate-limit policy lives in `src/server/mcp/request-protection.ts`. Storage implements the `RateLimiter` interface in `src/server/rate-limit/`; PostgreSQL is the first adapter.

OAuth uses the same Google/NextAuth user identity. Its routes delegate to the OAuth controller and service; browser consent and Connected Apps mutations use API routes, not Server Actions. Consent page data lives in `src/server/page-data/oauth-consent.ts`; Settings queries and mutations live in `src/features/oauth`.

The CIMD helper owns all outbound metadata security: public HTTPS addresses, DNS pinning, IPv4/IPv6 range checks, no redirects, timeout, size limits, and bounded caching. Metadata is consulted only during new authorization flows. Connections retain immutable client identity and granted scopes.

Encrypted, expiring consent state is bound to an HttpOnly browser cookie and the displayed account. The code record's unique consent nonce prevents duplicate approval. PostgreSQL connection-row locks serialize token exchanges against rotation and revocation. Used refresh tokens retain successor links so replay revokes the whole connection.

The MCP-specific resolver combines PAT and OAuth authentication into `AuthenticatedToken`. OAuth adds optional `connectionUuid`; `tokenUuid` remains the access-token UUID. Successful authentication selects the connection rate-limit key. OAuth access use updates `lastUsedAt` at most once every ten minutes. The SMS resolver remains PAT-only.

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
