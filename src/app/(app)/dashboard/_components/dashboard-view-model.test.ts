import {
  buildChartTicks,
  formatPeriodLabel,
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

  it("builds evenly spaced chart ticks", () => {
    expect(buildChartTicks(800)).toEqual([
      { ratio: 0.25, value: 200 },
      { ratio: 0.5, value: 400 },
      { ratio: 0.75, value: 600 },
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
});
