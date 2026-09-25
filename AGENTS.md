# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router route groups for marketing, auth, and authenticated app pages, plus `/api/*` route handlers.
- `src/components/`: shared UI and layout components; base primitives live in `src/components/ui/`.
- `src/features/`: frontend query state, mutations, DTO helpers, and feature-level client logic.
- `src/server/modules/`: backend domains organized by module (`controller.ts`, `service.ts`, `schemas.ts`, `types.ts`, and module-local tests).
- `src/server/page-data/`: server-only page read models that prepare page props for App Router pages.
- `src/server/auth/` and `src/server/api/`: session helpers and shared API response helpers.
- `src/lib/` and `src/common/`: cross-cutting utilities (auth, logger, Prisma client, parsers, shared helpers).
- `prisma/`: schema, migration history, and `seed.sql` for the local database; update the schema and migrations for any data-model change.
- `docs/`: active docs live flat at the top level (`architecture.md`, `api.md`, `data-model.md`, `development.md`, `roadmap.md`); historical material lives in `docs/archive/`.
- `public/`: static assets. `scripts/` contains the local database reset and test scripts, screenshot automation, and data utilities.
- `docker-compose.yml`: local Postgres 17 for development and tests.

## Build, Test, and Development Commands
- `pnpm install`: install dependencies.
- `pnpm dev`: start local dev server at `http://localhost:3000`.
- `pnpm build`: run `prisma generate` and create a production build.
- `pnpm start`: run the production server.
- `pnpm lint`: run ESLint checks.
- `pnpm typecheck`: run the TypeScript compiler without emitting files. Jest does not type-check tests.
- `pnpm test`: run the full Jest suite.
- `pnpm test:unit`: run focused unit tests under `src/common` and `src/server`.
- `pnpm test:db`: run the PostgreSQL OAuth integration suite against a disposable database in the local container (needs Docker).
- `pnpm db:reset`: recreate the local database from migrations and `prisma/seed.sql` (needs Docker).
- Prisma workflow examples, against the local database only:
  - `pnpm exec prisma migrate dev --name <change>`
  - `pnpm exec prisma generate`

## Database Rules
- Develop and test against the local Docker Compose database on `127.0.0.1:5434`. `db:reset` and `test:db` use hardcoded local URLs and ignore `DATABASE_URL`.
- Never connect to the production database. A checkout's `.env` holds local values only; never put production credentials in it.
- Never run `prisma migrate dev` or `prisma migrate reset` against production: they can drop data. The owner applies production migrations with `prisma migrate deploy` as described in `docs/development.md`.
- A schema change needs a migration, and `pnpm db:reset` must still load `prisma/seed.sql`. Update the seed in the same change when a migration alters seeded tables.

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode enabled (`tsconfig.json`).
- Indentation: 2 spaces; prefer single-responsibility modules and small components.
- Naming:
  - React components: `PascalCase` (`SummaryCard.tsx` pattern).
  - Files/functions/variables: `kebab-case` for files and `camelCase` for symbols.
  - Route segments follow Next.js conventions (for example, `src/app/transactions/[id]/page.tsx`).
- Use `@/*` import alias for internal imports when it improves readability.

## Testing Guidelines
- Jest is configured for TypeScript tests, with current coverage concentrated in `src/common/**/*.test.ts` and `src/server/modules/**/*.test.ts`.
- Run `pnpm test` for the full test suite or `pnpm test:unit` for the focused common/server unit suite.
- Minimum quality gate today is `pnpm lint`, `pnpm typecheck`, `pnpm test`, and manual verification of modified flows.
- Do not run `pnpm lint` or `pnpm build` after every small iterative change. Run the relevant final checks once before pushing, or earlier only when the user explicitly requests them or they are needed to diagnose a relevant issue.
- When adding tests, colocate them with the module or feature they exercise.
- Prefer service-level backend tests for business logic introduced under `src/server/modules/*`; keep route-handler tests targeted when route wiring itself is the risk.

## Docs Maintenance
- Keep active docs implementation-grounded and update them with the code change, not afterward.
- Update `docs/api.md` for HTTP contract changes, `docs/data-model.md` for Prisma/entity changes, `docs/architecture.md` for structural boundary changes, `docs/development.md` for workflow/tooling changes, and `docs/roadmap.md` for status/priority changes.
- Archive superseded plans and reviews in `docs/archive/` instead of mixing them into active docs.

## Commit & Pull Request Guidelines
- Follow the existing commit style: `<type>(<scope>): <summary>` (examples: `feat(transactions): ...`, `fix(route.ts): ...`, `docs(README.md): ...`).
- Keep commits focused; separate dependency/lockfile updates as `build(...)` when possible.
- Recent history follows rewrite-oriented scopes such as `refactor(backend)`, `refactor(api)`, `chore(migration)`, `chore(prisma)`, and `test(rewrite)`; keep using narrow, descriptive scopes.
- PRs should include:
  - concise problem/solution description,
  - linked issue or context,
  - screenshots or short recordings for UI changes,
  - migration/env notes when schema or auth/config changes are included.
