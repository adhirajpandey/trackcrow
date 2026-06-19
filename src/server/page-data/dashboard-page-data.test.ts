jest.mock("@/server/auth/session", () => ({
  requirePageSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/dashboard/service", () => ({
  getDashboardSummary: jest.fn(),
  getSpendingByCategory: jest.fn(),
  getSpendingByPeriod: jest.fn(),
}));

import { requirePageSessionUser } from "@/server/auth/session";
import {
  getDashboardSummary,
  getSpendingByCategory,
  getSpendingByPeriod,
} from "@/server/modules/dashboard/service";

import { getDashboardPageData } from "./dashboard-page-data";

const mockRequirePageSessionUser = jest.mocked(requirePageSessionUser);
const mockGetDashboardSummary = jest.mocked(getDashboardSummary);
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
  });

  it("maps dashboard service results to a page DTO", async () => {
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
    mockGetSpendingByCategory.mockResolvedValue({
      ok: true,
      data: [{ category: "Food", totalSpend: 300, transactionCount: 2 }],
    });
    mockGetSpendingByPeriod.mockResolvedValue({
      ok: true,
      data: [{ period: "2026-06", totalSpend: 300, transactionCount: 2 }],
    });

    await expect(
      getDashboardPageData({
        startDate: "2026-06-01",
        endDate: "2026-06-30",
      })
    ).resolves.toEqual({
      status: "ready",
      message: null,
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
      spendingByCategory: [{ category: "Food", totalSpend: 300, transactionCount: 2 }],
      spendingByPeriod: [{ period: "2026-06", totalSpend: 300, transactionCount: 2 }],
    });
    expect(mockGetDashboardSummary).toHaveBeenCalledWith({
      userUuid: "user-1",
      startDate: new Date("2026-06-01"),
      endDate: new Date("2026-06-30"),
    });
  });

  it("returns a safe error DTO when a dashboard service fails", async () => {
    mockGetDashboardSummary.mockResolvedValue({
      ok: false,
      error: "INTERNAL_ERROR",
    });
    mockGetSpendingByCategory.mockResolvedValue({ ok: true, data: [] });
    mockGetSpendingByPeriod.mockResolvedValue({ ok: true, data: [] });

    await expect(getDashboardPageData({})).resolves.toEqual({
      status: "error",
      message: "Dashboard data is temporarily unavailable. Try again in a moment.",
      rangeLabel: "All time",
      user: {
        name: "Asha",
        email: "asha@example.com",
        image: null,
      },
      summary: {
        totalSpend: 0,
        transactionCount: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        averageSpend: 0,
      },
      spendingByCategory: [],
      spendingByPeriod: [],
    });
  });
});
