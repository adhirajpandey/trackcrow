# TrackCrow

TrackCrow is a Next.js expense tracking app that turns SMS transaction messages into structured spending data, reviewable transactions, and dashboard summaries.

## Current Architecture

- `src/app/`: Next.js App Router pages, layouts, loading states, and API route handlers
- `src/server/modules/`: backend domain modules split into `controller`, `service`, `schemas`, `types`, and tests
- `src/components/`: shared UI and layout components, with primitives in `src/components/ui/`
- `src/common/`: shared parsers, types, and utilities
- `src/lib/`: auth, logging, internal API helpers, and Prisma client wiring
- `prisma/`: PostgreSQL schema and migration history
- `scripts/`: rewrite migration and environment utilities

## Features

- SMS import flow for transaction ingestion
- Transaction review, editing, and manual add flows
- Dashboard summaries, category breakdowns, and spending-by-period views
- Category and subcategory management
- Recipient and device-token APIs
- Google OAuth sign-in with user bootstrap on first login

## Tech Stack

- Next.js 16, React 19, TypeScript
- Tailwind CSS, Radix UI, Recharts, React Hook Form, Zod
- PostgreSQL with Prisma
- NextAuth.js with Google provider
- Jest for unit tests

## Development

1. Install dependencies:

```bash
pnpm install
```

2. Configure environment variables for at least:

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

3. Generate/apply the database schema, then start the app:

```bash
pnpm dlx prisma migrate deploy
pnpm build
pnpm dev
```

Open `http://localhost:3000`.

## Commands

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

## Rewrite Notes

- Prisma client output is generated into `src/generated/prisma-rewrite`.
- The current backend shape routes `src/app/api/*` through `src/server/modules/*`.
- Recent history shows an active rewrite/migration sequence: backend foundation, API boundary refactor, migration tooling, Prisma baseline reset, controller/service layering, and service-level test coverage.
