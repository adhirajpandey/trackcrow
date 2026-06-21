jest.mock("@/server/auth/session", () => ({
  requirePageSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/dashboard/service", () => ({
  getDashboardSummary: jest.fn(),
  getImportHealth: jest.fn(),
  getLargeTransactionCount: jest.fn(),
  getRecentTransactions: jest.fn(),
  getRecentLargeTransactions: jest.fn(),
  getSpendingByCategory: jest.fn(),
  getSpendingByPeriod: jest.fn(),
}));

import { requirePageSessionUser } from "@/server/auth/session";
import {
  getDashboardSummary,
  getImportHealth,
  getLargeTransactionCount,
  getRecentTransactions,
  getRecentLargeTransactions,
  getSpendingByCategory,
  getSpendingByPeriod,
} from "@/server/modules/dashboard/service";

import { getDashboardPageData } from "./dashboard-page-data";

const mockRequirePageSessionUser = jest.mocked(requirePageSessionUser);
const mockGetDashboardSummary = jest.mocked(getDashboardSummary);
const mockGetImportHealth = jest.mocked(getImportHealth);
const mockGetLargeTransactionCount = jest.mocked(getLargeTransactionCount);
const mockGetRecentTransactions = jest.mocked(getRecentTransactions);
const mockGetRecentLargeTransactions = jest.mocked(getRecentLargeTransactions);
const mockGetSpendingByCategory = jest.mocked(getSpendingByCategory);
const mockGetSpendingByPeriod = jest.mocked(getSpendingByPeriod);

