import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import {
  buildCalendarDays,
  buildUncategorizedTransactionsHref,
  buildWeeks,
  formatCompactCurrency,
  formatCompactDateRange,
  formatCurrency,
  formatDashboardRangeLabel,
  formatIstTime,
  formatShare,
  formatShortDate,
  getCalendarRange,
  getComparisonLabel,
  getRangeName,
  getSpendTier,
  median,
  toIstDay,
} from "./dashboard-view-model";

const range = (overrides: Partial<DashboardPageData["range"]>): DashboardPageData["range"] => ({
  value: "last-month",
  label: "Last month",
  startDate: "2026-10-01",
  endDate: "2026-10-31",
  granularity: "day",
  ...overrides,
});

describe("dashboard view model", () => {
  it("formats currency in full and in compact form without rounding ₹2.5K up", () => {
    expect(formatCurrency(156121.56)).toBe("₹1,56,122");
    expect(formatCompactCurrency(480)).toBe("₹480");
    expect(formatCompactCurrency(2500)).toBe("₹2.5K");
    expect(formatCompactCurrency(42399)).toBe("₹42K");
    expect(formatCompactCurrency(156121)).toBe("₹1.6L");
  });

  it("reports small shares as <1 rather than 0", () => {
    expect(formatShare(564, 156121)).toBe("<1");
    expect(formatShare(0, 156121)).toBe("0");
    expect(formatShare(42399, 156121)).toBe("27");
  });

  it("takes the median of an odd and an even number of days", () => {
    expect(median([5, 1, 3])).toBe(3);
    expect(median([1, 2, 3, 10])).toBe(2.5);
    expect(median([])).toBe(0);
  });

  it("formats timestamps in IST regardless of the machine's time zone", () => {
    expect(toIstDay("2026-10-30T19:01:48.000Z")).toBe("2026-10-31");
    expect(formatIstTime("2026-10-30T19:01:48.000Z")).toBe("00:31");
    expect(formatShortDate("2026-10-30T19:01:48.000Z")).toBe("31 Oct 2026");
  });

  it("formats date ranges like the rest of the dashboard", () => {
    expect(formatCompactDateRange("2026-10-01", "2026-10-31")).toBe("Oct 1–31, 2026");
    expect(formatCompactDateRange("2026-08-09", "2026-11-06")).toBe("Aug 9 – Nov 6, 2026");
    expect(formatCompactDateRange("2025-11-07", "2026-11-06")).toBe("Nov 7, 2025 – Nov 6, 2026");
  });

  it("keeps this month's future days in the grid but stops data at today", () => {
    const calendar = getCalendarRange(range({ value: "this-month", label: "This month", startDate: "2026-11-01", endDate: "2026-11-06" }), "2026-11-06", []);
    expect(calendar).toEqual({ start: "2026-11-01", end: "2026-11-06", gridEnd: "2026-11-30", layout: "month" });

    const days = buildCalendarDays(calendar, [{ day: "2026-11-03", totalSpend: 45074, transactionCount: 7, uncategorizedCount: 7 }]);
    expect(days).toHaveLength(30);
    expect(days[2]).toEqual({ day: "2026-11-03", total: 45074, count: 7, uncategorizedCount: 7, future: false });
    expect(days[6]).toMatchObject({ day: "2026-11-07", future: true });
  });

  it("switches to the year layout past about three months, and starts all time at the first day with data", () => {
    expect(getCalendarRange(range({ value: "last-90-days", startDate: "2026-08-09", endDate: "2026-11-06" }), "2026-11-06", []).layout).toBe("month");
    expect(getCalendarRange(range({ value: "last-12-months", startDate: "2025-11-07", endDate: "2026-11-06" }), "2026-11-06", []).layout).toBe("year");
    expect(
      getCalendarRange(range({ value: "all-time", label: "All time", startDate: null, endDate: null }), "2026-11-06", [
        { day: "2024-03-02", totalSpend: 10, transactionCount: 1, uncategorizedCount: 0 },
      ])
    ).toMatchObject({ start: "2024-03-02", end: "2026-11-06", layout: "year" });
  });

  it("builds Monday-first weeks that cover the range", () => {
    const weeks = buildWeeks("2026-10-01", "2026-10-31");
    expect(weeks[0][0]).toBe("2026-09-28");
    expect(weeks.at(-1)?.at(-1)).toBe("2026-11-01");
    expect(weeks).toHaveLength(5);
  });

  it("maps spend to the legend tiers", () => {
    expect(getSpendTier(0)).toBe(0);
    expect(getSpendTier(480)).toBe(1);
    expect(getSpendTier(2100)).toBe(2);
    expect(getSpendTier(5734)).toBe(3);
    expect(getSpendTier(42399)).toBe(4);
  });

  it("names the comparison and the range in plain words", () => {
    const calendar = getCalendarRange(range({}), "2026-11-06", []);
    const comparison = (kind: NonNullable<DashboardPageData["comparison"]>["kind"]) => ({
      kind,
      rangeLabel: "",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      summary: { totalSpend: 0, transactionCount: 0, categorizedCount: 0, uncategorizedCount: 0, averageSpend: 0 },
    });
    expect(getComparisonLabel(comparison("previous-calendar-month"), calendar)).toBe("September");
    expect(getComparisonLabel(comparison("previous-month-to-date"), calendar)).toBe("the same days last month");
    expect(getComparisonLabel(comparison("previous-equal-length"), calendar)).toBe("the previous 31 days");
    expect(getRangeName(range({}), calendar)).toBe("October");
    expect(formatDashboardRangeLabel(range({}), calendar)).toBe("Last month · Oct 1–31, 2026");
    expect(buildUncategorizedTransactionsHref(calendar)).toBe("/transactions?startDate=2026-10-01&endDate=2026-10-31&status=uncategorized");
  });
});
