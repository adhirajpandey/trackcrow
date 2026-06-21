import {
  getDashboardRangeState,
  getPreviousDashboardRangeState,
} from "./query-state";

describe("dashboard query state", () => {
  const now = new Date("2026-06-21T10:00:00.000Z");

  it("builds last 30 days with IST-aware service bounds", () => {
    const range = getDashboardRangeState({
      searchParams: { range: "last-30-days" },
      now,
    });

    expect(range).toMatchObject({
      range: "last-30-days",
      label: "Last 30 days",
      startDate: "2026-05-23",
      endDate: "2026-06-21",
      granularity: "day",
    });
    expect(range.serviceStartDate).toEqual(new Date("2026-05-22T18:30:00.000Z"));
    expect(range.serviceEndDate).toEqual(new Date("2026-06-21T18:29:59.999Z"));
  });

  it("builds last 90 days as weekly buckets", () => {
    expect(
      getDashboardRangeState({
        searchParams: { range: "last-90-days" },
        now,
      })
    ).toMatchObject({
      range: "last-90-days",
      label: "Last 90 days",
      startDate: "2026-03-24",
      endDate: "2026-06-21",
      granularity: "week",
    });
  });

  it("keeps legacy ranges valid for persisted preferences and URLs", () => {
    expect(
      getDashboardRangeState({
        searchParams: {},
        persistedRange: "last-3-months",
        now,
      })
    ).toMatchObject({
      range: "last-3-months",
      startDate: "2026-04-01",
      endDate: "2026-06-21",
      granularity: "week",
    });

    expect(
      getDashboardRangeState({
        searchParams: { range: "last-month" },
        persistedRange: "last-30-days",
        now,
      })
    ).toMatchObject({
      range: "last-month",
      startDate: "2026-05-01",
      endDate: "2026-05-31",
      granularity: "day",
    });
  });

  it("derives the immediately previous comparison window", () => {
    const range = getDashboardRangeState({
      searchParams: {
        range: "custom",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
      },
      now,
    });

    expect(getPreviousDashboardRangeState(range)).toEqual({
      label: "2026-05-02 to 2026-05-31",
      startDate: "2026-05-02",
      endDate: "2026-05-31",
      serviceStartDate: new Date("2026-05-01T18:30:00.000Z"),
      serviceEndDate: new Date("2026-05-31T18:29:59.999Z"),
    });
  });
});
