import {
  buildTransactionsApiSearchParams,
  getTransactionsPageState,
  isSameTransactionsQuery,
  transactionsPageSize,
} from "./query-state";

describe("transactions query state", () => {
  it("falls back to all-time when range is missing or invalid", () => {
    expect(getTransactionsPageState({}).query).toMatchObject({
      page: 1,
      pageSize: 10,
      sortBy: "timestamp",
      sortOrder: "desc",
      categories: [],
    });
    expect(getTransactionsPageState({}).view).toMatchObject({
      range: "all-time",
      rangeLabel: "All time",
    });

    expect(
      getTransactionsPageState({
        range: "custom",
        startDate: "2026-06-10",
        endDate: "bad-date",
      }).view.range
    ).toBe("all-time");
  });

  it("normalizes query state for custom ranges, categories, and uncategorized drilldowns", () => {
    const state = getTransactionsPageState({
      q: "  rent ",
      range: "custom",
      startDate: "2026-06-01",
      endDate: "2026-06-21",
      category: ["Food", "Food", "Travel"],
      page: "3",
      sortBy: "amount",
      sortOrder: "asc",
      transaction: "txn-12",
      review: "large",
      status: "uncategorized",
    });

    expect(state.query).toEqual({
      q: "rent",
      startDate: "2026-06-01",
      endDate: "2026-06-21",
      categories: ["Food", "Travel", "Uncategorized"].sort(),
      page: 3,
      pageSize: 10,
      sortBy: "amount",
      sortOrder: "asc",
    });
    expect(state.view).toEqual({
      range: "custom",
      rangeLabel: "2026-06-01 to 2026-06-21",
      selectedTransactionUuid: "txn-12",
      review: "large",
      status: "uncategorized",
      drilldownLabel: "Large transactions drilldown",
    });
  });

  it("normalizes equivalent category input states to the same filters", () => {
    const fromRepeatedParams = getTransactionsPageState({
      range: "all-time",
      category: ["Food", "Travel"],
    });
    const fromCsv = getTransactionsPageState({
      range: "all-time",
      category: "Food,Travel",
    });

    expect(fromRepeatedParams.query).toEqual(fromCsv.query);
    expect(fromRepeatedParams.view).toEqual(fromCsv.view);
  });

  it("builds API search params from normalized backend-effective filters", () => {
    const params = buildTransactionsApiSearchParams({
      q: "rent",
      startDate: "2026-06-01",
      endDate: "2026-06-21",
      categories: ["Food", "Uncategorized"],
      page: 2,
      pageSize: transactionsPageSize,
      sortBy: "amount",
      sortOrder: "asc",
    });

    expect(params.toString()).toBe(
      "q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&category=Uncategorized&page=2&size=10&sortBy=amount&sortOrder=asc"
    );
  });

  it("compares exact normalized backend-effective queries", () => {
    const base = getTransactionsPageState({
      range: "all-time",
      q: "rent",
      page: "2",
      sortBy: "amount",
      sortOrder: "asc",
      category: ["Travel", "Food"],
    }).query;
    const same = getTransactionsPageState({
      range: "all-time",
      q: "rent",
      page: "2",
      sortBy: "amount",
      sortOrder: "asc",
      category: "Food,Travel",
    }).query;
    const different = getTransactionsPageState({
      range: "all-time",
      q: "rent",
      page: "3",
      sortBy: "amount",
      sortOrder: "asc",
      category: "Food,Travel",
    }).query;

    expect(isSameTransactionsQuery(base, same)).toBe(true);
    expect(isSameTransactionsQuery(base, different)).toBe(false);
  });
});
