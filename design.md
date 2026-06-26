# TrackCrow Calm Ledger Design System

## Overview

TrackCrow is a personal expense tracking product for users who capture spending from SMS, review imported transactions, correct merchant/category details, and read simple spending summaries. The interface should feel calm, trustworthy, and built for repeated financial review rather than marketing spectacle.

The design direction is **Calm Ledger**: dark-only, data-dense, restrained, and privacy-conscious. TrackCrow should not borrow the visual language of database tooling, neon developer brands, or generic crypto finance dashboards. It should feel like a quiet transaction workspace: clear numbers, stable surfaces, readable tables, and purposeful status color.

**Key characteristics:**
- Deep ink charcoal page background, not pure black.
- Ledger green primary color for brand identity, constructive actions, and selected navigation.
- Amber review accent for SMS imports, uncategorized items, pending corrections, and attention states.
- Muted blue information accent for neutral analytics, links, and non-urgent system feedback.
- Red destructive color reserved for failed imports, deletes, revokes, and irreversible actions.
- Layered graphite/slate surfaces with restrained borders and minimal shadow.
- Dense but readable spacing for dashboards, transaction tables, and settings screens.
- Semantic tokens only in app code, with raw color values contained in the token layer.

## Colors

### Brand And Semantic Tokens

| Token | Value | Use |
|---|---:|---|
| `{colors.background}` | `#0f1411` | App canvas and page floor. Deep ink charcoal with a slight green cast. |
| `{colors.foreground}` | `#edf5ef` | Primary text on dark surfaces. |
| `{colors.card}` | `#17201b` | Standard panels, metric tiles, table containers, and forms. |
| `{colors.card-foreground}` | `#edf5ef` | Text on card surfaces. |
| `{colors.popover}` | `#1b261f` | Menus, dialogs, sheets, and dropdowns. |
| `{colors.popover-foreground}` | `#edf5ef` | Text on popovers. |
| `{colors.primary}` | `#68d391` | Ledger green: primary actions, active navigation, selected rows, positive brand emphasis. |
| `{colors.primary-active}` | `#7ee6a5` | Primary hover/pressed state. |
| `{colors.primary-foreground}` | `#07110b` | Text/icons on primary backgrounds. |
| `{colors.secondary}` | `#223027` | Secondary buttons, subdued active states, elevated controls. |
| `{colors.secondary-foreground}` | `#d7e5dc` | Text/icons on secondary surfaces. |
| `{colors.muted}` | `#121a16` | Sidebar panels, subtle bands, skeleton bases. |
| `{colors.muted-foreground}` | `#9fb2a7` | Secondary labels, helper text, timestamps, empty-state body. |
| `{colors.accent}` | `#f2b84b` | Review amber for import attention, uncategorized badges, and pending states. |
| `{colors.accent-foreground}` | `#1a1204` | Text/icons on amber accent backgrounds. |
| `{colors.info}` | `#79a8d8` | Neutral analytics, informational links, chart highlights. |
| `{colors.destructive}` | `#ff6b6b` | Failed states, deletes, revokes, irreversible confirmations. |
| `{colors.border}` | `#2b3a31` | Standard borders and dividers. |
| `{colors.input}` | `#31433a` | Input borders and control outlines. |
| `{colors.ring}` | `#68d391` | Focus rings and keyboard-visible outlines. |

### Color Roles

- Use ledger green for the single primary action on a screen and for selected navigation. Do not use green for every positive number.
- Use amber when a user needs to review or correct imported data. This includes SMS parsing uncertainty, uncategorized transactions, and pending category suggestions.
- Use muted blue for informational chart series, links, or system context that is not a warning.
- Use red only for errors, failed imports, destructive actions, and revoked/expired credentials.
- Do not introduce raw hex values inside feature components. Add or adjust semantic tokens first.

## Typography

TrackCrow uses the existing sans and mono stacks:

- Sans: `Inter, ui-sans-serif, system-ui, sans-serif`
- Mono: `"JetBrains Mono", "SFMono-Regular", Consolas, monospace`

The product is data-first, so type should prioritize legibility and stable numeric scanning over dramatic headlines.

