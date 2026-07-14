# TrackCrow Warm Ledger Design System

## Overview

TrackCrow is a personal expense tracker for people who import spending from SMS, review transactions, correct merchant and category details, and monitor straightforward spending summaries. The workspace should feel practical and reassuring while still being memorable.

The direction is **Warm Ledger**: a light, paper-like financial workspace with black-ink structure, soft pastel data surfaces, and deliberately playful editorial details. The dashboard is the reference implementation; the shared shell and primitives establish the foundation for the remaining authenticated screens.

## Foundations

| Token | Value | Use |
|---|---:|---|
| `background` | `#f8f2e7` | Warm ivory canvas with a subtle dot texture. |
| `foreground` / `border` | `#171714` / `#1f201d` | Primary ink and the strong structural outline. |
| `card` | `#fffdf7` | Main panels, tables, forms, and popovers. |
| `primary` | `#69d89d` | Selected navigation and constructive actions. |
| `accent` | `#f6c84a` | Review and peak-spend emphasis; never small body text on a dark surface. |
| `destructive` | `#f04444` | Errors, logout, and urgent primary review actions. |
| `info` | `#79afe7` | Neutral analytical context. |

Pastel surfaces are mint (`#e7f8ef`), blush (`#fff0ef`), lilac (`#f4f0fb`), and review yellow (`#ffd34f`). Use semantic tokens in shared code and keep raw values inside the token layer or intentionally local art direction.

## Typography, Shape, and Motion

- **Bricolage Grotesque** is the interface, display, and data font. Financial values use tabular figures.
- **Kalam Regular** is reserved for short red editorial annotations such as dashboard eyebrows and section tags. Keep it light and handwritten—never bold or marker-heavy—so it reads like a margin note rather than a heading.
- Use 2px ink borders, 6–10px corner radii, and 3–5px solid offset shadows for panels and emphasized controls. Inputs, table rows, and ordinary list items stay flat so the ledger remains calm.
- Prefer a calm 4px/8px spacing rhythm. Preserve compact, readable data density.
- Interaction transitions use opacity, color, shadow, and transform over 180–240ms. Pressed controls compress their offset shadow. Respect `prefers-reduced-motion`.

## Shared Components

- The authenticated shell remains a 276px desktop sidebar and a mobile drawer. Active navigation is mint, outlined, and visibly selected; destructive actions remain separated in the profile area.
- Cards, tables, forms, menus, drawers, and filter popovers are paper surfaces framed by ink rather than dark, layered glass. Use cards only where the surface groups an action or a specific data unit.
- Review work is unmistakable: review yellow identifies the queue, while the primary review button is coral red. Information panels use quieter pastel tones.
- Charts use labels, tooltips, and line styles in addition to color; all interactive bars must remain keyboard reachable.

## Data Tables and Filters

- Desktop ledger tables sit in one paper panel with a muted header band, 2px outer border, 1px row dividers, and no dark gradients. Keep rows approximately 64–72px tall, with hover feedback limited to a quiet mint wash.
- Amounts, counts, dates, and percentages use tabular figures. Amounts align right; labels and recipients align left. Long recipients, categories, and references wrap or truncate safely without forcing page-level horizontal scrolling.
- Sort controls retain their current keyboard behavior and visible focus treatment. Selected rows use a mint wash and an ink outline cue; review work is identified by its explicit label as well as yellow.
- Pagination is compact, paper-backed, and predictable. Keep existing URLs, query parameters, and browser navigation behavior unchanged.
- Search fields, selects, and reset controls share the same paper surface and ink border. Filter menus open as paper popovers with a muted header, clear selected state, Escape-to-close behavior, and a 44px option target.

## Transaction Listing

