import { buildRulesSearchParams, getRulesQuery } from "./query-state";

describe("rules query state", () => {
  it("normalizes search, status, and pagination", () => {
    expect(
      getRulesQuery({
        q: "  canteen  ",
        status: "enabled",
        page: "2",
        size: "10",
      })
    ).toEqual({
      q: "canteen",
      status: "enabled",
      page: 2,
      pageSize: 10,
    });
  });

  it("falls back to unfiltered defaults", () => {
    expect(getRulesQuery({ page: "0", size: "0", status: "unknown" })).toEqual({
      q: "",
      page: 1,
      pageSize: 20,
    });
  });

  it("preserves filters while changing page and removes cleared filters", () => {
    const filtered = buildRulesSearchParams({
      q: "canteen",
      status: "needsRepair",
      page: 3,
      pageSize: 20,
    });
    const reset = buildRulesSearchParams({ q: "", page: 1, pageSize: 20 });

    expect(filtered.toString()).toBe("page=3&size=20&q=canteen&status=needsRepair");
    expect(reset.toString()).toBe("page=1&size=20");
  });
});
