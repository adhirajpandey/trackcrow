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
  getFrequentRecipients,
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
      { amount: 100, category: { name: "Food" }, subcategory: { name: "Lunch" } },
      { amount: 50, category: null, subcategory: null },
      { amount: 75, category: { name: "Food" }, subcategory: { name: "Dinner" } },
      { amount: 80, category: { name: "Food" }, subcategory: { name: "Lunch" } },
    ]);

    await expect(
      getSpendingByCategory({ userUuid: "user-1" })
    ).resolves.toEqual({
      ok: true,
      data: [
        {
          category: "Food",
          totalSpend: 255,
          transactionCount: 3,
          topSubcategory: {
            name: "Lunch",
            totalSpend: 180,
            transactionCount: 2,
          },
        },
        {
          category: "Uncategorized",
          totalSpend: 50,
          transactionCount: 1,
          topSubcategory: null,
        },
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

  it("groups spending by IST calendar boundaries for drilldown links", async () => {
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { amount: 100, timestamp: new Date("2026-06-29T20:00:00.000Z") },
      { amount: 50, timestamp: new Date("2026-06-29T22:30:00.000Z") },
    ]);

    await expect(
      getSpendingByPeriod({ userUuid: "user-1", granularity: "day" })
    ).resolves.toEqual({
      ok: true,
      data: [{ period: "2026-06-30", totalSpend: 150, transactionCount: 2 }],
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
        id: 2,
        uuid: "txn-2",
        amount: 900,
        timestamp: new Date("2026-06-20T10:00:00.000Z"),
        source: "SMS",
        recipientName: null,
        recipientRaw: "vivek.pandey5@oksbi",
        recipient: { displayName: "vivek.pandey5@oksbi" },
        category: { name: "Food" },
      },
      {
        id: 1,
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
          id: 2,
          uuid: "txn-2",
          recipient: "Vivek Pandey",
          category: "Food",
          subcategory: null,
          amount: 900,
          timestamp: "2026-06-20T10:00:00.000Z",
          source: "SMS",
        },
        {
          id: 1,
          uuid: "txn-1",
          recipient: "Power Bill",
          category: null,
          subcategory: null,
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
        id: true,
        uuid: true,
        amount: true,
        timestamp: true,
        source: true,
        recipientName: true,
        recipientRaw: true,
        recipient: { select: { displayName: true } },
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
      },
    });
  });

  it("groups frequent recipients by payment count and total amount", async () => {
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      {
        amount: 900,
        recipientName: null,
        recipientRaw: "vivek.pandey5@oksbi",
        recipient: { id: 30, displayName: "vivek.pandey5@oksbi" },
      },
      {
        amount: 250,
        recipientName: "Power bill",
        recipientRaw: "POWER BILL",
        recipient: { id: 18, displayName: "Utility" },
      },
      {
        amount: 600,
        recipientName: null,
        recipientRaw: "vivek.pandey5@oksbi",
        recipient: { id: 30, displayName: "vivek.pandey5@oksbi" },
      },
    ]);

    await expect(
      getFrequentRecipients({
        userUuid: "user-1",
        take: 5,
      })
    ).resolves.toEqual({
      ok: true,
      data: [
        {
          recipientId: 30,
          recipient: "Vivek Pandey",
          paymentCount: 2,
          totalAmount: 1500,
        },
        {
          recipientId: 18,
          recipient: "Power Bill",
          paymentCount: 1,
          totalAmount: 250,
        },
      ],
    });
  });
});