describe("getDashboardPageData", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRequirePageSessionUser.mockResolvedValue({
      userUuid: "user-1",
      name: "Asha",
      email: "asha@example.com",
      image: null,
    });
    mockGetDashboardSummary.mockResolvedValue({
      ok: true,
      data: {
        totalSpend: 300,
        transactionCount: 2,
        categorizedCount: 1,
        uncategorizedCount: 1,
        averageSpend: 150,
      },
    });
    mockGetImportHealth.mockResolvedValue({
      ok: true,
      data: { parsedCount: 8, failedCount: 1, unparseableCount: 2 },
    });
    mockGetLargeTransactionCount.mockResolvedValue({
      ok: true,
      data: 1,
    });
    mockGetRecentLargeTransactions.mockResolvedValue({
      ok: true,
      data: [
        {
          uuid: "txn-1",
          recipient: "Rent",
          category: "Essentials",
          amount: 20000,
          timestamp: "2026-06-15T00:00:00.000Z",
          source: "SMS",
        },
      ],
    });
    mockGetRecentTransactions.mockResolvedValue({
      ok: true,
      data: [
        {
          uuid: "txn-2",
          recipient: "Grocer",
          category: "Food",
          amount: 500,
          timestamp: "2026-06-20T00:00:00.000Z",
          source: "SMS",
        },
      ],
    });
    mockGetSpendingByCategory.mockResolvedValue({
      ok: true,
      data: [{ category: "Food", totalSpend: 300, transactionCount: 2 }],
    });
    mockGetSpendingByPeriod.mockResolvedValue({
      ok: true,
      data: [{ period: "2026-06-01", totalSpend: 300, transactionCount: 2 }],
    });
  });

  it("maps dashboard service results to a page DTO for a custom range", async () => {
    await expect(
      getDashboardPageData(
        {
          range: "custom",
          startDate: "2026-06-01",
          endDate: "2026-06-30",
        },
        { now: new Date("2026-06-21T10:00:00.000Z") }
      )
    ).resolves.toMatchObject({
      status: "ready",
      message: null,
      range: {
        value: "custom",
        label: "2026-06-01 to 2026-06-30",
        startDate: "2026-06-01",
        endDate: "2026-06-30",
        granularity: "day",
      },
      rangeLabel: "2026-06-01 to 2026-06-30",
      user: {
        name: "Asha",
        email: "asha@example.com",
        image: null,
      },
      summary: {
        totalSpend: 300,
        transactionCount: 2,
        categorizedCount: 1,
        uncategorizedCount: 1,
        averageSpend: 150,
      },
      importHealth: { parsedCount: 8, failedCount: 1, unparseableCount: 2 },
      largeTransactionCount: 1,
      importIssueCount: 3,
      sectionStatus: {
        transactions: "ready",
        categories: "incomplete",
        imports: "attention",
        comparison: "ready",
      },
      comparison: {
        rangeLabel: "2026-05-02 to 2026-05-31",
        summary: {
          totalSpend: 300,
          transactionCount: 2,
          categorizedCount: 1,
          uncategorizedCount: 1,
          averageSpend: 150,
        },
        spendingByCategory: [{ category: "Food", totalSpend: 300, transactionCount: 2 }],
      },
      spendingByCategory: [{ category: "Food", totalSpend: 300, transactionCount: 2 }],
      recentTransactions: [
        {
          uuid: "txn-2",
          recipient: "Grocer",
          category: "Food",
          amount: 500,
          timestamp: "2026-06-20T00:00:00.000Z",
          source: "SMS",
        },
      ],
    });
    expect(mockGetDashboardSummary).toHaveBeenCalledWith({
      userUuid: "user-1",
      startDate: new Date("2026-05-31T18:30:00.000Z"),
      endDate: new Date("2026-06-30T18:29:59.999Z"),
    });
    expect(mockGetDashboardSummary).toHaveBeenCalledWith({
      userUuid: "user-1",
      startDate: new Date("2026-05-01T18:30:00.000Z"),
      endDate: new Date("2026-05-31T18:29:59.999Z"),
    });
    expect(mockGetSpendingByPeriod).toHaveBeenCalledWith({
      userUuid: "user-1",
      startDate: new Date("2026-05-31T18:30:00.000Z"),
      endDate: new Date("2026-06-30T18:29:59.999Z"),
      granularity: "day",
    });
    expect(mockGetLargeTransactionCount).toHaveBeenCalledWith({
      userUuid: "user-1",
      startDate: new Date("2026-05-31T18:30:00.000Z"),
      endDate: new Date("2026-06-30T18:29:59.999Z"),
      minimumAmount: 10000,
    });
    expect(mockGetRecentTransactions).toHaveBeenCalledWith({
      userUuid: "user-1",
      startDate: new Date("2026-05-31T18:30:00.000Z"),
      endDate: new Date("2026-06-30T18:29:59.999Z"),
      take: 10,
    });
  });

  it("defaults first-time users to this month", async () => {
    await expect(
      getDashboardPageData({}, { now: new Date("2026-06-21T10:00:00.000Z") })
    ).resolves.toMatchObject({
      range: {
        value: "this-month",
        label: "This month",
        startDate: "2026-06-01",
        endDate: "2026-06-21",
        granularity: "day",
      },
    });
  });

  it("uses the persisted range only when the URL does not provide one", async () => {
    await getDashboardPageData(
      {},
      {
        persistedRange: "last-3-months",
        now: new Date("2026-06-21T10:00:00.000Z"),
      }
    );
    expect(mockGetSpendingByPeriod).toHaveBeenLastCalledWith(
      expect.objectContaining({ granularity: "week" })
    );

    await getDashboardPageData(
      { range: "last-month" },
      {
        persistedRange: "last-3-months",
        now: new Date("2026-06-21T10:00:00.000Z"),
      }
    );
    expect(mockGetSpendingByPeriod).toHaveBeenLastCalledWith(
      expect.objectContaining({ granularity: "day" })
    );
  });

  it("switches all-time spending from monthly to yearly when there are too many buckets", async () => {
    mockGetSpendingByPeriod
      .mockResolvedValueOnce({
        ok: true,
        data: Array.from({ length: 37 }, (_, index) => ({
          period: `2024-${String((index % 12) + 1).padStart(2, "0")}`,
          totalSpend: 100,
          transactionCount: 1,
        })),
      })
      .mockResolvedValueOnce({
        ok: true,
        data: [{ period: "2024", totalSpend: 3700, transactionCount: 37 }],
      });

    await expect(getDashboardPageData({ range: "all-time" })).resolves.toMatchObject({
      range: { value: "all-time", granularity: "year" },
      comparison: null,
      spendingByPeriod: [{ period: "2024", totalSpend: 3700, transactionCount: 37 }],
    });
  });

  it("returns a safe error DTO when a dashboard service fails", async () => {
    mockGetDashboardSummary.mockResolvedValue({
      ok: false,
      error: "INTERNAL_ERROR",
    });

    await expect(
      getDashboardPageData({}, { now: new Date("2026-06-21T10:00:00.000Z") })
    ).resolves.toMatchObject({
      status: "error",
      message: "Dashboard data is temporarily unavailable. Try again in a moment.",
      range: {
        value: "this-month",
        label: "This month",
        startDate: "2026-06-01",
        endDate: "2026-06-21",
        granularity: "day",
      },
      summary: {
        totalSpend: 0,
        transactionCount: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        averageSpend: 0,
      },
      importHealth: { parsedCount: 0, failedCount: 0, unparseableCount: 0 },
      largeTransactionCount: 0,
      importIssueCount: 0,
      sectionStatus: {
        transactions: "error",
        categories: "error",
        imports: "error",
        comparison: "unavailable",
      },
      comparison: null,
      spendingByCategory: [],
      spendingByPeriod: [],
      recentLargeTransactions: [],
      recentTransactions: [],
    });
  });

  it("derives empty and unavailable section states when data is sparse", async () => {
    mockGetDashboardSummary.mockResolvedValueOnce({
      ok: true,
      data: {
        totalSpend: 0,
        transactionCount: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        averageSpend: 0,
      },
    });
    mockGetImportHealth.mockResolvedValueOnce({
      ok: true,
      data: { parsedCount: 0, failedCount: 0, unparseableCount: 0 },
    });
    mockGetSpendingByCategory.mockResolvedValueOnce({
      ok: true,
      data: [],
    });
    mockGetSpendingByPeriod.mockResolvedValueOnce({
      ok: true,
      data: [],
    });

    await expect(
      getDashboardPageData({}, { now: new Date("2026-06-21T10:00:00.000Z") })
    ).resolves.toMatchObject({
      importIssueCount: 0,
      sectionStatus: {
        transactions: "empty",
        categories: "empty",
        imports: "empty",
        comparison: "ready",
      },
    });
  });
});
