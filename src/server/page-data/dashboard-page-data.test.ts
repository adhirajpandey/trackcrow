jest.mock("@/server/auth/session", () => ({
  requirePageSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/dashboard/service", () => ({
  getDashboardActivity: jest.fn(),
  getDashboardSummary: jest.fn(),
  getRecentLargeTransactions: jest.fn(),
  getRecentTransactions: jest.fn(),
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
  getRecentTransactions,
} from "@/server/modules/dashboard/service";

import { getDashboardPageData, getIstToday } from "./dashboard-page-data";
import { getInsightsPageData, parseInsightsTab } from "./insights-page-data";

const mockRequirePageSessionUser = jest.mocked(requirePageSessionUser);
const mockGetDashboardSummary = jest.mocked(getDashboardSummary);
const mockGetDashboardActivity = jest.mocked(getDashboardActivity);
const mockGetRecentLargeTransactions = jest.mocked(getRecentLargeTransactions);
const mockGetRecentTransactions = jest.mocked(getRecentTransactions);
const mockListCategoriesForUser = jest.mocked(listCategoriesForUser);

const summary = { totalSpend: 300, transactionCount: 2, categorizedCount: 1, uncategorizedCount: 1, averageSpend: 150 };
const previousSummary = { ...summary, totalSpend: 120, transactionCount: 1, uncategorizedCount: 0 };
const recipient = (name: string, totalAmount: number, uncategorizedAmount = 0) => ({
  recipientUuid: `rcp-${name}`,
  recipient: name,
  transactionCount: 1,
  totalAmount,
  uncategorizedCount: uncategorizedAmount ? 1 : 0,
  uncategorizedAmount,
  categories: [] as string[],
  days: [["2026-06-20", totalAmount]] as Array<[string, number]>,
});
const activity = {
  days: [{ day: "2026-06-20", totalSpend: 300, transactionCount: 2, uncategorizedCount: 1 }],
  recipients: ["A", "B", "C", "D", "E", "F"].map((name, index) => recipient(name, 60 - index * 5, index === 0 ? 60 : 0)),
  patterns: [{ weekday: 5, hour: 10, totalSpend: 300, transactionCount: 2, topRecipients: [{ recipient: "A", totalSpend: 300, transactionCount: 2 }] }],
};
const transaction = { uuid: "txn-1", recipient: "Grocer", category: null, subcategory: null, amount: 200, timestamp: "2026-06-20T05:00:00.000Z", source: "SMS" };

describe("spending page data", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequirePageSessionUser.mockResolvedValue({ userUuid: "user-1", name: "Asha", email: "asha@example.com", image: null });
    mockGetDashboardSummary.mockImplementation(async (input) => ({ ok: true, data: input.startDate?.toISOString().startsWith("2026-05") ? previousSummary : summary }));
    mockGetDashboardActivity.mockResolvedValue({ ok: true, data: activity });
    mockGetRecentLargeTransactions.mockResolvedValue({ ok: true, data: [transaction] });
    mockGetRecentTransactions.mockResolvedValue({ ok: true, data: [transaction] });
    mockListCategoriesForUser.mockResolvedValue({ ok: true, data: [{ uuid: "cat-9", name: "Food", subcategories: [{ uuid: "sub-10", name: "Lunch" }] }] });
  });

  it("gives the dashboard a slim read: top five recipients, largest uncategorized and latest transactions", async () => {
    const data = await getDashboardPageData({ range: "last-month" }, { now: new Date("2026-06-21T10:00:00.000Z") });

    expect(data).toMatchObject({
      status: "ready",
      today: "2026-06-21",
      range: { value: "last-month", startDate: "2026-05-01", endDate: "2026-05-31" },
      summary,
      uncategorizedAmount: 60,
      recipientCount: 6,
      needsCategory: [transaction],
      latestTransactions: [transaction],
    });
    expect(data.topRecipients.map((entry) => entry.recipient)).toEqual(["A", "B", "C", "D", "E"]);
    expect(mockGetRecentLargeTransactions).toHaveBeenCalledWith(expect.objectContaining({ take: 3, uncategorizedOnly: true }));
    expect(mockGetRecentTransactions).toHaveBeenCalledWith(expect.objectContaining({ take: 5 }));
  });

  it("defaults first-time users to this month and honours a persisted range only without a URL range", async () => {
    const now = new Date("2026-06-21T10:00:00.000Z");
    await expect(getDashboardPageData({}, { now })).resolves.toMatchObject({ range: { value: "this-month", startDate: "2026-06-01", endDate: "2026-06-21" } });
    await expect(getDashboardPageData({}, { persistedRange: "last-3-months", now })).resolves.toMatchObject({ range: { value: "last-3-months" } });
    await expect(getDashboardPageData({ range: "last-month" }, { persistedRange: "last-3-months", now })).resolves.toMatchObject({ range: { value: "last-month" } });
  });

  it("has no comparison for all time", async () => {
    await expect(getDashboardPageData({ range: "all-time" })).resolves.toMatchObject({ comparison: null });
  });

  it("returns a safe error when a read fails", async () => {
    mockGetDashboardActivity.mockResolvedValueOnce({ ok: false, error: "INTERNAL_ERROR" });
    await expect(getDashboardPageData({ range: "last-month" }, { now: new Date("2026-06-21T10:00:00.000Z") })).resolves.toMatchObject({
      status: "error",
      message: "Couldn’t load your spending.",
      topRecipients: [],
      needsCategory: [],
    });
  });

  it("gives Insights every recipient, the patterns, the tab and a valid focus day", async () => {
    const data = await getInsightsPageData({ range: "last-month", tab: "patterns", day: "2026-05-04" }, { now: new Date("2026-06-21T10:00:00.000Z") });

    expect(data).toMatchObject({ status: "ready", tab: "patterns", focusDay: "2026-05-04", patterns: activity.patterns, largestTransactions: [transaction] });
    expect(data.recipients).toHaveLength(6);
    await expect(getInsightsPageData({ tab: "nope", day: "yesterday" })).resolves.toMatchObject({ tab: "calendar", focusDay: null });
  });

  it("parses tabs and reports today in IST", () => {
    expect(parseInsightsTab(["recipients"])).toBe("recipients");
    expect(parseInsightsTab(undefined)).toBe("calendar");
    expect(getIstToday(new Date("2026-10-30T19:01:00.000Z"))).toBe("2026-10-31");
  });
});
