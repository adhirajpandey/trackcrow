# TrackCrow Architecture

This document describes the current system structure in the Next.js monolith.

## High-Level Shape

TrackCrow is a Next.js App Router application with three main surfaces:

- public marketing pages under `src/app/(marketing)`
- authentication pages under `src/app/(auth)`
- authenticated product pages under `src/app/(app)`

The same app also exposes HTTP APIs under `src/app/api/*`.

## Main Boundaries

- `src/app/api/**/route.ts` contains thin route files that re-export controller handlers.
- `src/server/modules/*/controller.ts` handles request parsing, validation, auth checks, service calls, and HTTP response mapping.
- `src/server/modules/*/service.ts` contains business logic and Prisma access.
- `src/server/page-data/*` contains server-only read models for page rendering.
- `src/lib/internal-api.ts` is the server-side client used by some page-data code to call the app's own HTTP API.
- `src/lib/api/client.ts` and `src/lib/api-client.ts` are browser-oriented API helpers for client-owned flows.

## Request And Data Flow

```txt
Browser
  -> App Router page or /api/* route

Server-rendered page
  -> src/server/page-data/*
  -> services and, for transactions, internal HTTP API helpers
  -> Prisma

HTTP API request
  -> src/app/api/*/route.ts
  -> controller
  -> service
  -> Prisma
```

## Route Groups

- `(marketing)` serves the landing page at `/`.
- `(auth)` serves `/login`.
- `(app)` serves authenticated product routes and uses `requirePageSessionUser()` in its layout before rendering the shared app shell.

Current product routes:

- `/dashboard`
- `/transactions`
- `/transactions/[id]`
- `/categories`
- `/recipients`
- `/recipients/[id]`
- `/settings`
- `/imports/review`

Implemented page-data reads currently back:

- `/dashboard`
- `/transactions`
- `/transactions/[id]`
- `/recipients`
- `/recipients/[id]`

`/categories`, `/settings`, and `/imports/review` currently render drilldown placeholder pages while their dedicated management flows are still being built.

## Auth Boundary

Authentication uses NextAuth with Google OAuth and JWT sessions.

- `src/lib/auth.ts` defines the provider and session callbacks.
- On sign-in, `ensureUserBootstrap()` upserts the user and seeds default categories if none exist.
- API controllers call `requireSessionUser()` and receive `{ userUuid }` or a service error.
- Authenticated pages call `requirePageSessionUser()`, which redirects unauthenticated requests to `/login`.

SMS import is a separate auth path. `POST /api/imports/sms` does not use the session. It requires `Authorization: Token <plain-token>` and resolves that token against the `device_token` table.

## Frontend And Backend Inside The Monolith

- Shared UI components live under `src/components`.
- Shared domain-facing frontend types live under `src/common/types.ts`.
- Backend modules return DTO-style objects rather than Prisma models.
- Page-data modules shape server results into page-specific DTOs before rendering.

## Business Logic Placement

- categories, subcategories, default seeding: `src/server/modules/categories`
- transaction CRUD, search, filtering, and suggestions: `src/server/modules/transactions`
- dashboard summaries and aggregations: `src/server/modules/dashboard`
- SMS import flow: `src/server/modules/imports`
- recipient normalization and lookup: `src/server/modules/recipients`
- device token issuance and revocation: `src/server/modules/device-tokens`
- current-user bootstrap and profile reads: `src/server/modules/users`

## Persistence Layer

Prisma is configured in `prisma/schema.prisma` and generated to `src/generated/prisma-rewrite`.

- `src/lib/prisma-rewrite.ts` creates a singleton Prisma client.
- The client is extended with `@prisma/extension-accelerate`.
- The app currently assumes PostgreSQL through the Prisma datasource.
