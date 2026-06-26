# TrackCrow Development

This document covers local setup, commands, and the current contributor workflow.

## Requirements

- Node.js with `pnpm`
- PostgreSQL reachable through `DATABASE_URL`
- Google OAuth credentials for NextAuth sign-in

## Environment Variables

The code currently reads these variables directly:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `NEXT_PUBLIC_API_BASE_URL` for the frontend API client when a non-relative base URL is needed
- `LOG_LEVEL` for logger verbosity

`src/app/config.ts` also looks for `.env.local` in non-production and `.env.production` in production, but most of the app reads from `process.env` directly through Next.js runtime conventions.

## Install And Run

```bash
pnpm install
pnpm dlx prisma migrate deploy
pnpm dev
```

The app runs at `http://localhost:3000` by default.

## Build And Test Commands

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

Notes:

- `pnpm build` runs `prisma generate` before `next build`
- `pnpm test` runs the full Jest suite
- `pnpm test:unit` scopes Jest to `src/common` and `src/server`

## Database Workflow

- Prisma schema lives in `prisma/schema.prisma`
- Prisma client output is generated into `src/generated/prisma-rewrite`
- server modules import the client from `src/lib/prisma-rewrite.ts`
- data-model changes should be accompanied by a Prisma migration

Typical workflow:

1. Update `prisma/schema.prisma`.
2. Run `pnpm dlx prisma migrate dev --name <change>`.
3. Run `pnpm dlx prisma generate` if needed.
4. Verify affected tests and flows.

## Code Organization

- `src/app/` contains route groups, pages, layouts, and API entry points.
- `src/server/modules/*` contains controllers, services, schemas, and module tests.
- `src/server/page-data/*` contains server-only page read models.
- `src/components/` contains shared UI and layout components.
- `src/common/` contains shared parser and frontend-facing domain helpers.
- `src/lib/` contains auth, Prisma, logging, and API client utilities.

## Testing Conventions

- Jest is configured through [jest.config.mjs](/D:/projects/trackcrow/jest.config.mjs:1).
- Test files live next to the code they exercise.
- Current coverage is strongest in `src/common`, `src/server/modules`, and `src/server/page-data`.
- `jest.setup.ts` installs `crypto` for tests and mocks the logger.

## Current Runtime Notes

- authenticated app pages use a shared shell from `src/app/(app)/layout.tsx`
- implemented page-data reads currently back dashboard, transactions, transaction detail, recipients, and recipient detail routes
- categories, settings, and import review still use placeholder pages
- Next.js remote image loading is currently enabled for `lh3.googleusercontent.com`
