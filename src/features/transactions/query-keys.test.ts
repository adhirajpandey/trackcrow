import { transactionsQueryKeys } from "./query-keys";
import type { TransactionsApiQuery } from "./types";

const query: TransactionsApiQuery = {
  q: "rent",
  startDate: null,
  endDate: null,
  categories: ["Food"],
  page: 2,
  pageSize: 10,
  sortBy: "amount",
  sortOrder: "asc",
};

describe("transactions query keys", () => {
  it("uses hierarchical feature-owned tuples", () => {
    expect(transactionsQueryKeys.all).toEqual(["transactions"]);
    expect(transactionsQueryKeys.lists).toEqual(["transactions", "list"]);
    expect(transactionsQueryKeys.details).toEqual(["transactions", "detail"]);
  });

  it("includes the normalized filters in the list key", () => {
    expect(transactionsQueryKeys.list(query)).toEqual([
      "transactions",
      "list",
      { query },
    ]);
  });

  it("keeps detail keys separate from list keys", () => {
    expect(transactionsQueryKeys.detail(42)).toEqual([
      "transactions",
      "detail",
      42,
    ]);
  });
});
