# TrackCrow

TrackCrow is a Next.js expense tracking app that turns SMS transaction messages into structured spending data, manual transaction records, and dashboard summaries.

## Capabilities

- Google sign-in with user bootstrap on first login
- SMS transaction import through device tokens
- Manual transaction creation and editing
- Automatic recipient-based transaction classification through user-managed rules
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
- `src/features/` contains frontend query state, mutations, and DTO helpers for interactive product surfaces.
- `src/server/modules/` contains controllers, services, schemas, types, and tests for backend domains.
- `src/server/page-data/` contains server-only page read models.
- `prisma/schema.prisma` defines the PostgreSQL data model.

## Docs

Active project docs live directly under `docs/`:

| File | Purpose | Update when |
| --- | --- | --- |
| `docs/architecture.md` | runtime structure, route surfaces, and boundaries | app structure or ownership changes |
| `docs/api.md` | current `/api/*` contract | request or response behavior changes |
| `docs/data-model.md` | Prisma-backed entities and invariants | schema or ownership rules change |
| `docs/development.md` | setup, commands, and contributor workflow | local workflow or tooling changes |
| `docs/roadmap.md` | completed work, active work, and next priorities | product status or priorities change |

Historical plans, reviews, and superseded specs live in `docs/archive/`. Design direction for the product UI remains in [DESIGN.md](./DESIGN.md).
