jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("./service", () => ({
  createTransaction: jest.fn(),
  listTransactions: jest.fn(),
  updateTransactionCategory: jest.fn(),
}));

import { requireSessionUser } from "@/server/auth/session";

import { getTransactions, patchTransactionCategory, postTransaction } from "./controller";
import { createTransaction, listTransactions, updateTransactionCategory } from "./service";

const requireSessionUserMock = jest.mocked(requireSessionUser);
const listTransactionsMock = jest.mocked(listTransactions);
const updateTransactionCategoryMock = jest.mocked(updateTransactionCategory);
const createTransactionMock = jest.mocked(createTransaction);

describe("transactions controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({
      ok: true,
      data: { userUuid: "user-1" },
    });
  });

  it("accepts repeated and CSV category and subcategory filters", async () => {
    listTransactionsMock.mockResolvedValueOnce({
      ok: true,
      data: {
        transactions: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        firstTxnDate: null,
        lastTxnDate: null,
      },
    });

    const response = await getTransactions(
      new Request(
        "http://localhost/api/transactions?category=Food&categories=Travel,Shopping&subcategory=Lunch&subcategories=Dinner,Snacks"
      )
    );

    expect(response.status).toBe(200);
    expect(listTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userUuid: "user-1",
        categories: ["Food", "Travel", "Shopping"],
        subcategories: ["Lunch", "Dinner", "Snacks"],
      })
    );
  });

  it("converts custom day filters into full IST day boundaries", async () => {
    listTransactionsMock.mockResolvedValueOnce({
      ok: true,
      data: {
        transactions: [],
        page: 1,
        pageSize: 10,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        firstTxnDate: null,
        lastTxnDate: null,
      },
    });

    const response = await getTransactions(
      new Request(
        "http://localhost/api/transactions?range=custom&startDate=2026-06-18&endDate=2026-06-18"
      )
    );

    expect(response.status).toBe(200);
    expect(listTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userUuid: "user-1",
        startDate: new Date("2026-06-17T18:30:00.000Z"),
        endDate: new Date("2026-06-18T18:29:59.999Z"),
      })
    );
  });

  it("patches a transaction category with the narrow payload", async () => {
    updateTransactionCategoryMock.mockResolvedValueOnce({
      ok: true,
      data: {
        uuid: "txn-12",
        categoryUuid: "cat-food",
        category: "Food",
        subcategoryUuid: null,
        subcategory: null,
      },
    });

    const response = await patchTransactionCategory(
      new Request("http://localhost/api/transactions/550e8400-e29b-41d4-a716-446655440000/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryUuid: "550e8400-e29b-41d4-a716-446655440001" }),
      }),
      { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      uuid: "txn-12",
      categoryUuid: "cat-food",
      category: "Food",
      subcategoryUuid: null,
      subcategory: null,
    });
    expect(updateTransactionCategoryMock).toHaveBeenCalledWith({
      transactionUuid: "550e8400-e29b-41d4-a716-446655440000",
      userUuid: "user-1",
      categoryUuid: "550e8400-e29b-41d4-a716-446655440001",
      subcategoryUuid: undefined,
    });
  });

  it("creates a manual transaction for the authenticated user", async () => {
    createTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { uuid: "txn-created" },
    });

    const response = await postTransaction(
      new Request("http://localhost/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: 250,
          recipientUuid: "550e8400-e29b-41d4-a716-446655440000",
          type: "UPI",
          timestamp: "2026-07-12T15:12:00.000Z",
        }),
      })
    );

    expect(response.status).toBe(201);
    expect(createTransactionMock).toHaveBeenCalledWith({
      userUuid: "user-1",
      amount: 250,
      recipientUuid: "550e8400-e29b-41d4-a716-446655440000",
      type: "UPI",
      timestamp: new Date("2026-07-12T15:12:00.000Z"),
      source: "MANUAL",
    });
  });

  it("rejects malformed category payloads", async () => {
    const response = await patchTransactionCategory(
      new Request("http://localhost/api/transactions/550e8400-e29b-41d4-a716-446655440000/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryUuid: "oops" }),
      }),
      { params: Promise.resolve({ id: "550e8400-e29b-41d4-a716-446655440000" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Invalid request",
      issues: expect.any(Array),
    });
  });

  it("returns a clean 400 for numeric transaction route params", async () => {
    const response = await patchTransactionCategory(
      new Request("http://localhost/api/transactions/123/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryUuid: "550e8400-e29b-41d4-a716-446655440001" }),
      }),
      { params: Promise.resolve({ id: "123" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Invalid request",
    });
    expect(updateTransactionCategoryMock).not.toHaveBeenCalled();
  });
});
