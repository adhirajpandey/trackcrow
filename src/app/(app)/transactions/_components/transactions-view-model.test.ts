import type { TransactionsControlState } from "@/features/transactions/types";

import {
  buildCategoryTriggerLabel,
  buildClearCategoriesHref,
  buildFilterFormHiddenParams,
  buildPageHref,
  buildResetHref,
  buildSearchHref,
  buildSortHref,
  buildToggleCategoryHref,
  buildTransactionsRangeHref,
} from "./transactions-view-model";

const baseFilters: TransactionsControlState = {
  q: "rent",
  startDate: "2026-06-01",
  endDate: "2026-06-21",
  categories: ["Food"],
  subcategories: [],
  page: 3,
  pageSize: 10,
  sortBy: "amount",
  sortOrder: "asc",
  range: "custom",
  rangeLabel: "01 Jun 2026 - 21 Jun 2026",
  selectedTransactionUuid: "txn-12",
  review: "large",
  status: null,
};

describe("transactions view model", () => {
  it("builds category toggle hrefs for add, remove, and multi-select flows", () => {
    expect(buildToggleCategoryHref(baseFilters, "Travel")).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&category=Travel&transaction=txn-12&review=large&page=1&size=10&sortBy=amount&sortOrder=asc"
    );

    expect(buildToggleCategoryHref(baseFilters, "Food")).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&transaction=txn-12&review=large&page=1&size=10&sortBy=amount&sortOrder=asc"
    );

    expect(
      buildToggleCategoryHref(
        {
          ...baseFilters,
          categories: ["Food", "Travel"],
        },
        "Travel"
      )
    ).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&transaction=txn-12&review=large&page=1&size=10&sortBy=amount&sortOrder=asc"
    );
  });

  it("preserves custom range state while toggling categories and paging", () => {
    expect(buildSearchHref(baseFilters, "  groceries ")).toBe(
      "/transactions?range=custom&q=groceries&startDate=2026-06-01&endDate=2026-06-21&category=Food&transaction=txn-12&review=large&page=1&size=10&sortBy=amount&sortOrder=asc"
    );

    expect(buildPageHref(baseFilters, 2)).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&transaction=txn-12&review=large&page=2&size=10&sortBy=amount&sortOrder=asc"
    );

    expect(buildTransactionsRangeHref(baseFilters, "custom", "2026-05-01", "2026-05-31")).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-05-01&endDate=2026-05-31&category=Food&transaction=txn-12&review=large&page=1&size=10&sortBy=amount&sortOrder=asc"
    );
  });

  it("preserves repeated categories through sorting and reset page links", () => {
    const multiCategoryFilters: TransactionsControlState = {
      ...baseFilters,
      categories: ["Food", "Travel"],
      sortBy: "timestamp",
      sortOrder: "desc",
    };

    expect(buildSortHref(multiCategoryFilters, "amount")).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&category=Travel&transaction=txn-12&review=large&page=1&size=10&sortBy=amount&sortOrder=desc"
    );

    expect(buildClearCategoriesHref(multiCategoryFilters)).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&transaction=txn-12&review=large&page=1&size=10&sortBy=timestamp&sortOrder=desc"
    );
  });

  it("clears drilldown and selection state in the reset href", () => {
    expect(buildResetHref(baseFilters)).toBe(
      "/transactions?range=custom&startDate=2026-06-01&endDate=2026-06-21&sortBy=timestamp&sortOrder=desc"
    );
  });

  it("builds category trigger labels for none, one, many, and uncategorized states", () => {
    expect(buildCategoryTriggerLabel({ ...baseFilters, categories: [] })).toBe("All categories");
    expect(buildCategoryTriggerLabel(baseFilters)).toBe("Food");
    expect(
      buildCategoryTriggerLabel({ ...baseFilters, categories: ["Food", "Travel"] })
    ).toBe("2 categories");
    expect(
      buildCategoryTriggerLabel({ ...baseFilters, categories: ["Uncategorized"] })
    ).toBe("Uncategorized");
  });

  it("keeps repeated categories and drilldown state in hidden form params", () => {
    expect(
      buildFilterFormHiddenParams({
        ...baseFilters,
        categories: ["Food", "Uncategorized"],
        subcategories: ["Lunch"],
        status: "uncategorized",
      })
    ).toEqual([
      { name: "range", value: "custom" },
      { name: "size", value: 10 },
      { name: "sortBy", value: "amount" },
      { name: "sortOrder", value: "asc" },
      { name: "startDate", value: "2026-06-01" },
      { name: "endDate", value: "2026-06-21" },
      { name: "transaction", value: "txn-12" },
      { name: "review", value: "large" },
      { name: "status", value: "uncategorized" },
      { name: "category", value: "Food" },
      { name: "category", value: "Uncategorized" },
      { name: "subcategory", value: "Lunch" },
    ]);
  });
});
