import {
  getTimeframeTriggerLabel,
  isValidCustomRange,
  quickDashboardRanges,
  secondaryDashboardRanges,
} from "./timeframe-options";

describe("dashboard timeframe options", () => {
  it("uses the shared non-overlapping quick and more ranges", () => {
    expect(quickDashboardRanges).toEqual([
      { value: "last-30-days", label: "30D" },
      { value: "last-90-days", label: "90D" },
      { value: "this-year", label: "YTD" },
      { value: "last-12-months", label: "1Y" },
    ]);
    expect(secondaryDashboardRanges).toEqual([
      { value: "this-month", label: "This month" },
      { value: "last-month", label: "Last month" },
      { value: "last-6-months", label: "6M" },
      { value: "all-time", label: "All time" },
      { value: "custom", label: "Custom range", triggerLabel: "Custom" },
    ]);
  });

  it("shows selected secondary and legacy values in the trigger", () => {
    expect(getTimeframeTriggerLabel("last-month")).toBe("Last month");
    expect(getTimeframeTriggerLabel("custom")).toBe("Custom");
    expect(getTimeframeTriggerLabel("last-3-months")).toBe("3M");
    expect(getTimeframeTriggerLabel("last-30-days")).toBe("More");
  });

  it("validates complete ordered custom ranges", () => {
    expect(isValidCustomRange("2026-01-01", "2026-01-31")).toBe(true);
    expect(isValidCustomRange("2026-02-01", "2026-01-31")).toBe(false);
    expect(isValidCustomRange("", "2026-01-31")).toBe(false);
  });
});
