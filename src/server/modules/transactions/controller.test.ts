jest.mock("@/server/modules/api-tokens/service", () => ({
  resolveApiToken: jest.fn(),
  hasApiTokenScope: (identity: { scopes: string[] }, scope: string) => identity.scopes.includes(scope),
}));
import { resolveApiToken } from "@/server/modules/api-tokens/service";
import { ApiTokenScope } from "@/generated/prisma-rewrite";

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
        classificationSource: "MANUAL",
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
      classificationSource: "MANUAL",
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
      data: { ignored: false, uuid: "txn-created" },
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

describe("transaction list PAT authentication", () => {
  const resolveToken = jest.mocked(resolveApiToken);
  beforeEach(() => {
    jest.resetAllMocks();
    requireSessionUserMock.mockResolvedValue({ ok: true, data: { userUuid: "session-user" } });
    listTransactionsMock.mockResolvedValue({ ok: true, data: {
      transactions: [], page: 1, pageSize: 50, total: 0, totalPages: 0,
      hasNext: false, hasPrev: false, firstTxnDate: null, lastTxnDate: null,
    } });
  });
  const request = (authorization?: string) => new Request(
    "http://localhost/api/transactions?page=1&size=50&sortBy=timestamp&sortOrder=desc&userUuid=attacker",
    { headers: authorization === undefined ? {} : { authorization } },
  );
  it("preserves session authentication when no Authorization header exists", async () => {
    expect((await getTransactions(request())).status).toBe(200);
    expect(resolveToken).not.toHaveBeenCalled();
    expect(listTransactionsMock).toHaveBeenCalledWith(expect.objectContaining({ userUuid: "session-user" }));
  });
  it("returns 401 when neither a session nor a token exists", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });
    expect((await getTransactions(request())).status).toBe(401);
  });
  it.each(["", "Basic abc", "Bearer", "Bearer abc def"])("rejects malformed header %p without session fallback", async (header) => {
    expect((await getTransactions(request(header))).status).toBe(401);
    expect(requireSessionUserMock).not.toHaveBeenCalled();
    expect(listTransactionsMock).not.toHaveBeenCalled();
  });
  it.each(["Bearer", "Token"])("accepts %s PAT and scopes results to its owner", async (scheme) => {
    resolveToken.mockResolvedValueOnce({ ok: true, data: {
      userUuid: "pat-user", tokenUuid: "token-1", scopes: [ApiTokenScope.TRANSACTIONS_READ],
    } });
    expect((await getTransactions(request(`${scheme} test-pat`))).status).toBe(200);
    expect(resolveToken).toHaveBeenCalledWith("test-pat");
    expect(requireSessionUserMock).not.toHaveBeenCalled();
    expect(listTransactionsMock).toHaveBeenCalledWith(expect.objectContaining({
      userUuid: "pat-user", page: 1, size: 50, sortBy: "timestamp", sortOrder: "desc",
    }));
  });
  it("returns 403 for a valid PAT lacking read scope", async () => {
    resolveToken.mockResolvedValueOnce({ ok: true, data: {
      userUuid: "pat-user", tokenUuid: "token-1", scopes: [ApiTokenScope.SMS_IMPORT],
    } });
    expect((await getTransactions(request("Bearer test-pat"))).status).toBe(403);
    expect(listTransactionsMock).not.toHaveBeenCalled();
    expect(requireSessionUserMock).not.toHaveBeenCalled();
  });
  it.each([["UNAUTHORIZED", 401], ["SERVICE_UNAVAILABLE", 503]] as const)("maps %s without session fallback", async (error, status) => {
    resolveToken.mockResolvedValueOnce({ ok: false, error });
    expect((await getTransactions(request("Bearer test-pat"))).status).toBe(status);
    expect(listTransactionsMock).not.toHaveBeenCalled();
    expect(requireSessionUserMock).not.toHaveBeenCalled();
  });
  it("does not add PAT authentication to transaction writes", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });
    expect((await postTransaction(request("Bearer test-pat"))).status).toBe(401);
    expect(resolveToken).not.toHaveBeenCalled();
  });
});
