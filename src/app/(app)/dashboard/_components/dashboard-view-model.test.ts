import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";

import {
  buildChartTicks,
  buildImportsReviewHref,
  buildPeriodTransactionsHref,
  buildReviewQueueCard,
  buildTransactionsHref,
  formatCompactCurrency,
  formatCurrency,
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
});
