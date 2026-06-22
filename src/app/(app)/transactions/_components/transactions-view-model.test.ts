import type { TransactionsPageData } from "@/server/page-data/transactions-page-data";

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

const baseFilters: TransactionsPageData["filters"] = {
  q: "rent",
  range: "custom",
  rangeLabel: "01 Jun 2026 - 21 Jun 2026",
  startDate: "2026-06-01",
  endDate: "2026-06-21",
  categories: ["Food"],
  page: 3,
  sortBy: "amount",
  sortOrder: "asc",
  selectedTransactionUuid: "txn-12",
  review: "large",
  status: null,
};

describe("transactions view model", () => {
  it("builds category toggle hrefs for add, remove, and multi-select flows", () => {
    expect(buildToggleCategoryHref(baseFilters, "Travel")).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&category=Travel&transaction=txn-12&review=large&page=1&sortBy=amount&sortOrder=asc"
    );

    expect(buildToggleCategoryHref(baseFilters, "Food")).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&transaction=txn-12&review=large&page=1&sortBy=amount&sortOrder=asc"
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
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&transaction=txn-12&review=large&page=1&sortBy=amount&sortOrder=asc"
    );
  });

  it("preserves custom range state while toggling categories and paging", () => {
    expect(buildSearchHref(baseFilters, "  groceries ")).toBe(
      "/transactions?range=custom&q=groceries&startDate=2026-06-01&endDate=2026-06-21&category=Food&transaction=txn-12&review=large&page=1&sortBy=amount&sortOrder=asc"
    );

    expect(buildPageHref(baseFilters, 2)).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&transaction=txn-12&review=large&page=2&sortBy=amount&sortOrder=asc"
    );

    expect(buildTransactionsRangeHref(baseFilters, "custom", "2026-05-01", "2026-05-31")).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-05-01&endDate=2026-05-31&category=Food&transaction=txn-12&review=large&page=1&sortBy=amount&sortOrder=asc"
    );
  });

  it("preserves repeated categories through sorting and reset page links", () => {
    const multiCategoryFilters: TransactionsPageData["filters"] = {
      ...baseFilters,
      categories: ["Food", "Travel"],
      sortBy: "timestamp",
      sortOrder: "desc",
    };

    expect(buildSortHref(multiCategoryFilters, "amount")).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&category=Travel&transaction=txn-12&review=large&page=1&sortBy=amount&sortOrder=desc"
    );

    expect(buildClearCategoriesHref(multiCategoryFilters)).toBe(
      "/transactions?range=custom&q=rent&startDate=2026-06-01&endDate=2026-06-21&transaction=txn-12&review=large&page=1&sortBy=timestamp&sortOrder=desc"
    );
  });

  it("clears drilldown and selection state in the reset href", () => {
    expect(buildResetHref()).toBe("/transactions?range=all-time&sortBy=timestamp&sortOrder=desc");
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
        status: "uncategorized",
      })
    ).toEqual([
      { name: "range", value: "custom" },
      { name: "sortBy", value: "amount" },
      { name: "sortOrder", value: "asc" },
      { name: "startDate", value: "2026-06-01" },
      { name: "endDate", value: "2026-06-21" },
      { name: "transaction", value: "txn-12" },
      { name: "review", value: "large" },
      { name: "status", value: "uncategorized" },
      { name: "category", value: "Food" },
      { name: "category", value: "Uncategorized" },
    ]);
  });
});
