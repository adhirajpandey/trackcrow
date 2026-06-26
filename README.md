# TrackCrow

TrackCrow is a Next.js expense tracking app that turns SMS transaction messages into structured spending data, manual transaction records, and dashboard summaries.

## Capabilities

- Google sign-in with user bootstrap on first login
- SMS transaction import through device tokens
- Manual transaction creation and editing
- Dashboard summaries, category breakdowns, and period-based spending views
- User-owned categories, subcategories, and resolved recipients

## Quick Setup

```bash
pnpm install
```

Required environment variables:

```bash
DATABASE_URL=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

```bash
pnpm dlx prisma migrate deploy
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

## Architecture Snapshot

- `src/app/` contains App Router pages, layouts, and `/api/*` route entry points.
- `src/server/modules/` contains controllers, services, schemas, types, and tests for backend domains.
- `src/server/page-data/` contains server-only page read models.
- `prisma/schema.prisma` defines the PostgreSQL data model.

Canonical docs live in [docs/README.md](./docs/README.md). Historical rewrite and design artifacts live in `docs/plans/`.
