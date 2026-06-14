jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__dashboardPrismaMock = {
    transaction: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
  }),
}));

import {
  getDashboardSummary,
  getSpendingByCategory,
  getSpendingByPeriod,
} from "./service";

const mockPrisma = (globalThis as any).__dashboardPrismaMock;

describe("dashboard service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("computes summary metrics with date range filters", async () => {
    const startDate = new Date("2026-06-01T00:00:00.000Z");
    const endDate = new Date("2026-06-30T23:59:59.000Z");
    mockPrisma.transaction.aggregate.mockResolvedValueOnce({
      _sum: { amount: 600 },
      _avg: { amount: 200 },
    });
    mockPrisma.transaction.count.mockResolvedValueOnce(3).mockResolvedValueOnce(2);

    const result = await getDashboardSummary({
      userUuid: "user-1",
      startDate,
      endDate,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        totalSpend: 600,
        transactionCount: 3,
        categorizedCount: 2,
        uncategorizedCount: 1,
        averageSpend: 200,
      },
    });
    expect(mockPrisma.transaction.aggregate).toHaveBeenCalledWith({
      where: {
        userUuid: "user-1",
        timestamp: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
      _avg: { amount: true },
    });
  });

  it("groups spending by category including Uncategorized", async () => {
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { amount: 100, category: { name: "Food" } },
      { amount: 50, category: null },
      { amount: 75, category: { name: "Food" } },
    ]);

    await expect(
      getSpendingByCategory({ userUuid: "user-1" })
    ).resolves.toEqual({
      ok: true,
      data: [
        { category: "Food", totalSpend: 175, transactionCount: 2 },
        { category: "Uncategorized", totalSpend: 50, transactionCount: 1 },
      ],
    });
  });

  it("groups spending by month and day using ISO periods", async () => {
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { amount: 100, timestamp: new Date("2026-06-01T10:00:00.000Z") },
      { amount: 75, timestamp: new Date("2026-06-20T10:00:00.000Z") },
    ]);
    await expect(
      getSpendingByPeriod({ userUuid: "user-1" })
    ).resolves.toEqual({
      ok: true,
      data: [{ period: "2026-06", totalSpend: 175, transactionCount: 2 }],
    });

    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { amount: 100, timestamp: new Date("2026-06-01T10:00:00.000Z") },
      { amount: 75, timestamp: new Date("2026-06-01T12:00:00.000Z") },
    ]);
    await expect(
      getSpendingByPeriod({ userUuid: "user-1", granularity: "day" })
    ).resolves.toEqual({
      ok: true,
      data: [{ period: "2026-06-01", totalSpend: 175, transactionCount: 2 }],
    });
  });
});
