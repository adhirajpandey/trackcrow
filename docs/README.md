# TrackCrow Docs

This directory is organized by document role. Each topic has one canonical home, and other docs should link to it instead of restating it.

## Current Reference

- [API](./reference/api.md): Canonical HTTP contract for `src/app/api/*`. Update when request or response behavior changes.
- [Architecture](./reference/architecture.md): Canonical runtime shape, route groups, boundaries, and request/data flow. Update when implementation structure changes.
- [Data Model](./reference/data-model.md): Canonical entity, relationship, and invariant reference. Update when Prisma schema or ownership rules change.
- [Development](./reference/development.md): Canonical setup, commands, and contributor workflow. Update when local workflows or environment expectations change.

## Current Status

- [Rewrite Status](./status/rewrite-status.md): Current implementation state, completed milestones, active surfaces, and intentionally deferred scope. Update when product status or deferrals change.
- [Frontend TRD](./status/frontend-trd.md): Active frontend implementation spec for the current workspace UX direction. Update when the frontend rewrite plan changes materially.

## History

- [Project Baseline](./history/baselines/project-baseline-pre-rewrite.md): Historical pre-rewrite baseline. Preserved for context; not current truth.
- [Archived Rewrite Plan](./history/plans/rewrite-plan-archived-2026-06.md): Historical rewrite planning artifact from the migration period. Preserved for decision history; not current truth.
- [Reviews](./history/reviews/): Historical code reviews, architecture proposals, and audit artifacts. These are dated context, not canonical behavior docs.

## Assets

- [Mock Assets](./assets/mocks/): Screenshots and design artifacts referenced by status and historical docs.

## Language Rules

### Reference Docs

- Use present tense and implementation-grounded language.
- Describe only what the system does now.
- Avoid roadmap, audit commentary, and historical narrative.

### Status Docs

- Separate `Completed`, `Active`, and `Deferred`.
- Link to reference docs for technical detail instead of repeating it.
- Keep reasoning only when it still affects current decisions.

### Historical Docs

- Preserve original context.
- Label them clearly as historical artifacts.
- Do not use them as the source of truth for current behavior.
