# V3 Frontend Component Reuse Review

## Summary

The V3 mockup set should be treated as a reusable workspace system, not as six separate screens. The strongest component need is a shared product layer between `src/components/ui/` primitives and feature pages: workspace shell pieces, page headers, panels, table/list frames, filters, status badges, metric cards, and detail-page rails.

This review intentionally does not define a build plan for the V3 UI. It identifies the reusable components required to build it cleanly, with evidence from the V3 mockup inventory, the design system, and the current codebase.

## Evidence Reviewed

- V3 mockups: [dashboard-overview.png](/D:/projects/trackcrow/docs/assets/mocks/review-workspace-concept-v3/dashboard-overview.png), [review-queue.png](/D:/projects/trackcrow/docs/assets/mocks/review-workspace-concept-v3/review-queue.png), [transactions-list.png](/D:/projects/trackcrow/docs/assets/mocks/review-workspace-concept-v3/transactions-list.png), [transaction-detail.png](/D:/projects/trackcrow/docs/assets/mocks/review-workspace-concept-v3/transaction-detail.png), [recipients-list.png](/D:/projects/trackcrow/docs/assets/mocks/review-workspace-concept-v3/recipients-list.png), and [recipient-detail.png](/D:/projects/trackcrow/docs/assets/mocks/review-workspace-concept-v3/recipient-detail.png). The list screens are `1672x941`; the detail screens are `1055x1491`.
- Design direction: TrackCrow should be dark-only, data-dense, restrained, and built around stable financial review surfaces ([design.md](/D:/projects/trackcrow/design.md:5)). The design rules explicitly call for semantic tokens only in app code ([design.md](/D:/projects/trackcrow/design.md:17)), raw colors staying out of feature components ([design.md](/D:/projects/trackcrow/design.md:52)), table/list density on transaction screens ([design.md](/D:/projects/trackcrow/design.md:105)), and stacked review cards on mobile ([design.md](/D:/projects/trackcrow/design.md:206)).
- Existing frontend review: [frontend-review-2026-06-26.md](/D:/projects/trackcrow/docs/history/reviews/frontend-review-2026-06-26.md:40) already covers the transaction detail god component and duplicated dropdown logic. This document does not repeat those as bug findings; it converts them into component architecture recommendations.
- Current shared surface is small: `Button` has only default/secondary/ghost plus three sizes ([button.tsx](/D:/projects/trackcrow/src/components/ui/button.tsx:7)), while `AppPageHeader` only covers eyebrow/title/description/meta/actions ([app-page-header.tsx](/D:/projects/trackcrow/src/components/product/app-page-header.tsx:5)).

## Component Recommendations

### Workspace Shell Components

Introduce reusable product-shell parts: `WorkspaceShell`, `WorkspaceSidebar`, `WorkspaceMobileNav`, `WorkspaceNavItem`, `WorkspaceBrand`, `AccountCard`, and `UserAvatar`.

Evidence: the current `AppShell` owns layout, mobile drawer, navigation config, brand panel, profile card, account actions, and avatar rendering in one file ([app-shell.tsx](/D:/projects/trackcrow/src/components/product/app-shell.tsx:43), [app-shell.tsx](/D:/projects/trackcrow/src/components/product/app-shell.tsx:94), [app-shell.tsx](/D:/projects/trackcrow/src/components/product/app-shell.tsx:173), [app-shell.tsx](/D:/projects/trackcrow/src/components/product/app-shell.tsx:203)). It also embeds raw colors and gradients in shell internals ([app-shell.tsx](/D:/projects/trackcrow/src/components/product/app-shell.tsx:54), [app-shell.tsx](/D:/projects/trackcrow/src/components/product/app-shell.tsx:211)), which conflicts with the semantic-token rule in `design.md`.

Why this matters for V3: every mockup shares the authenticated workspace frame. If shell pieces stay private inside `AppShell`, V3 cannot reuse navigation/account patterns in responsive drawers, settings-adjacent screens, or future review workspaces without copying.

### Workspace Page Header

Evolve `AppPageHeader` into a more complete `WorkspacePageHeader` with consistent support for eyebrow, title, description, meta chips, primary/secondary action slots, back/breadcrumb affordances, and compact/detail variants.

Evidence: list pages use simple headers ([transactions-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-page-view.tsx:103), [recipients-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-page-view.tsx:89)), while detail pages manually add back actions and metadata ([recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:64), [transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:253)). The current header API does not encode these variants.

Why this matters for V3: the wide list mockups and tall detail mockups need the same title/meta/action language with different density. A header component should prevent each feature page from inventing its own action placement and metadata treatment.

### Surface, Panel, And Section Header

Create generic workspace surface primitives: `Surface`, `Panel`, `AttentionPanel`, `PanelHeader`, and `SectionHeader`. Move dashboard-specific class constants into these components or a shared product style module.

