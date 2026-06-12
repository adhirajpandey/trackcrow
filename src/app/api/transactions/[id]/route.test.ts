import { DELETE, GET, PATCH } from "./route";

import { requireSessionUser } from "@/server/auth/session";
import {
  deleteTransaction,
  getTransactionById,
  updateTransaction,
} from "@/server/modules/transactions/service";
import { makeJsonRequest, parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/transactions/service", () => ({
  deleteTransaction: jest.fn(),
  getTransactionById: jest.fn(),
  updateTransaction: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const getTransactionByIdMock = getTransactionById as jest.Mock;
const updateTransactionMock = updateTransaction as jest.Mock;
const deleteTransactionMock = deleteTransaction as jest.Mock;

describe("GET /api/transactions/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns transaction payload", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    getTransactionByIdMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 1, uuid: "txn-1" },
    });

    const response = await GET(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe(1);
  });
});

describe("PATCH /api/transactions/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("updates transaction", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    updateTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 1 },
    });

    const response = await PATCH(
      makeJsonRequest("http://localhost", "PATCH", {
        amount: 30,
        recipientRaw: "merchant@upi",
        type: "UPI",
        timestamp: "2026-06-13T10:00:00.000Z",
      }),
      { params: Promise.resolve({ id: "1" }) }
    );
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe(1);
  });
});

describe("DELETE /api/transactions/[id]", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("deletes transaction", async () => {
    requireSessionUserMock.mockResolvedValueOnce({ ok: true, data: { userUuid: "u1" } });
    deleteTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { id: 1 },
    });

    const response = await DELETE(new Request("http://localhost") as any, {
      params: Promise.resolve({ id: "1" }),
    });
    const body = await parseJson<{ id: number }>(response);

    expect(response.status).toBe(200);
    expect(body.id).toBe(1);
  });
});
