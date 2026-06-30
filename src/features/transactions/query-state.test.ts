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
      subcategories: [],
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
      subcategory: ["Lunch", "Dinner"],
      page: "3",
      sortBy: "amount",
      sortOrder: "asc",
      transaction: "txn-12",
      review: "large",
      status: "uncategorized",
    }, {
      categories: [
        {
          id: 1,
          uuid: "cat-1",
          name: "Food",
          subcategories: [
            { id: 10, uuid: "sub-10", name: "Lunch", categoryId: 1 },
            { id: 11, uuid: "sub-11", name: "Dinner", categoryId: 1 },
          ],
        },
        {
          id: 2,
          uuid: "cat-2",
          name: "Travel",
          subcategories: [{ id: 20, uuid: "sub-20", name: "Cab", categoryId: 2 }],
        },
      ],
    });

    expect(state.query).toEqual({
      q: "rent",
      startDate: "2026-06-01",
      endDate: "2026-06-21",
      categories: ["Food", "Travel", "Uncategorized"].sort(),
      subcategories: ["Dinner", "Lunch"],
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
    });
  });

  it("honors persisted transaction ranges when range is absent", () => {
    expect(getTransactionsPageState({}, { persistedRange: "last-30-days" }).view).toMatchObject({
      range: "last-30-days",
      rangeLabel: "Last 30 days",
    });
  });

  it("clears subcategories that are incompatible with selected categories", () => {
    const state = getTransactionsPageState(
      {
        range: "all-time",
        category: "Food",
        subcategory: ["Lunch", "Cab"],
      },
      {
        categories: [
          {
            id: 1,
            uuid: "cat-1",
            name: "Food",
            subcategories: [{ id: 10, uuid: "sub-10", name: "Lunch", categoryId: 1 }],
          },
          {
            id: 2,
            uuid: "cat-2",
            name: "Travel",
            subcategories: [{ id: 20, uuid: "sub-20", name: "Cab", categoryId: 2 }],
          },
        ],
      }
    );

    expect(state.query.subcategories).toEqual(["Lunch"]);
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
      subcategories: ["Lunch"],
      page: 2,
      pageSize: transactionsPageSize,
      sortBy: "amount",
      sortOrder: "asc",
    });

    expect(params.toString()).toBe(
      "q=rent&startDate=2026-06-01&endDate=2026-06-21&category=Food&category=Uncategorized&subcategory=Lunch&page=2&size=10&sortBy=amount&sortOrder=asc"
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