| Token | Size | Weight | Line Height | Use |
|---|---:|---:|---:|---|
| `{typography.page-title}` | 32px | 650-700 | 1.15 | Page headings and marketing H1 on compact pages. |
| `{typography.section-title}` | 22px | 650 | 1.25 | Dashboard sections and settings groups. |
| `{typography.card-title}` | 14px | 650 | 1.35 | Metric tile labels, form group titles, table panel titles. |
| `{typography.body}` | 16px | 400 | 1.6 | Long-form body and explanatory copy. |
| `{typography.body-sm}` | 14px | 400 | 1.55 | Secondary body text, helper copy, empty states. |
| `{typography.caption}` | 12px | 500 | 1.4 | Metadata, timestamps, badges, compact labels. |
| `{typography.caption-uppercase}` | 11px | 650 | 1.35 | Sparse section labels and status eyebrows. |
| `{typography.amount-lg}` | 32px | 700 | 1.05 | Dashboard totals and large currency values. |
| `{typography.amount-md}` | 18px | 650 | 1.2 | Transaction row amounts and compact summaries. |
| `{typography.table}` | 14px | 400-600 | 1.45 | Transaction tables and dense lists. |
| `{typography.button}` | 14px | 650 | 1.0 | Button labels. |
| `{typography.code}` | 13px | 400 | 1.55 | Token prefixes, webhook examples, and diagnostics. |

### Type Principles

- Use tabular numbers for amounts, totals, dates, and counts where layout stability matters.
- Keep letter spacing at `0` for body, amounts, and table text.
- Uppercase labels are allowed only for compact metadata; use sparingly.
- Prefer wrapping important merchant/category text over truncating it. If truncation is unavoidable, expose the full value through a title or detail view.

## Layout

### Spacing

Use a 4px base scale with predictable product density:

| Token | Value | Use |
|---|---:|---|
| `{spacing.xs}` | 4px | Icon/text nudges and dense inline gaps. |
| `{spacing.sm}` | 8px | Related controls, badge spacing. |
| `{spacing.md}` | 12px | Compact groups and table-cell rhythm. |
| `{spacing.lg}` | 16px | Default component padding and form spacing. |
| `{spacing.xl}` | 24px | Card padding and page subsection gaps. |
| `{spacing.2xl}` | 32px | Page header gaps and major panel separation. |
| `{spacing.3xl}` | 48px | Marketing section rhythm and large empty states. |

### Grid And Containers

- Authenticated app screens use the existing left navigation shell with a max content width appropriate for tables and charts.
- Dashboard screens should use responsive grids that prioritize metric cards first, then charts, then review queues.
- Transaction screens should favor table/list density on desktop and stacked review cards on narrow mobile.
- Settings and token-management screens should use narrower content widths so destructive actions remain deliberate.

## Elevation, Shape, And Texture

TrackCrow should feel layered, not glossy.

| Level | Treatment | Use |
|---|---|---|
| Canvas | `{colors.background}` with subtle ledger-grid texture | Page background. |
| Muted panel | `{colors.muted}` with border | Sidebar and low-emphasis bands. |
| Card | `{colors.card}` with `1px` border | Metric tiles, tables, forms, empty states. |
| Popover | `{colors.popover}` with stronger border and soft shadow | Menus, dialogs, sheets. |
| Alert | Semantic tinted surface plus border | Review, error, success, and info messages. |

Radius scale:

| Token | Value | Use |
|---|---:|---|
| `{rounded.sm}` | 6px | Badges, compact chips. |
| `{rounded.md}` | 8px | Buttons, inputs, nav items. |
| `{rounded.lg}` | 12px | Cards, dialogs, popovers. |
| `{rounded.full}` | 9999px | Avatars and pills. |

Avoid heavy glow, neon borders, glassmorphism, decorative blobs, and marketing-style oversized cards. Texture should be subtle: a low-opacity ledger grid is acceptable because it reinforces the finance workspace without competing with data.

## Components

### App Shell

**`app-shell`** is the authenticated workspace. The sidebar uses `{colors.muted}` or a muted tint over the background, selected navigation uses ledger green text or a card-backed active state, and the header stays compact. The shell should make financial data feel private and stable.

Navigation order should reflect workflow priority:

1. Dashboard
2. Transactions
3. Categories
4. Recipients
5. Settings

### Buttons

**`button-primary`** uses `{colors.primary}` with `{colors.primary-foreground}`. Use for one primary action per screen, such as adding a transaction, saving a correction, or creating a device token.

**`button-secondary`** uses `{colors.secondary}` and a border. Use for sign out, cancel, filter toggles, and lower-emphasis actions.

