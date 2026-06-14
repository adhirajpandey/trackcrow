jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__transactionsPrismaMock = {
    category: {
      findFirst: jest.fn(),
    },
    subcategory: {
      findFirst: jest.fn(),
    },
    transaction: {
      count: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  }),
}));

jest.mock("@/server/modules/recipients/service", () => ({
  resolveRecipient: jest.fn(),
}));

import { TransactionSource, TransactionType } from "@/generated/prisma-rewrite";
import { resolveRecipient } from "@/server/modules/recipients/service";

import {
  createTransaction,
  deleteTransaction,
  getTransactionById,
  listTransactions,
  suggestTransactionCategory,
  updateTransaction,
} from "./service";

const mockPrisma = (globalThis as any).__transactionsPrismaMock;
const resolveRecipientMock = resolveRecipient as jest.Mock;

function amount(value: number) {
  return { toNumber: () => value };
}

function transactionRecord(overrides: Record<string, unknown> = {}) {
  const now = new Date("2026-06-14T10:00:00.000Z");
  return {
    id: 1,
    uuid: "txn-1",
    userUuid: "user-1",
    amount: amount(100),
    currency: "INR",
    type: TransactionType.UPI,
    source: TransactionSource.MANUAL,
    recipientRaw: "merchant@upi",
    recipientName: "Merchant",
    reference: null,
    accountLabel: null,
    remarks: null,
    locationRaw: null,
    timestamp: now,
    createdAt: now,
    updatedAt: now,
    categoryId: 10,
    subcategoryId: 20,
    recipient: { displayName: "Merchant" },
    category: { name: "Food" },
    subcategory: { name: "Dinner" },
    ...overrides,
  };
}

describe("transaction service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("validates category and subcategory ownership before create", async () => {
    mockPrisma.category.findFirst.mockResolvedValueOnce(null);

    const missingCategory = await createTransaction({
      userUuid: "user-1",
      amount: 25,
      recipientRaw: "merchant@upi",
      categoryId: 10,
      type: TransactionType.UPI,
      timestamp: new Date(),
      source: TransactionSource.MANUAL,
    });

    expect(missingCategory).toMatchObject({
      ok: false,
      error: "VALIDATION_ERROR",
      details: [{ path: ["categoryId"], message: "Unknown category" }],
    });
    expect(resolveRecipientMock).not.toHaveBeenCalled();

    mockPrisma.category.findFirst.mockResolvedValueOnce({ id: 10 });
    mockPrisma.subcategory.findFirst.mockResolvedValueOnce(null);

    const missingSubcategory = await createTransaction({
      userUuid: "user-1",
      amount: 25,
      recipientRaw: "merchant@upi",
      categoryId: 10,
      subcategoryId: 20,
      type: TransactionType.UPI,
      timestamp: new Date(),
      source: TransactionSource.MANUAL,
    });

    expect(missingSubcategory).toMatchObject({
      ok: false,
      error: "VALIDATION_ERROR",
      details: [{ path: ["subcategoryId"], message: "Unknown subcategory" }],
    });
  });

  it("trims nullable text fields before creating a transaction", async () => {
    mockPrisma.category.findFirst.mockResolvedValueOnce({ id: 10 });
    mockPrisma.subcategory.findFirst.mockResolvedValueOnce({ id: 20 });
    resolveRecipientMock.mockResolvedValueOnce({
      ok: true,
      data: { recipientId: 30, displayName: "Merchant" },
    });
    mockPrisma.transaction.create.mockResolvedValueOnce({ id: 1, uuid: "txn-1" });

    const timestamp = new Date("2026-06-14T10:00:00.000Z");
    const result = await createTransaction({
      userUuid: "user-1",
      amount: 25,
      recipientRaw: " merchant@upi ",
      recipientName: " Merchant ",
      categoryId: 10,
      subcategoryId: 20,
      type: TransactionType.UPI,
      remarks: " dinner ",
      timestamp,
      reference: " ref ",
      accountLabel: " hdfc ",
      locationRaw: " office ",
      source: TransactionSource.MANUAL,
    });

    expect(result).toEqual({ ok: true, data: { id: 1, uuid: "txn-1" } });
    expect(mockPrisma.transaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        recipientRaw: "merchant@upi",
        recipientName: "Merchant",
        reference: "ref",
        accountLabel: "hdfc",
        remarks: "dinner",
        locationRaw: "office",
      }),
      select: { id: true, uuid: true },
    });
  });

  it("maps list filters, pagination, search, and amount sorting", async () => {
    const first = new Date("2026-06-01T00:00:00.000Z");
    const last = new Date("2026-06-30T00:00:00.000Z");
    mockPrisma.transaction.findFirst
      .mockResolvedValueOnce({ timestamp: first })
      .mockResolvedValueOnce({ timestamp: last });
    mockPrisma.transaction.count.mockResolvedValueOnce(2);
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      transactionRecord({ id: 2, amount: amount(250) }),
    ]);

    const result = await listTransactions({
      userUuid: "user-1",
      page: 2,
      size: 1,
      q: "250",
      sortBy: "amount",
      sortOrder: "asc",
      categories: ["Food", "uncategorized"],
      startDate: first,
      endDate: last,
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        page: 2,
        pageSize: 1,
        total: 2,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
        firstTxnDate: first.toISOString(),
        lastTxnDate: last.toISOString(),
      },
    });
    expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userUuid: "user-1",
          AND: expect.arrayContaining([
            expect.objectContaining({ OR: expect.any(Array) }),
            expect.objectContaining({ OR: expect.any(Array) }),
            { timestamp: { gte: first, lte: last } },
          ]),
        }),
        orderBy: { amount: "asc" },
        skip: 1,
        take: 1,
      })
    );
  });

  it("returns NOT_FOUND for cross-user get, update, and delete operations", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValue(null);

    await expect(
      getTransactionById({ userUuid: "user-1", transactionId: 99 })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });
    await expect(
      updateTransaction({
        userUuid: "user-1",
        transactionId: 99,
        amount: 25,
        recipientRaw: "merchant@upi",
        type: TransactionType.UPI,
        timestamp: new Date(),
        source: TransactionSource.MANUAL,
      })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });
    await expect(
      deleteTransaction({ userUuid: "user-1", transactionId: 99 })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });
  });

  it("suggests the most frequent category and subcategory with deterministic ties", async () => {
    mockPrisma.transaction.findFirst.mockResolvedValueOnce({ id: 99, recipientId: 30 });
    mockPrisma.transaction.findMany.mockResolvedValueOnce([
      { category: { name: "Shopping" }, subcategory: { name: "Gifts" } },
      { category: { name: "Food" }, subcategory: { name: "Dinner" } },
      { category: { name: "Food" }, subcategory: { name: "Lunch" } },
      { category: { name: "Shopping" }, subcategory: { name: "Apparel" } },
    ]);

    const result = await suggestTransactionCategory({
      userUuid: "user-1",
      transactionId: 99,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        suggestedCategory: "Food",
        suggestedSubCategory: "Apparel",
      },
    });
  });
});
