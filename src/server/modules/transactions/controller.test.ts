import { getTransactions } from "./controller";

import { requireSessionUser } from "@/server/auth/session";
import { listTransactions } from "@/server/modules/transactions/service";
import { parseJson } from "@/test/api-test-helpers";

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("@/server/modules/transactions/service", () => ({
  listTransactions: jest.fn(),
}));

const requireSessionUserMock = requireSessionUser as jest.Mock;
const listTransactionsMock = listTransactions as jest.Mock;

describe("transactions controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("passes repeated and csv category filters as a deduplicated array", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
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

    const response = await getTransactions(
      new Request(
        "http://localhost/api/transactions?category=Food&category=uncategorized&categories=Food,Travel"
      )
    );

    expect(response.status).toBe(200);
    expect(listTransactionsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userUuid: "u1",
        categories: ["Food", "uncategorized", "Travel"],
      })
    );
  });

  it("returns 400 for malformed query params", async () => {
    requireSessionUserMock.mockResolvedValueOnce({
      ok: true,
      data: { userUuid: "u1" },
    });

    const response = await getTransactions(
      new Request("http://localhost/api/transactions?page=abc")
    );
    const body = await parseJson<{ message: string }>(response);

    expect(response.status).toBe(400);
    expect(body.message).toBe("Invalid request");
  });
});