Evidence: dashboard style constants define generic panels, tables, footer links, actions, metric icons, and top cards ([dashboard-style.ts](/D:/projects/trackcrow/src/app/(app)/dashboard/_components/dashboard-style.ts:1)). Transactions, recipients, recipient detail, and transaction detail import these dashboard-specific styles for non-dashboard screens ([transactions-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-page-view.tsx:30), [recipients-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-page-view.tsx:29), [recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:20), [transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:41)).

Why this matters for V3: dashboard, review queue, lists, and detail pages all need the same surface grammar. Naming those surfaces as dashboard-only creates the wrong ownership boundary and encourages more cross-feature imports.

### Data Table And Responsive Record List

Add a reusable `DataTable` family with `DataTableFrame`, `DataTableHeader`, `SortableHeader`, `DataTableRow`, `DataTableCell`, `Pagination`, and a mobile `RecordCardList` fallback.

Evidence: transactions and recipients implement parallel table shells, sortable headers, row links, pagination, and empty states ([transactions-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-page-view.tsx:135), [transactions-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-page-view.tsx:224), [transactions-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-page-view.tsx:254), [recipients-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-page-view.tsx:112), [recipients-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-page-view.tsx:216), [recipients-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-page-view.tsx:246)). Recipient detail repeats table framing for identifiers, category pattern, and recent transactions ([recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:127), [recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:185), [recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:240)).

Why this matters for V3: list mockups should not produce separate transaction, recipient, import, and detail-table implementations. The table primitive should handle dense desktop scanning, row focus/hover states, empty states, pagination, and a stacked card fallback required by the design system.

### Filter Bar And Query Controls

Create `FilterBar`, `SearchField`, `FilterSelect`, `TimeframeControl`, `ResetFiltersButton`, and a URL-query adapter hook. The visual controls and URL behavior should be reusable, while feature modules provide option data and href builders.

Evidence: current transaction filters combine layout, search debounce, category menu, portal positioning, and URL updates in one component ([transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:26), [transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:111), [transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:124), [transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:136)). The prior review already identified the stale debounced URL risk and duplicated menu logic ([frontend-review-2026-06-26.md](/D:/projects/trackcrow/docs/history/reviews/frontend-review-2026-06-26.md:10), [frontend-review-2026-06-26.md](/D:/projects/trackcrow/docs/history/reviews/frontend-review-2026-06-26.md:59)).

Why this matters for V3: transactions, recipients, review queue, and dashboard timeframe controls all need consistent filter ergonomics. A shared filter bar prevents each screen from owning keyboard, debounce, reset, and responsive layout behavior.

### Popover And Select Primitive

Add an accessible shared `Popover`/`SelectMenu` primitive before expanding V3 controls. It should own trigger measurement, collision-aware fixed positioning, outside-click handling, Escape close, focus behavior, option rendering, disabled state, and z-index policy.

Evidence: `TransactionsFilterControls` contains its own fixed-position portal menu ([transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:49), [transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:83), [transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:154)). Transaction detail contains a separate `ThemedSelect` with nearly the same responsibilities ([transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:716), [transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:735), [transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:769)).

Why this matters for V3: category filters, status filters, timeframe menus, category/subcategory form fields, and review actions will all require the same menu behavior.

### Metric, Insight, And Review Cards

Add reusable `MetricCard`, `InsightCard`, `ReviewTaskCard`, `ReviewQueueItem`, and `RailCard` components with tone variants for default, primary, accent/review, info, success, and destructive.

Evidence: dashboard has feature-local top-card composition ([dashboard-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/dashboard/_components/dashboard-page-view.tsx:153), [dashboard-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/dashboard/_components/dashboard-page-view.tsx:390), [dashboard-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/dashboard/_components/dashboard-page-view.tsx:412), [dashboard-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/dashboard/_components/dashboard-page-view.tsx:447)). The right rail repeats small linked panels for category attention, changes, and rule suggestions ([dashboard-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/dashboard/_components/dashboard-page-view.tsx:470)). Design rules name metric tiles and review queue panels as core components ([design.md](/D:/projects/trackcrow/design.md:157), [design.md](/D:/projects/trackcrow/design.md:163)).

Why this matters for V3: dashboard overview and review queue need consistent summary cards, attention cards, insight rails, and task cards. Tone variants should come from semantic status roles, not ad hoc class strings.

### Status, Chip, Amount, And Copy Primitives

Add small display primitives: `StatusBadge`, `EntityChip`, `AmountText`, `SourceBadge`, `CopyButton`, `MetadataRow`, and `QuickCheckRow`.

Evidence: status and chip styling appears inline in transaction rows ([transactions-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-page-view.tsx:188)), recipient rows ([recipients-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-page-view.tsx:156), [recipients-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-page-view.tsx:180)), recipient detail badges ([recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:213)), and transaction detail quick checks ([transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:700)). Recipient detail defines local copy and metadata primitives that transaction detail also needs conceptually ([recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:399), [recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:420)).

