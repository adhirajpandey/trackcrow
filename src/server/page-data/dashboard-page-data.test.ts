jest.mock("@/server/auth/session", () => ({
  requirePageSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/dashboard/service", () => ({
  getDashboardActivity: jest.fn(),
  getDashboardSummary: jest.fn(),
  getRecentLargeTransactions: jest.fn(),
}));

jest.mock("@/server/modules/categories/service", () => ({
  listCategoriesForUser: jest.fn(),
}));

import { requirePageSessionUser } from "@/server/auth/session";
import { listCategoriesForUser } from "@/server/modules/categories/service";
import {
  getDashboardActivity,
  getDashboardSummary,
  getRecentLargeTransactions,
} from "@/server/modules/dashboard/service";

import { getDashboardPageData, getIstToday } from "./dashboard-page-data";

const mockRequirePageSessionUser = jest.mocked(requirePageSessionUser);
const mockGetDashboardSummary = jest.mocked(getDashboardSummary);
const mockGetDashboardActivity = jest.mocked(getDashboardActivity);
const mockGetRecentLargeTransactions = jest.mocked(getRecentLargeTransactions);
const mockListCategoriesForUser = jest.mocked(listCategoriesForUser);

const summary = {
  totalSpend: 300,
  transactionCount: 2,
  categorizedCount: 1,
  uncategorizedCount: 1,
  averageSpend: 150,
};
const previousSummary = { ...summary, totalSpend: 120, transactionCount: 1, uncategorizedCount: 0, categorizedCount: 1 };
const activity = {
  days: [{ day: "2026-06-20", totalSpend: 300, transactionCount: 2, uncategorizedCount: 1 }],
  recipients: [
    {
      recipientUuid: "rcp-grocer",
      recipient: "Grocer",
      transactionCount: 2,
      totalAmount: 300,
      uncategorizedCount: 1,
      uncategorizedAmount: 100,
      categories: ["Food"],
      days: [["2026-06-20", 300]] as Array<[string, number]>,
    },
  ],
};
const largest = [
  {
    uuid: "txn-1",
    recipient: "Grocer",
    category: "Food",
    subcategory: "Groceries",
    amount: 200,
    timestamp: "2026-06-20T05:00:00.000Z",
    source: "SMS",
  },
];

describe("getDashboardPageData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequirePageSessionUser.mockResolvedValue({
      userUuid: "user-1",
      name: "Asha",
      email: "asha@example.com",
      image: null,
    });
    mockGetDashboardSummary.mockResolvedValueOnce({ ok: true, data: summary }).mockResolvedValue({ ok: true, data: previousSummary });
    mockGetDashboardActivity.mockResolvedValue({ ok: true, data: activity });
    mockGetRecentLargeTransactions.mockResolvedValue({ ok: true, data: largest });
    mockListCategoriesForUser.mockResolvedValue({
      ok: true,
      data: [{ uuid: "cat-9", name: "Food", subcategories: [{ uuid: "sub-10", name: "Lunch" }] }],
    });
  });

  it("maps the range, summary, comparison, activity and categories to a page DTO", async () => {
    const data = await getDashboardPageData(
      { range: "custom", startDate: "2026-06-01", endDate: "2026-06-21" },
      { now: new Date("2026-06-21T10:00:00.000Z") }
    );

    expect(data).toMatchObject({
      status: "ready",
      message: null,
      today: "2026-06-21",
      range: { value: "custom", startDate: "2026-06-01", endDate: "2026-06-21", granularity: "day" },
      user: { name: "Asha", email: "asha@example.com", image: null },
      summary,
      comparison: { kind: "previous-equal-length", summary: previousSummary },
      days: activity.days,
      recipients: activity.recipients,
      largestTransactions: largest,
      categoryOptions: [{ uuid: "cat-9", name: "Food", subcategories: [{ uuid: "sub-10", name: "Lunch", categoryUuid: "cat-9" }] }],
    });
    expect(mockGetRecentLargeTransactions).toHaveBeenCalledWith(expect.objectContaining({ userUuid: "user-1", take: 6 }));
  });

  it("defaults first-time users to this month", async () => {
    await expect(
      getDashboardPageData({}, { now: new Date("2026-06-21T10:00:00.000Z") })
    ).resolves.toMatchObject({
      range: { value: "this-month", label: "This month", startDate: "2026-06-01", endDate: "2026-06-21" },
    });
  });

  it("uses the persisted range only when the URL does not provide one", async () => {
    const now = new Date("2026-06-21T10:00:00.000Z");
    await expect(getDashboardPageData({}, { persistedRange: "last-3-months", now })).resolves.toMatchObject({
      range: { value: "last-3-months" },
    });
    await expect(getDashboardPageData({ range: "last-month" }, { persistedRange: "last-3-months", now })).resolves.toMatchObject({
      range: { value: "last-month" },
    });
  });

  it("has no comparison for all time", async () => {
    await expect(getDashboardPageData({ range: "all-time" })).resolves.toMatchObject({
      range: { value: "all-time" },
      comparison: null,
    });
  });

  it("returns a safe error DTO when a dashboard service fails", async () => {
    mockGetDashboardActivity.mockResolvedValueOnce({ ok: false, error: "INTERNAL_ERROR" });

    await expect(
      getDashboardPageData({ range: "last-month" }, { now: new Date("2026-06-21T10:00:00.000Z") })
    ).resolves.toMatchObject({
      status: "error",
      message: "Couldn’t load the dashboard.",
      today: "2026-06-21",
      days: [],
      recipients: [],
      comparison: null,
    });
  });

  it("reports today in IST, not UTC", () => {
    expect(getIstToday(new Date("2026-10-30T19:01:00.000Z"))).toBe("2026-10-31");
    expect(getIstToday(new Date("2026-10-30T18:29:00.000Z"))).toBe("2026-10-30");
  });
});
