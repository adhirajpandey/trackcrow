import {
  buildChartTicks,
  buildReviewItems,
  buildTransactionsHref,
  formatCompactCurrency,
  formatPeriodLabel,
  getAveragePeriodSpend,
  getCategoryShare,
  getPeakPeriod,
  getPeriodLabelStep,
  getTopCategoryInsight,
} from "./dashboard-view-model";

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

  it("builds readable chart ticks from a nice ceiling", () => {
    expect(buildChartTicks(800)).toEqual([
      { ratio: 0.33, value: 330 },
      { ratio: 0.66, value: 660 },
      { ratio: 1, value: 1000 },
    ]);
  });

  it("formats month and year labels", () => {
    expect(formatPeriodLabel("2025-07")).toEqual({ month: "Jul", year: "2025" });
  });

  it("derives top-category insight and share", () => {
    expect(
      getTopCategoryInsight(
        [
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
    expect(getCategoryShare(125, 500)).toBe(25);
  });

  it("formats compact INR values without losing lakh scale", () => {
    expect(formatCompactCurrency(1881774)).toBe("₹18.82L");
    expect(formatCompactCurrency(75900)).toBe("₹75.9K");
    expect(formatCompactCurrency(599)).toBe("₹599");
  });

  it("builds dashboard drilldown links", () => {
    expect(buildTransactionsHref({ category: "Food", status: null })).toBe(
      "/transactions?category=Food"
    );
    expect(buildTransactionsHref({})).toBe("/transactions");
  });

  it("derives review queue items", () => {
    expect(
      buildReviewItems({
        summary: {
          totalSpend: 1000,
          transactionCount: 10,
          categorizedCount: 7,
          uncategorizedCount: 3,
          averageSpend: 100,
        },
        importHealth: { parsedCount: 5, failedCount: 1, unparseableCount: 2 },
      })[0]
    ).toMatchObject({
      key: "uncategorized",
      value: 3,
      helper: "30% of transactions need a category",
      tone: "attention",
    });
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