Why this matters for V3: transaction source, category state, import confidence, recipient identifiers, copyable raw values, and financial amounts recur across every mockup. Small primitives keep the visual language consistent and prevent hand-built pills.

### Detail Page Layout

Add a reusable `DetailPageLayout` with `DetailMain`, `DetailRail`, `SummaryBlock`, `DefinitionList`, `MetadataPanel`, `QuickChecksPanel`, and `DangerZone`.

Evidence: recipient detail uses a main/aside grid with summary, definition grids, repeated tables, metadata, quick checks, insights, and recorded details ([recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:86), [recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:106), [recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:312), [recipient-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/[id]/_components/recipient-detail-page-view.tsx:386)). Transaction detail combines data fetching, form orchestration, copy state, suggestion state, delete flow, preview state, and detail UI in the same component ([transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:71), [transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:157), [transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:181), [transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:222)).

Why this matters for V3: the tall transaction and recipient detail mockups should share the same spatial contract. The domain content differs, but the layout, side rail, metadata display, copy affordance, checks, and destructive areas should not.

## Reuse Map By V3 Screen

| V3 screen | Primary reusable components |
|---|---|
| Dashboard overview | `WorkspaceShell`, `WorkspacePageHeader`, `MetricCard`, `InsightCard`, `RailCard`, `Panel`, `DataTableFrame`, `TimeframeControl`, `EmptyState` |
| Review queue | `WorkspaceShell`, `WorkspacePageHeader`, `FilterBar`, `ReviewTaskCard`, `ReviewQueueItem`, `StatusBadge`, `AmountText`, `Panel`, `Pagination` |
| Transactions list | `WorkspaceShell`, `WorkspacePageHeader`, `FilterBar`, `DataTable`, `SortableHeader`, `Pagination`, `StatusBadge`, `AmountText`, `SourceBadge`, `RecordCardList` |
| Transaction detail | `WorkspaceShell`, `WorkspacePageHeader`, `DetailPageLayout`, `Panel`, `FormField`, `SelectMenu`, `MetadataPanel`, `QuickChecksPanel`, `DangerZone`, `CopyButton` |
| Recipients list | `WorkspaceShell`, `WorkspacePageHeader`, `FilterBar`, `DataTable`, `SortableHeader`, `Pagination`, `EntityChip`, `StatusBadge`, `RecordCardList` |
| Recipient detail | `WorkspaceShell`, `WorkspacePageHeader`, `DetailPageLayout`, `SummaryBlock`, `DefinitionList`, `DataTableFrame`, `MetadataPanel`, `QuickChecksPanel`, `InsightCard`, `CopyButton` |

## Best-Practice Notes

- Keep component layers clear: `src/components/ui/` for interaction primitives, `src/components/product/` for TrackCrow workspace components, and feature folders for domain-specific data mapping.
- Replace raw hex and one-off gradients in product components with semantic token-backed variants before implementing V3 at scale. Current shell/profile code still embeds many raw values ([app-shell.tsx](/D:/projects/trackcrow/src/components/product/app-shell.tsx:211)).
- Prefer typed tone props such as `tone="review" | "success" | "info" | "destructive"` over passing long class strings between feature components.
- Keep URL/query behavior out of visual components. Reusable filter controls should emit typed changes; feature adapters can translate those changes into query params.
- Build responsive behavior into table/list primitives up front. The design system requires desktop density and mobile stacked review cards, so V3 should not rely only on `overflow-x-auto`.
- Keep form state and mutation orchestration out of detail presentation components. Detail pages should compose hooks plus presentational panels, not put all behavior in one view file.

## Existing Duplication To Retire

- Dashboard style constants should stop being the shared styling source for transactions and recipients. Replace them with product-level `Panel`, `DataTable`, and action primitives.
- Local `SortHeader`, `Pagination`, and page-control implementations in list pages should collapse into a single table/navigation component family.
- Inline badges and chips should become semantic primitives so category, recipient, source, import, and quick-check states do not drift.
- Local copy buttons, metadata rows, definition grids, and quick-check rows should move out of detail pages into reusable detail/display components.
- Custom portal select logic should be replaced by one shared popover/select primitive, as already flagged in the previous frontend review.

## Assumptions And Constraints

- The V3 mockups in `docs/assets/mocks/review-workspace-concept-v3/` are the source of truth for the new UI direction.
- This review uses the mockup file inventory and dimensions as local evidence. The current sandbox blocked direct image rendering through the viewer, so a human visual pass over the PNGs should be done before final implementation decisions.
- This artifact intentionally avoids implementation sequencing, migration steps, and feature delivery scope. It defines the reusable component surface needed to build V3 properly.
