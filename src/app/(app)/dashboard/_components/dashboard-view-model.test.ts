import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";

import {
  buildBiggestChangeCard,
  buildChartBuckets,
  buildChartTicks,
  buildChartTooltip,
  buildDashboardInsights,
  buildDashboardTimeframeTriggerLabel,
  buildImportIssuesHref,
  buildMetricComparisons,
  buildPeriodTransactionsHref,
  buildRecentTransactionMeta,
  buildRecentTransactionsSummary,
  buildReviewQueueCard,
  buildTransactionsHref,
  buildSuggestedRules,
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
    expect(buildChartTicks(34000)).toEqual([
      { ratio: 0, value: 0 },
      { ratio: 1 / 4, value: 10000 },
      { ratio: 1 / 2, value: 20000 },
      { ratio: 3 / 4, value: 30000 },
      { ratio: 1, value: 40000 },
    ]);
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

  it("shows selected more-range labels in the timeframe trigger", () => {
    expect(
      buildDashboardTimeframeTriggerLabel({
        value: "all-time",
        showQuickRanges: true,
        showSelectedLabelInTrigger: false,
      })
    ).toBe("All time");
    expect(
      buildDashboardTimeframeTriggerLabel({
        value: "last-6-months",
        showQuickRanges: true,
        showSelectedLabelInTrigger: false,
      })
    ).toBe("Last 6 months");
    expect(
      buildDashboardTimeframeTriggerLabel({
        value: "custom",
        showQuickRanges: true,
        showSelectedLabelInTrigger: false,
      })
    ).toBe("Custom range");
  });

  it("keeps quick dashboard ranges behind the generic more-ranges trigger", () => {
    expect(
      buildDashboardTimeframeTriggerLabel({
        value: "last-30-days",
        showQuickRanges: true,
        showSelectedLabelInTrigger: false,
      })
    ).toBe("More ranges");
  });

  it("keeps quick range labels visible when the picker has no quick button group", () => {
    expect(
      buildDashboardTimeframeTriggerLabel({
        value: "last-30-days",
        showQuickRanges: false,
        showSelectedLabelInTrigger: true,
      })
    ).toBe("30D");
  });

  it("excludes uncategorized and transfer-style categories from biggest category", () => {
    expect(
      getTopCategoryInsight(
        [
          { category: "Uncategorized", totalSpend: 70000, transactionCount: 20, topSubcategory: null },
          { category: "Transfers", totalSpend: 20000, transactionCount: 5, topSubcategory: null },
          {
            category: "Essentials",
            totalSpend: 600,
            transactionCount: 5,
            topSubcategory: { name: "Groceries", totalSpend: 400, transactionCount: 3 },
          },
          { category: "Food", totalSpend: 400, transactionCount: 4, topSubcategory: null },
        ],
        1000
      )
    ).toEqual({
      category: "Essentials",
      totalSpend: 600,
      transactionCount: 5,
      topSubcategory: { name: "Groceries", totalSpend: 400, transactionCount: 3 },
      share: 60,
    });
    expect(
      getTopCategoryInsight(
        [
          { category: "Uncategorized", totalSpend: 70000, transactionCount: 20, topSubcategory: null },
          { category: "Internal transfers", totalSpend: 20000, transactionCount: 5, topSubcategory: null },
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
    expect(buildImportIssuesHref(range)).toBe(
      "/transactions?startDate=2026-06-01&endDate=2026-06-21&review=queue"
    );
  });

  it("builds recent transaction metadata without repeated uncategorized text", () => {
    expect(
      buildRecentTransactionMeta("Food", "2026-06-20T06:15:00.000Z", {
        now: new Date("2026-06-20T12:00:00.000Z"),
      })
    ).toEqual({
      timestampLabel: "20 Jun 2026 11:45 am",
      dateLabel: "20 Jun 2026",
      timeLabel: "11:45 am",
      isSameDay: true,
      categoryLabel: "Food",
      needsCategory: false,
    });
    expect(
      buildRecentTransactionMeta(null, "2026-06-18T00:00:00.000Z", {
        now: new Date("2026-06-20T12:00:00.000Z"),
      })
    ).toEqual({
      timestampLabel: "18 Jun 2026 5:30 am",
      dateLabel: "18 Jun 2026",
      timeLabel: "5:30 am",
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
    ).toBe("10 recent");
    expect(
      buildRecentTransactionsSummary({
        transactionCount: 4,
        uncategorizedCount: 0,
      })
    ).toBe("4 recent");
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
      action: "Review now",
      hasItems: true,
      totalReviewCount: 6,
      tasks: [
        {
          label: "Need category",
          count: 3,
          tone: "attention",
          href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&status=uncategorized",
        },
        {
          label: "Large transactions",
          count: 3,
          tone: "info",
          href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&review=large&sortBy=amount&sortOrder=desc",
        },
        {
          label: "Possible rule matches",
          count: 0,
          tone: "info",
          href: "/recipients",
        },
      ],
      helper: "6 transactions need review",
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
      "/transactions?range=custom&startDate=2026-06-01&endDate=2026-06-30"
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
            { category: "Food", totalSpend: 700, transactionCount: 2, topSubcategory: null },
          ],
        },
        categories: [
          { category: "Travel", totalSpend: 900, transactionCount: 2, topSubcategory: null },
          { category: "Food", totalSpend: 600, transactionCount: 2, topSubcategory: null },
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
        value: "1 transaction still needs a category",
        helper: "Review transactions in this range that still need a category.",
        href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&status=uncategorized",
        tone: "attention",
      },
      {
        label: "Category leader",
        value: "Travel",
        helper: "60% of categorized spending \u00b7 \u20b9900",
        href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&category=Travel",
        tone: "neutral",
      },
      {
        label: "Import health",
        value: "2 issues flagged",
        helper: "Failed or unreadable messages are waiting for review.",
        href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&review=queue",
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

  it("builds a period-over-period summary for sustained increases", () => {
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
          spendingByCategory: [{ category: "Food", totalSpend: 700, transactionCount: 2, topSubcategory: null }],
        },
        periods: [
          { period: "2026-06-01", totalSpend: 400, transactionCount: 1 },
          { period: "2026-06-02", totalSpend: 450, transactionCount: 1 },
          { period: "2026-06-03", totalSpend: 650, transactionCount: 2 },
        ],
      })
    ).toEqual({
      title: "Vs previous period",
      value: "+50% vs previous period",
      helper: "Up by \u20b9500 compared with 2026-05-01 to 2026-05-31.",
    });
  });

  it("tempers the summary when one peak drives the increase", () => {
    expect(
      buildWhatChangedSummary({
        summary: {
          totalSpend: 1470,
          transactionCount: 10,
          categorizedCount: 9,
          uncategorizedCount: 1,
          averageSpend: 147,
        },
        comparison: {
          rangeLabel: "2026-05-01 to 2026-05-31",
          summary: {
            totalSpend: 1000,
            transactionCount: 8,
            categorizedCount: 8,
            uncategorizedCount: 0,
            averageSpend: 125,
          },
          spendingByCategory: [{ category: "Food", totalSpend: 500, transactionCount: 3, topSubcategory: null }],
        },
        periods: [
          { period: "2026-06-01", totalSpend: 80, transactionCount: 1 },
          { period: "2026-06-02", totalSpend: 120, transactionCount: 1 },
          { period: "2026-06-03", totalSpend: 950, transactionCount: 4 },
          { period: "2026-06-04", totalSpend: 160, transactionCount: 2 },
          { period: "2026-06-05", totalSpend: 160, transactionCount: 2 },
        ],
      })
    ).toEqual({
      title: "Vs previous period",
      value: "Up, driven by one spike",
      helper:
        "+47% vs previous period overall. Most of the lift came from 03 Jun 2026; latest closed at \u20b9160 vs \u20b9294 average.",
    });
  });

  it("handles flat periods without awkward delta copy", () => {
    expect(
      buildWhatChangedSummary({
        summary: {
          totalSpend: 1000,
          transactionCount: 4,
          categorizedCount: 4,
          uncategorizedCount: 0,
          averageSpend: 250,
        },
        comparison: {
          rangeLabel: "2026-05-01 to 2026-05-31",
          summary: {
            totalSpend: 1000,
            transactionCount: 4,
            categorizedCount: 4,
            uncategorizedCount: 0,
            averageSpend: 250,
          },
          spendingByCategory: [{ category: "Food", totalSpend: 600, transactionCount: 2, topSubcategory: null }],
        },
        periods: [
          { period: "2026-06-01", totalSpend: 200, transactionCount: 1 },
          { period: "2026-06-02", totalSpend: 300, transactionCount: 1 },
          { period: "2026-06-03", totalSpend: 500, transactionCount: 2 },
        ],
      })
    ).toEqual({
      title: "Vs previous period",
      value: "Flat vs previous period",
      helper: "Spend matched 2026-05-01 to 2026-05-31.",
    });
  });

  it("keeps the no-previous-period fallback", () => {
    expect(
      buildWhatChangedSummary({
        summary: {
          totalSpend: 400,
          transactionCount: 2,
          categorizedCount: 2,
          uncategorizedCount: 0,
          averageSpend: 200,
        },
        comparison: null,
        periods: [
          { period: "2026-06-01", totalSpend: 150, transactionCount: 1 },
          { period: "2026-06-02", totalSpend: 250, transactionCount: 1 },
        ],
      })
    ).toEqual({
      title: "Vs previous period",
      value: "No previous period yet",
      helper: "Add more history to compare this range with the previous one.",
    });
  });

  it("keeps the new-activity fallback when the previous period had no spend", () => {
    expect(
      buildWhatChangedSummary({
        summary: {
          totalSpend: 500,
          transactionCount: 2,
          categorizedCount: 2,
          uncategorizedCount: 0,
          averageSpend: 250,
        },
        comparison: {
          rangeLabel: "2026-05-01 to 2026-05-31",
          summary: {
            totalSpend: 0,
            transactionCount: 0,
            categorizedCount: 0,
            uncategorizedCount: 0,
            averageSpend: 0,
          },
          spendingByCategory: [],
        },
        periods: [
          { period: "2026-06-01", totalSpend: 200, transactionCount: 1 },
          { period: "2026-06-02", totalSpend: 300, transactionCount: 1 },
        ],
      })
    ).toEqual({
      title: "Vs previous period",
      value: "New activity",
      helper: "New spending activity compared with 2026-05-01 to 2026-05-31.",
    });
  });

  it("builds the biggest-change rail card", () => {
    expect(
      buildBiggestChangeCard({
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
          spendingByCategory: [{ category: "Food", totalSpend: 700, transactionCount: 2, topSubcategory: null }],
        },
        categories: [{ category: "Travel", totalSpend: 900, transactionCount: 2, topSubcategory: null }],
        range,
      })
    ).toEqual({
      label: "Category shift",
      value: "Travel is now your top known category",
      helper: "Compared with 01 May - 31 May",
      href: "/transactions?startDate=2026-06-01&endDate=2026-06-21&category=Travel",
      tone: "neutral",
    });
  });

  it("builds lightweight suggested rules from frequent recipients", () => {
    expect(
      buildSuggestedRules({
        recipients: [
          { recipient: "B ten cafe sec 56", paymentCount: 5, totalAmount: 2450 },
          { recipient: "Hamanthi Devi", paymentCount: 4, totalAmount: 1600 },
        ],
      })
    ).toEqual([
      {
        recipient: "B ten cafe sec 56",
        action: "Create rule",
        href: "/recipients",
        paymentCount: 5,
        totalAmount: 2450,
      },
      {
        recipient: "Hamanthi Devi",
        action: "Create rule",
        href: "/recipients",
        paymentCount: 4,
        totalAmount: 1600,
      },
    ]);
  });

  it("builds chart tooltip payloads and buckets", () => {
    expect(
      buildChartTooltip({
        period: { period: "2026-06-02", totalSpend: 1100, transactionCount: 3 },
      })
    ).toEqual({
      title: "02 Jun 2026",
      amountLabel: "\u20b91,100",
      transactionLabel: "3 transactions",
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
      href: "/transactions?range=custom&startDate=2026-06-01&endDate=2026-06-01",
      showLabel: true,
      tooltip: {
        title: "01 Jun 2026",
        amountLabel: "\u20b9400",
        transactionLabel: "1 transactions",
      },
    });
  });

  it("keeps chart bucket heights truly proportional for small values", () => {
    const buckets = buildChartBuckets({
      periods: [
        { period: "2026-06-01", totalSpend: 0, transactionCount: 0 },
        { period: "2026-06-02", totalSpend: 76, transactionCount: 1 },
        { period: "2026-06-03", totalSpend: 2391, transactionCount: 7 },
      ],
      peakPeriod: { period: "2026-06-03", totalSpend: 2391, transactionCount: 7 },
      latestPeriod: { period: "2026-06-03", totalSpend: 2391, transactionCount: 7 },
      averagePeriodSpend: 822.3333333333334,
      chartMax: 40000,
      periodLabelStep: 1,
      granularity: "day",
    });

    expect(buckets[0]?.height).toBe(0);
    expect(buckets[1]?.height).toBeCloseTo(0.19, 2);
    expect(buckets[2]?.height).toBeCloseTo(5.98, 2);
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
          spendingByCategory: [{ category: "Food", totalSpend: 700, transactionCount: 2, topSubcategory: null }],
        },
        categories: [{ category: "Travel", totalSpend: 900, transactionCount: 2, topSubcategory: null }],
      })
    ).toEqual({
      totalSpend: "+50% vs previous period",
      averageSpend: "+25% vs previous period",
      biggestCategory: "Food to Travel",
    });
  });
});
