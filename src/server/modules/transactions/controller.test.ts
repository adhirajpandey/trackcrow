jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("./service", () => ({
  listTransactions: jest.fn(),
  updateTransactionCategory: jest.fn(),
}));

import { requireSessionUser } from "@/server/auth/session";

import { getTransactions, patchTransactionCategory } from "./controller";
import { listTransactions, updateTransactionCategory } from "./service";

const requireSessionUserMock = jest.mocked(requireSessionUser);
const listTransactionsMock = jest.mocked(listTransactions);
const updateTransactionCategoryMock = jest.mocked(updateTransactionCategory);

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

  it("patches a transaction category with the narrow payload", async () => {
    updateTransactionCategoryMock.mockResolvedValueOnce({
      ok: true,
      data: {
        id: 12,
        categoryId: 9,
        category: "Food",
        subcategoryId: null,
        subcategory: null,
      },
    });

    const response = await patchTransactionCategory(
      new Request("http://localhost/api/transactions/12/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: 9 }),
      }),
      { params: Promise.resolve({ id: "12" }) }
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      id: 12,
      categoryId: 9,
      category: "Food",
      subcategoryId: null,
      subcategory: null,
    });
    expect(updateTransactionCategoryMock).toHaveBeenCalledWith({
      transactionId: 12,
      userUuid: "user-1",
      categoryId: 9,
    });
  });

  it("rejects malformed category payloads", async () => {
    const response = await patchTransactionCategory(
      new Request("http://localhost/api/transactions/12/category", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categoryId: "oops" }),
      }),
      { params: Promise.resolve({ id: "12" }) }
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      message: "Invalid request",
      issues: expect.any(Array),
    });
  });
});
