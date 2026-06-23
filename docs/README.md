# TrackCrow Docs

This directory contains the canonical documentation for the current implemented system.

## Reading Order

1. [Architecture](./architecture.md) for the system structure and request boundaries.
2. [API](./api.md) for the HTTP contracts exposed by `src/app/api/*`.
3. [Data Model](./data-model.md) for Prisma entities and domain rules.
4. [Development](./development.md) for local setup, commands, and contributor workflow.

## What Lives Here

- [architecture.md](./architecture.md): monolith structure, route groups, auth boundary, and data flow.
- [api.md](./api.md): request and response contracts for the current HTTP API.
- [data-model.md](./data-model.md): entity purposes, relationships, and schema-backed rules.
- [development.md](./development.md): local setup, environment expectations, database workflow, and test commands.

## Plans And History

`docs/plans/` holds planning and rewrite artifacts. Those files are useful context, but they are not the source of truth for current behavior.

- [rewrite-plan.md](./plans/rewrite-plan.md)
- [frontend-trd.md](./plans/frontend-trd.md)
