jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__dashboardPrismaMock = {
    transaction: {
      aggregate: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    rawMessage: {
      count: jest.fn(),
    },
  }),
}));

import {
  getDashboardSummary,
  getLargeTransactionCount,
  getRecentTransactions,
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

  it("groups spending by month, day, week, and year using ISO periods", async () => {
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

    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { amount: 100, timestamp: new Date("2026-06-03T10:00:00.000Z") },
      { amount: 75, timestamp: new Date("2026-06-07T12:00:00.000Z") },
    ]);
    await expect(
      getSpendingByPeriod({ userUuid: "user-1", granularity: "week" })
    ).resolves.toEqual({
      ok: true,
      data: [{ period: "2026-06-01", totalSpend: 175, transactionCount: 2 }],
    });

    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { amount: 100, timestamp: new Date("2025-06-01T10:00:00.000Z") },
      { amount: 75, timestamp: new Date("2026-06-01T12:00:00.000Z") },
    ]);
    await expect(
      getSpendingByPeriod({ userUuid: "user-1", granularity: "year" })
    ).resolves.toEqual({
      ok: true,
      data: [
        { period: "2025", totalSpend: 100, transactionCount: 1 },
        { period: "2026", totalSpend: 75, transactionCount: 1 },
      ],
    });
  });

  it("counts large transactions using the provided threshold", async () => {
    mockPrisma.transaction.count.mockResolvedValueOnce(4);

    await expect(
      getLargeTransactionCount({
        userUuid: "user-1",
        minimumAmount: 10000,
      })
    ).resolves.toEqual({
      ok: true,
      data: 4,
    });

    expect(mockPrisma.transaction.count).toHaveBeenCalledWith({
      where: {
        userUuid: "user-1",
        amount: {
          gte: 10000,
        },
      },
    });
  });

  it("lists recent transactions by newest timestamp with range filters and take", async () => {
    const startDate = new Date("2026-06-01T00:00:00.000Z");
    const endDate = new Date("2026-06-30T23:59:59.000Z");
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      {
        uuid: "txn-2",
        amount: 900,
        timestamp: new Date("2026-06-20T10:00:00.000Z"),
        source: "SMS",
        recipientName: null,
        recipientRaw: "Fresh Mart",
        recipient: { displayName: "Fresh Mart" },
        category: { name: "Food" },
      },
      {
        uuid: "txn-1",
        amount: 2500,
        timestamp: new Date("2026-06-18T10:00:00.000Z"),
        source: "EMAIL",
        recipientName: "Power bill",
        recipientRaw: "POWER BILL",
        recipient: { displayName: "Utility" },
        category: null,
      },
    ]);

    await expect(
      getRecentTransactions({
        userUuid: "user-1",
        startDate,
        endDate,
        take: 10,
      })
    ).resolves.toEqual({
      ok: true,
      data: [
        {
          uuid: "txn-2",
          recipient: "Fresh Mart",
          category: "Food",
          amount: 900,
          timestamp: "2026-06-20T10:00:00.000Z",
          source: "SMS",
        },
        {
          uuid: "txn-1",
          recipient: "Power bill",
          category: null,
          amount: 2500,
          timestamp: "2026-06-18T10:00:00.000Z",
          source: "EMAIL",
        },
      ],
    });

    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith({
      where: {
        userUuid: "user-1",
        timestamp: { gte: startDate, lte: endDate },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
      select: {
        uuid: true,
        amount: true,
        timestamp: true,
        source: true,
        recipientName: true,
        recipientRaw: true,
        recipient: { select: { displayName: true } },
        category: { select: { name: true } },
      },
    });
  });
});
