import { mobileDashboardSecondaryRanges } from "./mobile-time-period-row";

describe("mobileDashboardSecondaryRanges", () => {
  it("matches the transactions mobile more-menu options and excludes custom", () => {
    expect(mobileDashboardSecondaryRanges).toEqual([
      { value: "this-month", label: "This month" },
      { value: "last-month", label: "Last month" },
      { value: "last-3-months", label: "Last 3 months" },
      { value: "last-6-months", label: "Last 6 months" },
      { value: "all-time", label: "All time" },
    ]);
  });
});
