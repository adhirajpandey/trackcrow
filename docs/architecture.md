# TrackCrow Architecture

This document describes the current runtime structure of the Next.js monolith.

## Runtime Shape

TrackCrow has four top-level surfaces:

- public marketing pages in `src/app/(marketing)`
- authentication pages in `src/app/(auth)`
- authenticated product pages in `src/app/(app)`
- HTTP APIs in `src/app/api/*`

Current authenticated page routes are:

- `/dashboard`
- `/transactions`
- `/transactions/new`
- `/transactions/[id]`
- `/recipients`
- `/recipients/[id]`
- `/settings`

`/settings` is still a placeholder page. `/categories` and `/imports/review` are not current App Router pages even though category and import APIs already exist.

## Backend Boundaries

- `src/app/api/**/route.ts` stays thin and re-exports controller handlers.
- `src/server/modules/*/controller.ts` owns request parsing, auth checks, validation, and HTTP response mapping.
- `src/server/modules/*/service.ts` owns business logic and Prisma access.
- `src/server/modules/*/schemas.ts` owns request validation contracts.
- `src/server/page-data/*` prepares server-rendered page data.

Business logic is grouped by module:

- `categories`
- `dashboard`
- `device-tokens`
- `imports`
- `recipients`
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

SMS import is intentionally separate from the browser session. `POST /api/imports/sms` authenticates with `Authorization: Token <plain-token>` against `device_token` records.

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
```

## Persistence

The persistence layer is defined in [prisma/schema.prisma](/D:/projects/trackcrow/prisma/schema.prisma:1).

- Prisma client output is generated into `src/generated/prisma-rewrite`.
- `src/lib/prisma-rewrite.ts` exposes the singleton Prisma client.
- The datasource is PostgreSQL.
