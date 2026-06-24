import {
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
});
