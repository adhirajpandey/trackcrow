import { GET, POST } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import {
  createTransaction,
  listTransactions,
} from "@/server/modules/transactions/service";
import { makeJsonRequest, parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/transactions/service", () => ({
  createTransaction: jest.fn(),
  listTransactions: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const listTransactionsMock = listTransactions as jest.Mock;
const createTransactionMock = createTransaction as jest.Mock;

describe("GET /api/transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when session is missing", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });

    const response = await GET(new Request("http://localhost/api/transactions"));
    const body = await parseJson<{ message: string }>(response);

    expect(response.status).toBe(401);
    expect(body.message).toBe("Unauthorized");
  });

  it("returns 200 with transaction list payload", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "user-1" },
    });
    listTransactionsMock.mockResolvedValueOnce({
      ok: true,
      data: {
        transactions: [],
        page: 1,
        pageSize: 20,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
        firstTxnDate: null,
        lastTxnDate: null,
      },
    });

    const response = await GET(new Request("http://localhost/api/transactions"));
    const body = await parseJson<{ pageSize: number; transactions: unknown[] }>(response);

    expect(response.status).toBe(200);
    expect(body.pageSize).toBe(20);
    expect(body.transactions).toEqual([]);
  });
});

describe("POST /api/transactions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid json", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "user-1" },
    });

    const response = await POST(
      new Request("http://localhost/api/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{bad-json",
      })
    );

    expect(response.status).toBe(400);
  });

  it("returns 201 for valid payload", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "user-1" },
    });
    createTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 99, uuid: "txn-uuid" },
    });

    const response = await POST(
      makeJsonRequest("http://localhost/api/transactions", "POST", {
        amount: 25,
        recipientRaw: "merchant@upi",
        recipientName: "Merchant",
        categoryId: 1,
        type: "UPI",
        timestamp: "2026-06-13T10:00:00.000Z",
      })
    );
    const body = await parseJson<{ id: number; uuid: string }>(response);

    expect(response.status).toBe(201);
    expect(body.id).toBe(99);
    expect(body.uuid).toBe("txn-uuid");
  });
});