**`button-ghost`** is transparent until hover/focus. Use inside navigation, compact toolbars, and icon-only controls.

**Destructive actions** should not reuse the primary button. Use destructive color and a confirmation step for delete, reset, revoke, or irreversible import cleanup.

### Cards And Panels

**`metric-tile`** shows one financial total, count, or trend. Amounts use tabular numbers. The label is subdued; the number is high contrast; trend state uses text plus icon, not color alone.

**`dashboard-chart-panel`** contains analytics such as spending by period or category. Chart color must not be the only carrier of meaning; labels, legends, and tooltips must remain readable.

**`transaction-table-panel`** frames the transaction list. It supports scanning by amount, date, recipient, category, and source. Rows should have clear hover/focus states without shifting layout.

**`review-queue-panel`** highlights imported transactions that need attention. Use amber sparingly for status badges, borders, or icons.

**`settings-panel`** groups account, device token, and import configuration controls. Sensitive values such as token prefixes use mono text and clear copy/revoke affordances.

### Transaction Review

Transaction review is the core product loop:

- Show recipient, amount, date, source, category, and subcategory in a stable order.
- SMS-sourced records should expose source/status metadata without making the UI feel like a log viewer.
- Category suggestions should look provisional until accepted.
- Uncategorized and uncertain transactions use amber review treatment.
- Manual edits should clearly distinguish editable fields from derived or historical metadata.

### SMS Import States

Use a consistent status model:

| State | Visual Role |
|---|---|
| Imported | Normal card/list treatment with source metadata. |
| Needs review | Amber badge or left border plus clear next action. |
| Parse failed | Destructive alert with the recovery path. |
| Duplicate or ignored | Muted info treatment. |
| Token revoked/expired | Destructive state in settings and import feedback. |

Do not expose raw SMS bodies by default in list views. If raw content is shown, keep it inside a deliberate detail or diagnostics area.

### Categories And Filters

Category chips are compact and readable. Active filters should be visibly selected using card/primary treatment, not only color. Category-management views should separate default categories, user edits, and destructive reset actions.

### Empty, Loading, And Error States

- Empty states should name the missing data and provide one clear next action.
- Loading states should use skeletons inside the final layout footprint.
- Error states should explain the cause at user level and provide retry, edit, or navigation recovery.
- Full-page spinners should be avoided for normal authenticated product loading.

## Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| Mobile `< 768px` | Sidebar becomes a drawer. Transaction tables become stacked review cards. Filters collapse into compact controls. |
| Tablet `768-1024px` | Dashboard grids reduce columns. Tables keep key columns and move secondary metadata into row details. |
| Desktop `>= 1024px` | Persistent sidebar, dense tables, multi-column dashboard. |
| Wide `> 1440px` | Content remains constrained enough for scanning; do not stretch text-heavy panels edge to edge. |

Touch targets should be at least 40px in current primitives and preferably 44px when practical for new controls.

## Do And Do Not

### Do

- Build around transaction review, SMS import confidence, category hygiene, and dashboard insight.
- Keep raw color values in token definitions and use semantic classes in components.
- Use tabular numbers for currency, dates, counts, and percentages.
- Use amber only when user review or attention is required.
- Keep destructive actions visually distinct and confirmed.
- Preserve visible focus states for every interactive control.

### Do Not

- Do not copy database-tooling, crypto-dashboard, or neon developer-brand patterns.
- Do not use pure black plus highlighter-yellow as the brand system.
- Do not turn the landing page into a generic SaaS hero before the product workspace is stable.
- Do not use color alone to communicate success, warning, or error.
- Do not hide privacy-sensitive SMS or token data in casual decorative UI.
- Do not introduce light mode or a theme toggle until the light token set is intentionally designed.

## Implementation Path

This document defines visual direction. Implementation should continue through:

```txt
design.md
  -> semantic tokens
  -> src/app/globals.css
  -> src/components/ui primitives
  -> shared product components
  -> feature screens
```

For the current pass, update only the design source, semantic CSS token values, and primitive styles that still encode the copied yellow system.

## Known Gaps

- Light mode is intentionally deferred.
- Full chart palette and categorical color mapping are not yet formalized.
- A dedicated table density system may be added after transaction and category screens stabilize.
- Marketing page art direction is secondary to authenticated product workflow and can be refined later.