- The Transactions page keeps its existing title, date-range control, add action, filters, sort, pagination, row links, deletion, empty, error, and loading behaviors.
- On desktop, place the search and category controls in a single outlined toolbar above the ledger table. On mobile, retain the search-first layout and the draft filter sheet; the sheet must make Clear and Apply equally obvious.
- Mobile transactions are compact paper cards. Show recipient, amount, date/time, category, and subcategory without relying on color alone. The uncategorized badge is pale review yellow with dark ink, never a brown or dark glass treatment.
- Row detail drawers use paper surfaces, readable key/value rhythm, and the current recipient/detail/delete actions.

## Transaction Detail

- The detail view leads with a compact transaction summary: amount, payment type, date/time, and recipient. On desktop it lives at the top of the right rail; on mobile it is a mint paper panel directly beneath the header.
- Classification is the primary work surface. It is review yellow while a category is missing and returns to paper/mint once set. Its status chip always has dark ink and a visible label.
- Form fields are white paper, 2px ink bordered, and remain flat. Keep the current suggestion control, keyboard shortcuts, recipient and map links, validation, save state, and destructive deletion flow.
- The mobile save action remains sticky and respects safe areas. The danger zone is separate, clearly destructive, and never visually competes with the save action.

## Recipients and Manual Entry

- Recipient directories use the ledger-table pattern: a paper search toolbar, muted header, ink dividers, mint hover state, and tabular counts and amounts. Alias chips are paper-backed with ink text: mint for UPI, lilac/blue for card merchants, and blush/neutral for text aliases.
- Recipient detail leads with identity and spending context. Its category-pattern panel is review yellow when cleanup is required and quiet paper or mint when the recipient is fully classified. Alias transfer remains a coral confirmation, while alias creation remains constructive.
- Manual transaction entry uses grouped paper panels, 2px field borders, a mint live summary, a yellow optional classification surface until a category is selected, and the existing sticky mobile action bar.
- Settings, error, empty, loading, dialog, drawer, select, and toast surfaces are part of the authenticated workspace and use the same paper, ink, shadow, focus, and semantic-state rules.

## States

- Loading skeletons must mirror the final desktop and mobile geometry using paper panels; they must not reintroduce dark gradients or cause layout shift.
- Empty and partial-error states keep their current recovery actions and use plain language. Errors and destructive controls are coral/red; review is amber/yellow; constructive selection is mint; neutral information is blue.
- Respect reduced-motion preferences. Motion is limited to 180–240ms opacity and transform feedback, with no essential information hidden behind animation.

## Accessibility and Responsive Rules

- Maintain WCAG AA text contrast, a visible 2px focus ring, and 44px minimum interactive targets.
- Do not rely on color alone for transaction state, chart meaning, or navigation selection.
- Desktop uses the full multi-column workspace. Tablet reduces grids before reducing legibility. Mobile uses a single-column page, drawer navigation, compact controls, and readable stacked data without page-level horizontal scrolling.
- Loading states mirror final geometry to avoid layout shift; empty and error states name the condition and preserve a clear recovery action.

## Scope

Warm Ledger is light-only in this phase. The shared shell and primitives use the new foundation globally; each authenticated screen adopts the system while retaining its existing data contracts and behavior.

## Marketing Voice

The landing page is the expressive public face of the same warm, paper-like product system. Its visual language may use larger type, playful rotation, taped notes, and stronger editorial composition, but it must retain the authenticated product's ivory canvas, ink outlines, pastel surfaces, compact radii, and solid offset shadows.

- Use the brand cadence **Track · Review · Control** to explain the product simply.
- Prefer short, confident language about `spent`, `paid`, `needs a look`, `sorted`, and `payment pings`.
- Use familiar Indian payment context such as UPI, SMS, cards, bank alerts, and rupee amounts without turning the copy into a caricature.
- Present AI as a visible assistant that notices and suggests. The user always approves consequential changes.
- Avoid inflated SaaS language such as “financial intelligence,” “optimize,” “seamless,” “revolutionary,” and “magic.”
- Reserve Kalam for brief red margin notes. Primary claims and calls to action stay direct, bold, and readable in Bricolage Grotesque.
