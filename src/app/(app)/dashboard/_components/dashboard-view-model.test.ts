import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";

import {
  buildRecentTransactionMeta,
  buildRecentTransactionsSummary,
  buildDashboardInsights,
  buildMetricComparisons,
  buildChartTicks,
  buildImportsReviewHref,
  buildPeriodTransactionsHref,
  buildReviewQueueCard,
  buildTransactionsHref,
  formatCompactCurrency,
  formatComparisonDelta,
  formatCurrency,
  formatDashboardRangeLabel,
  formatPeriodLabel,
  getAveragePeriodSpend,
  getCategoryShare,
  getPeakPeriod,
  getPeriodBounds,
  getPeriodLabelStep,
  getTopCategoryInsight,
} from "./dashboard-view-model";

const range = {
  value: "this-month" as const,
  label: "This month",
  startDate: "2026-06-01",
  endDate: "2026-06-21",
  granularity: "day" as const,
};

describe("dashboard view model", () => {
  it("builds a label cadence based on point count", () => {
    expect(getPeriodLabelStep(4)).toBe(1);
    expect(getPeriodLabelStep(8)).toBe(2);
    expect(getPeriodLabelStep(12)).toBe(3);
    expect(getPeriodLabelStep(24)).toBe(4);
    expect(getPeriodLabelStep(30)).toBe(5);
  });

  it("picks the period with the highest total", () => {
    expect(
      getPeakPeriod([
        { period: "2025-01", totalSpend: 100, transactionCount: 1 },
        { period: "2025-02", totalSpend: 350, transactionCount: 2 },
        { period: "2025-03", totalSpend: 280, transactionCount: 3 },
      ])
    ).toEqual({
      period: "2025-02",
      totalSpend: 350,
      transactionCount: 2,
    });
  });

  it("builds rounded chart ticks from nice steps", () => {
    expect(buildChartTicks(58000)).toEqual([
      { ratio: 0, value: 0 },
      { ratio: 1 / 3, value: 20000 },
      { ratio: 2 / 3, value: 40000 },
      { ratio: 1, value: 60000 },
    ]);
    expect(buildChartTicks(74000)).toEqual([
      { ratio: 0, value: 0 },
      { ratio: 1 / 3, value: 25000 },
      { ratio: 2 / 3, value: 50000 },
      { ratio: 1, value: 75000 },
    ]);
  });

  it("formats period labels for month, day, and year buckets", () => {
    expect(formatPeriodLabel("2025-07")).toEqual({
      primary: "Jul",
      secondary: "2025",
    });
    expect(formatPeriodLabel("2025-07-14")).toEqual({
      primary: "14 Jul",
      secondary: "2025",
    });
    expect(formatPeriodLabel("2025")).toEqual({ primary: "2025", secondary: null });
  });

  it("formats selected dashboard date ranges for display", () => {
    expect(
      formatDashboardRangeLabel({
        value: "last-12-months",
        label: "Last 12 months",
        startDate: "2025-07-01",
        endDate: "2026-06-21",
        granularity: "month",
      })
    ).toBe("Jul 2025 - Jun 2026");
    expect(
      formatDashboardRangeLabel({
        value: "last-30-days",
        label: "Last 30 days",
        startDate: "2026-05-23",
        endDate: "2026-06-21",
        granularity: "day",
      })
    ).toBe("23 May 2026 - 21 Jun 2026");
    expect(
      formatDashboardRangeLabel({
        value: "all-time",
        label: "All time",
        startDate: null,
        endDate: null,
        granularity: "year",
      })
    ).toBe("All time");
  });

  it("excludes uncategorized and transfer-style categories from biggest category", () => {
    expect(
      getTopCategoryInsight(
        [
          { category: "Uncategorized", totalSpend: 70000, transactionCount: 20 },
          { category: "Transfers", totalSpend: 20000, transactionCount: 5 },
          { category: "Essentials", totalSpend: 600, transactionCount: 5 },
          { category: "Food", totalSpend: 400, transactionCount: 4 },
        ],
        1000
      )
    ).toEqual({
      category: "Essentials",
      totalSpend: 600,
      transactionCount: 5,
      share: 60,
    });
    expect(
      getTopCategoryInsight(
        [
          { category: "Uncategorized", totalSpend: 70000, transactionCount: 20 },
          { category: "Internal transfers", totalSpend: 20000, transactionCount: 5 },
        ],
        90000
      )
    ).toBeNull();
    expect(getCategoryShare(125, 500)).toBe(25);
  });

  it("formats INR values with Indian grouping and compact lakh scale", () => {
    expect(formatCurrency(1882624)).toBe("\u20b918,82,624");
    expect(formatCompactCurrency(1882624)).toBe("\u20b918.83L");
    expect(formatCompactCurrency(76800)).toBe("\u20b976.8K");
    expect(formatCompactCurrency(598)).toBe("\u20b9598");
  });

  it("formats comparison deltas for metric cards", () => {
    expect(formatComparisonDelta(1500, 1000)).toBe("+50% vs previous period");
    expect(formatComparisonDelta(900, 1000)).toBe("-10% vs previous period");
    expect(formatComparisonDelta(0, 0)).toBe("No previous data");
    expect(formatComparisonDelta(500, null)).toBe("No previous data");
  });

  it("builds dashboard drilldown links", () => {
    expect(
      buildTransactionsHref({
        startDate: "2026-06-01",
        endDate: "2026-06-21",
        category: "Food",
        status: null,
      })
    ).toBe("/transactions?startDate=2026-06-01&endDate=2026-06-21&category=Food");
    expect(buildImportsReviewHref(range)).toBe(
      "/imports/review?startDate=2026-06-01&endDate=2026-06-21"
    );
  });

  it("builds recent transaction metadata without repeated uncategorized text", () => {
    expect(
      buildRecentTransactionMeta("Food", "2026-06-20T06:15:00.000Z", {
        now: new Date("2026-06-20T12:00:00.000Z"),
      })
    ).toEqual({
      timestampLabel: "11:45 am",
      isSameDay: true,
      categoryLabel: "Food",
      needsCategory: false,
    });
    expect(
      buildRecentTransactionMeta(null, "2026-06-18T00:00:00.000Z", {
        now: new Date("2026-06-20T12:00:00.000Z"),
      })
    ).toEqual({
      timestampLabel: "18 Jun",
      isSameDay: false,
      categoryLabel: "No category",
      needsCategory: true,
    });
  });

  it("builds the recent transaction section summary", () => {
    expect(
      buildRecentTransactionsSummary({
        transactionCount: 10,
        uncategorizedCount: 8,
      })
    ).toBe("10 recent \u00b7 8 need category");
    expect(
      buildRecentTransactionsSummary({
        transactionCount: 4,
        uncategorizedCount: 0,
      })
    ).toBe("4 recent \u00b7 All categorized");
  });

  it("derives compact review queue copy with the shared threshold", () => {
    expect(
      buildReviewQueueCard({
        range,
        summary: {
          totalSpend: 1000,
          transactionCount: 10,
          categorizedCount: 7,
          uncategorizedCount: 3,
          averageSpend: 100,
        },
        importHealth: { parsedCount: 5, failedCount: 1, unparseableCount: 2 },
        largeTransactionCount: 3,
      })
    ).toMatchObject({
      title: "Review queue",
      action: "Review",
      hasItems: true,
      totalReviewCount: 9,
      badges: [
        { label: "Needs category", count: 3, tone: "attention" },
        { label: "Import issues", count: 3, tone: "warning" },
        { label: "Large spends", count: 3, tone: "info" },
      ],
      lines: [
        "3 need category",
        "3 imports need review",
        `3 large spends over ${formatCurrency(LARGE_TRANSACTION_THRESHOLD)}`,
      ],
    });
  });

  it("derives the review queue success state", () => {
    expect(
      buildReviewQueueCard({
        range,
        summary: {
          totalSpend: 1000,
          transactionCount: 10,
          categorizedCount: 10,
          uncategorizedCount: 0,
          averageSpend: 100,
        },
        importHealth: { parsedCount: 5, failedCount: 0, unparseableCount: 0 },
        largeTransactionCount: 0,
      })
    ).toMatchObject({
      action: "View transactions",
      hasItems: false,
      lines: ["All caught up", "No items need review"],
      helper: `Nothing over ${formatCurrency(LARGE_TRANSACTION_THRESHOLD)} in this period.`,
    });
  });

  it("builds chart bucket transaction links", () => {
    expect(getPeriodBounds("2026-06-01", "day")).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-01",
    });
    expect(getPeriodBounds("2026-06-01", "week")).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-07",
    });
    expect(getPeriodBounds("2026-06", "month")).toEqual({
      startDate: "2026-06-01",
      endDate: "2026-06-30",
    });
    expect(getPeriodBounds("2026", "year")).toEqual({
      startDate: "2026-01-01",
      endDate: "2026-12-31",
    });
    expect(buildPeriodTransactionsHref("2026-06", "month")).toBe(
      "/transactions?startDate=2026-06-01&endDate=2026-06-30"
    );
  });

  it("calculates average period spend", () => {
    expect(
      getAveragePeriodSpend([
        { period: "2025-01", totalSpend: 100, transactionCount: 1 },
        { period: "2025-02", totalSpend: 300, transactionCount: 2 },
      ])
    ).toBe(200);
  });

  it("builds dashboard insights from current and comparison data", () => {
    expect(
      buildDashboardInsights({
        summary: {
          totalSpend: 1500,
          transactionCount: 4,
          categorizedCount: 3,
          uncategorizedCount: 1,
          averageSpend: 375,
        },
        comparison: {
          rangeLabel: "2026-05-01 to 2026-05-31",
          summary: {
            totalSpend: 1000,
            transactionCount: 3,
            categorizedCount: 3,
            uncategorizedCount: 0,
            averageSpend: 333,
          },
          spendingByCategory: [
            { category: "Food", totalSpend: 700, transactionCount: 2 },
          ],
        },
        periods: [
          { period: "2026-06-01", totalSpend: 400, transactionCount: 1 },
          { period: "2026-06-02", totalSpend: 1100, transactionCount: 3 },
        ],
        categories: [
          { category: "Travel", totalSpend: 900, transactionCount: 2 },
          { category: "Food", totalSpend: 600, transactionCount: 2 },
        ],
        importHealth: { parsedCount: 8, failedCount: 1, unparseableCount: 1 },
        largeTransactionCount: 2,
      })
    ).toEqual([
      {
        label: "Trend",
        value: "+50% vs previous period",
        helper: "Compared with 2026-05-01 to 2026-05-31",
      },
      {
        label: "Spike",
        value: "02 Jun 2026 at \u20b91.1K",
        helper: "3 transactions in the peak bucket",
      },
      {
        label: "Category shift",
        value: "Food to Travel",
        helper: "60% of selected spending",
      },
      {
        label: "Review pressure",
        value: "5 items need review",
        helper: "1 uncategorized, 2 import issues",
      },
    ]);
  });

  it("builds top-card comparisons from previous-period data", () => {
    expect(
      buildMetricComparisons({
        summary: {
          totalSpend: 1500,
          transactionCount: 4,
          categorizedCount: 3,
          uncategorizedCount: 1,
          averageSpend: 375,
        },
        comparison: {
          rangeLabel: "2026-05-01 to 2026-05-31",
          summary: {
            totalSpend: 1000,
            transactionCount: 3,
            categorizedCount: 3,
            uncategorizedCount: 0,
            averageSpend: 300,
          },
          spendingByCategory: [{ category: "Food", totalSpend: 700, transactionCount: 2 }],
        },
        categories: [{ category: "Travel", totalSpend: 900, transactionCount: 2 }],
      })
    ).toEqual({
      totalSpend: "+50% vs previous period",
      averageSpend: "+25% vs previous period",
      biggestCategory: "Food to Travel",
    });
  });
});
