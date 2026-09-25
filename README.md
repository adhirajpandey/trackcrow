# TrackCrow

TrackCrow is a Next.js expense tracking app that turns SMS transaction messages into structured spending data, manual transaction records, and dashboard summaries.

## Capabilities

- Google sign-in with user bootstrap on first login
- SMS transaction import through device tokens
- Manual transaction creation and editing
- Automatic recipient-based transaction classification through user-managed rules
- Dashboard summaries, category breakdowns, and period-based spending views
- User-owned categories, subcategories, and resolved recipients
- Scoped personal API tokens and six stateless MCP tools

## Quick Setup

Local development uses a Postgres container loaded with sample data. It needs Docker.

```bash
pnpm install
cp .env.example .env    # then fill in GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET
pnpm db:reset
pnpm dev
```

Open `http://localhost:3000`. See [docs/development.md](docs/development.md) for the local database, environment variables, and production migrations.

## Commands

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
