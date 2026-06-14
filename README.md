# TrackCrow

A Next.js application for modern AI-powered expense tracking.

## Features

- **SMS Integration**: Automatically extracts and categorizes transactions from SMS notifications
- **Smart Dashboard**: Visual analytics, spending insights, and categorical breakdowns with AI-powered suggestions
- **Custom Categories**: Create personalized expense categories and manage transactions with manual entry options

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **UI**: Radix UI, Tailwind CSS, Lucide Icons
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with Google OAuth
- **Charts**: Recharts for data visualization
- **Forms**: React Hook Form with Zod validation

## Getting Started

```bash
pnpm install
pnpm exec prisma migrate deploy
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

For schema changes after the rewrite baseline, create normal Prisma migrations and apply them with `pnpm exec prisma migrate deploy` in tracked environments.
