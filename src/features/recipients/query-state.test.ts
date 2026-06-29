import {
  buildRecipientsApiSearchParams,
  buildRecipientsErrorQueryResult,
  buildRecipientsQueryResult,
  getRecipientsPageState,
  isSameRecipientsQuery,
  recipientsPageSize,
} from "./query-state";

describe("recipients query state", () => {
  it("falls back to the default recipient filters", () => {
    expect(getRecipientsPageState({}).query).toEqual({
      q: "",
      page: 1,
      pageSize: recipientsPageSize,
      sortBy: "displayName",
      sortOrder: "asc",
    });
  });

  it("normalizes trimmed search input", () => {
    expect(
      getRecipientsPageState({
        q: "  biraj  ",
      }).query.q
    ).toBe("biraj");
  });

  it("falls back when page and sort params are invalid", () => {
    expect(
      getRecipientsPageState({
        page: "0",
        sortBy: "amount",
        sortOrder: "down",
      }).query
    ).toMatchObject({
      page: 1,
      sortBy: "displayName",
      sortOrder: "asc",
    });
  });

  it("compares normalized queries exactly", () => {
    const base = getRecipientsPageState({
      q: "merchant",
      page: "2",
      sortBy: "transactionCount",
      sortOrder: "desc",
    }).query;
    const same = getRecipientsPageState({
      q: "merchant",
      page: "2",
      sortBy: "transactionCount",
      sortOrder: "desc",
    }).query;
    const different = getRecipientsPageState({
      q: "merchant",
      page: "3",
      sortBy: "transactionCount",
      sortOrder: "desc",
    }).query;

    expect(isSameRecipientsQuery(base, same)).toBe(true);
    expect(isSameRecipientsQuery(base, different)).toBe(false);
  });

  it("builds recipient API params from the normalized query", () => {
    const query = getRecipientsPageState({
      q: "merchant",
      page: "2",
      sortBy: "transactionCount",
      sortOrder: "desc",
    }).query;

    expect(buildRecipientsApiSearchParams(query).toString()).toBe(
      "q=merchant&page=2&size=10&sortBy=transactionCount&sortOrder=desc"
    );
  });

  it("maps paginated API data into the recipients query result", () => {
    expect(
      buildRecipientsQueryResult({
        recipients: {
          recipients: [],
          page: 3,
          pageSize: 10,
          total: 41,
          totalPages: 5,
          hasNext: true,
          hasPrev: true,
        },
      })
    ).toEqual({
      status: "ready",
      message: null,
      recipients: [],
      pagination: {
        page: 3,
        pageSize: 10,
        total: 41,
        totalPages: 5,
        hasNext: true,
        hasPrev: true,
      },
    });
  });

  it("builds an error result with pagination defaults", () => {
    const query = getRecipientsPageState({
      page: "4",
    }).query;

    expect(buildRecipientsErrorQueryResult(query, "Nope")).toEqual({
      status: "error",
      message: "Nope",
      recipients: [],
      pagination: {
        page: 1,
        pageSize: recipientsPageSize,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
    });
  });
});
