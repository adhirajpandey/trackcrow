# Repository Guidelines

## Project Structure & Module Organization
- `src/app/`: Next.js App Router pages, route handlers, and feature modules (`dashboard`, `transactions`, `preferences`, `profile`).
- `src/components/`: shared UI and layout components; base primitives live in `src/components/ui/`.
- `src/lib/` and `src/common/`: cross-cutting utilities (auth, Prisma client, schemas, parsers, server helpers).
- `prisma/`: schema and migration history; update this for any data-model change.
- `public/`: static assets. `scripts/` contains one-off helpers (for example, migration utilities).

## Build, Test, and Development Commands
- `pnpm install`: install dependencies.
- `pnpm dev`: start local dev server at `http://localhost:3000`.
- `pnpm build`: run `prisma generate` and create a production build.
- `pnpm start`: run the production server.
- `pnpm lint`: run Next.js/ESLint checks.
- Prisma workflow examples:
  - `pnpm dlx prisma migrate dev --name <change>`
  - `pnpm dlx prisma migrate deploy`
  - `pnpm dlx prisma generate`

## Coding Style & Naming Conventions
- Language: TypeScript with `strict` mode enabled (`tsconfig.json`).
- Indentation: 2 spaces; prefer single-responsibility modules and small components.
- Naming:
  - React components: `PascalCase` (`SummaryCard.tsx` pattern).
  - Files/functions/variables: `kebab-case` for files and `camelCase` for symbols.
  - Route segments follow Next.js conventions (for example, `src/app/transactions/[id]/page.tsx`).
- Use `@/*` import alias for internal imports when it improves readability.

## Testing Guidelines
- Jest is configured for TypeScript tests under `src/**/*.test.ts`.
- Run `pnpm test` for the full test suite or `pnpm test:unit` for the focused common/server unit suite.
- Minimum quality gate today is `pnpm lint`, `pnpm test`, and manual verification of modified flows.
- When adding tests, colocate them with the module or feature they exercise.

## Commit & Pull Request Guidelines
- Follow the existing commit style: `<type>(<scope>): <summary>` (examples: `feat(transactions): ...`, `fix(route.ts): ...`, `docs(README.md): ...`).
- Keep commits focused; separate dependency/lockfile updates as `build(...)` when possible.
- PRs should include:
  - concise problem/solution description,
  - linked issue or context,
  - screenshots or short recordings for UI changes,
  - migration/env notes when schema or auth/config changes are included.
