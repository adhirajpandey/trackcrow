## Code Review Report

### Summary
This is a Next.js App Router expense tracker with a fairly clean frontend split between route pages, client-side query/view-model helpers, and shared UI chrome. The recent work is concentrated in the transaction/recipient workspaces and drilldown screens, plus the app shell refresh. Overall quality is decent, but the newest frontend paths are starting to accumulate state-handling and composition debt faster than the rest of the UI.

---

### Key Issues

#### Issue 1 - Debounced search can overwrite newer UI state
Severity: **HIGH**

**Problem**  
Both filter bars schedule URL updates with a `setTimeout` that closes over the old `filters` object, then later writes a new URL from that stale snapshot. See [transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:118) and [recipients-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-filter-controls.tsx:42).

**Why It Matters**  
If a user types, then changes sort/category/page before the 300 ms timer fires, the delayed search update can silently roll back the newer selection. That is a real correctness bug in the filtering UX, not just a polish issue.

**Suggested Fix**  
Build the next URL from `window.location.search` at timer execution time, or cancel pending search timers whenever any non-search navigation happens. Smallest fix: move from captured `filters` to "read current params, patch `q`, then navigate".

---

#### Issue 2 - Recipient query keys imply server filtering, but the frontend always refetches the full dataset
Severity: **HIGH**

**Problem**  
`useRecipientsQuery` varies its React Query key by `q/page/sort`, but the fetch ignores all of those inputs and always calls `/api/recipients` with no params; then the page view reimplements search, sort, and pagination client-side in [queries.ts](/D:/projects/trackcrow/src/features/recipients/queries.ts:18) and [recipients-view-model.ts](/D:/projects/trackcrow/src/app/(app)/recipients/_components/recipients-view-model.ts:179).

**Why It Matters**  
Every search/sort/page interaction creates a distinct cache entry and can trigger another full-list fetch even though the client is doing all derivation locally. That wastes network, scales poorly with recipient count, and creates a misleading contract for future contributors who will assume query params are honored by the fetch layer.

**Suggested Fix**  
Pick one model and make it explicit:
- Best: send `q/page/sort` to the API and stop client-side pagination/sorting.
- Minimal: keep the full-list model, but use a single query key for the recipient collection and make page/search/sort purely local derived state.

---

#### Issue 3 - Transaction detail has become a frontend god component
Severity: **HIGH**

**Problem**  
[transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:71) is doing data fetching, mutation flows, form orchestration, derived preview state, error mapping, copy-to-clipboard behavior, and a custom select primitive in one ~850-line component.

**Why It Matters**  
This is now expensive to change safely. Small edits to one concern force re-reading unrelated logic, and reuse is effectively blocked. The next round of product work on this screen will keep increasing regression risk because there is no clean ownership boundary inside the component.

**Suggested Fix**  
Do the smallest structural split:
1. Extract the custom select into `src/components/ui/`.
2. Extract sidebar panels (`Metadata`, `Quick checks`, `Danger zone`) into separate presentational components.
3. Move submit/delete/suggest handlers into a screen-level hook.

That keeps behavior intact while reducing blast radius.

---

#### Issue 4 - Custom dropdown logic is duplicated across multiple frontend surfaces
Severity: **MEDIUM**

**Problem**  
Very similar portal/menu/open-close/outside-click positioning logic exists in [dashboard-timeframe-picker.tsx](/D:/projects/trackcrow/src/app/(app)/dashboard/_components/dashboard-timeframe-picker.tsx:123), [transactions-filter-controls.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/_components/transactions-filter-controls.tsx:49), and [transaction-detail-page-view.tsx](/D:/projects/trackcrow/src/app/(app)/transactions/[id]/_components/transaction-detail-page-view.tsx:716).

**Why It Matters**  
This is already enough duplication to create behavioral drift. Any bug fix around portal positioning, outside click handling, keyboard behavior, or z-index now needs to be repeated in several places, and one missed copy will leave the UI inconsistent.

**Suggested Fix**  
Extract one shared popover/select primitive and convert the current call sites incrementally. Start with the transaction detail `ThemedSelect`, since it is the most reusable piece.

---

### Final Assessment

**Codebase Maturity:**  
Mid

**Biggest Architectural Risk:**  
The frontend is letting screen components absorb query-state logic and custom interaction primitives instead of keeping those concerns in small reusable units. That will make the recent workspace screens progressively harder to evolve.

**Highest-Impact Next Improvement:**  
Clean up the recipient/transaction URL-state and query contract first, especially the stale debounced search flow and the full-list recipient fetch model.

---

### Verification Note

I could not run `pnpm lint` or targeted `pnpm test` in this environment because `pnpm` aborted on an interactive modules-directory purge (`ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`).
