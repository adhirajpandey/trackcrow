import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";

import {
  buildChartBuckets,
  buildChartTooltip,
  buildRecentTransactionMeta,
  buildRecentTransactionsSummary,
  buildDashboardInsights,
  buildMetricComparisons,
  buildChartTicks,
  buildImportsReviewHref,
  buildPeriodTransactionsHref,
  buildReviewQueueCard,
  buildTransactionsHref,
  buildUncategorizedTransactionsHref,
  buildWhatChangedSummary,
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
    expect(formatCompactCurrency(1882624, { style: "kpi" })).toBe("\u20b918.8L");
    expect(formatCompactCurrency(76800, { style: "chart" })).toBe("\u20b977K");
    expect(formatCompactCurrency(300000, { style: "kpi" })).toBe("\u20b93.0L");
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
      categoryLabel: "Uncategorized",
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
      title: "Needs review",
      action: "Open review tasks",
      hasItems: true,
      totalReviewCount: 9,
      tasks: [
        {
          label: "Need category",
          count: 3,
          tone: "attention",
          href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&status=uncategorized",
        },
        {
          label: "Import issues",
          count: 3,
          tone: "warning",
          href: "/imports/review?startDate=2026-06-01&endDate=2026-06-21",
        },
        {
          label: "Large transactions",
          count: 3,
          tone: "info",
          href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&review=large&sortBy=amount&sortOrder=desc",
        },
      ],
      helper: "9 review items across categories, imports, and large spends.",
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
      helper: `No open review items. Nothing over ${formatCurrency(
        LARGE_TRANSACTION_THRESHOLD
      )} in this period.`,
    });
  });

  it("builds uncategorized drilldown links", () => {
    expect(buildUncategorizedTransactionsHref(range)).toBe(
      "/transactions?startDate=2026-06-01&endDate=2026-06-21&status=uncategorized"
    );
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
        categories: [
          { category: "Travel", totalSpend: 900, transactionCount: 2 },
          { category: "Food", totalSpend: 600, transactionCount: 2 },
        ],
        importIssueCount: 2,
        range,
        sectionStatus: {
          transactions: "ready",
          categories: "incomplete",
          imports: "attention",
          comparison: "ready",
        },
      })
    ).toEqual([
      {
        label: "Uncategorized",
        value: "1 need category",
        helper: "Open uncategorized transactions for this range.",
        href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&status=uncategorized",
        tone: "attention",
      },
      {
        label: "Category leader",
        value: "Travel",
        helper: "60% of spending \u00b7 \u20b9900",
        href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&category=Travel",
        tone: "neutral",
      },
      {
        label: "Import health",
        value: "2 issues flagged",
        helper: "Failed and unparseable messages waiting in review.",
        href: "/imports/review?startDate=2026-06-01&endDate=2026-06-21",
        tone: "attention",
      },
      {
        label: "Category shift",
        value: "Food to Travel",
        helper: "Compared with 2026-05-01 to 2026-05-31",
        href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&category=Travel",
        tone: "neutral",
      },
    ]);
  });

  it("builds a compact what-changed summary", () => {
    expect(
      buildWhatChangedSummary({
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
          spendingByCategory: [{ category: "Food", totalSpend: 700, transactionCount: 2 }],
        },
      })
    ).toEqual({
      title: "What changed?",
      value: "+50% vs previous period",
      helper: "Up by \u20b9500 compared with 2026-05-01 to 2026-05-31.",
    });
  });

  it("builds chart tooltip payloads and buckets", () => {
    expect(
      buildChartTooltip({
        period: { period: "2026-06-02", totalSpend: 1100, transactionCount: 3 },
        averagePeriodSpend: 750,
        peakPeriod: { period: "2026-06-02", totalSpend: 1100, transactionCount: 3 },
        latestPeriod: { period: "2026-06-02", totalSpend: 1100, transactionCount: 3 },
      })
    ).toEqual({
      title: "02 Jun 2026",
      amountLabel: "\u20b91,100",
      transactionLabel: "3 transactions",
      comparisonLabel: "Peak bucket in this range",
    });

    expect(
      buildChartBuckets({
        periods: [
          { period: "2026-06-01", totalSpend: 400, transactionCount: 1 },
          { period: "2026-06-02", totalSpend: 1100, transactionCount: 3 },
        ],
        peakPeriod: { period: "2026-06-02", totalSpend: 1100, transactionCount: 3 },
        latestPeriod: { period: "2026-06-02", totalSpend: 1100, transactionCount: 3 },
        averagePeriodSpend: 750,
        chartMax: 1200,
        periodLabelStep: 1,
        granularity: "day",
      })[0]
    ).toMatchObject({
      href: "/transactions?startDate=2026-06-01&endDate=2026-06-01",
      showLabel: true,
      tooltip: {
        title: "01 Jun 2026",
        amountLabel: "\u20b9400",
        transactionLabel: "1 transactions",
      },
    });
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
