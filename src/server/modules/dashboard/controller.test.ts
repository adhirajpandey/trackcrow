import * as tokenAuth from "@/server/modules/api-tokens/service";
import * as sessionAuth from "@/server/auth/session";
import * as handlers from "./controller";
import * as services from "./service";
jest.mock("@/server/modules/api-tokens/service", () => ({
  resolveApiToken: jest.fn(),
  hasApiTokenScope: (identity: { scopes: string[] }, scope: string) => identity.scopes.includes(scope),
}));

jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("./service", () => ({
  getDashboardSummary: jest.fn(),
  getSpendingByCategory: jest.fn(),
  getSpendingByPeriod: jest.fn(),
}));

import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { requireSessionUser } from "@/server/auth/session";
import { resolveApiToken } from "@/server/modules/api-tokens/service";

import { getCategorySpending, getSummary } from "./controller";
import { getDashboardSummary, getSpendingByCategory } from "./service";

const requireSessionUserMock = jest.mocked(requireSessionUser);
const resolveTokenMock = jest.mocked(resolveApiToken);
const getDashboardSummaryMock = jest.mocked(getDashboardSummary);
const getSpendingByCategoryMock = jest.mocked(getSpendingByCategory);

const request = (path: string, authorization?: string) =>
  new Request(`http://localhost${path}`, {
    headers: authorization === undefined ? {} : { authorization },
  });

const tokenWith = (scopes: ApiTokenScope[]) => ({
  ok: true as const,
  data: { userUuid: "pat-user", tokenUuid: "token-1", scopes },
});

describe("dashboard controller authentication", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    requireSessionUserMock.mockResolvedValue({ ok: true, data: { userUuid: "session-user" } });
    getDashboardSummaryMock.mockResolvedValue({
      ok: true,
      data: {
        totalSpend: 0,
        transactionCount: 0,
        categorizedCount: 0,
        uncategorizedCount: 0,
        averageSpend: 0,
      },
    });
    getSpendingByCategoryMock.mockResolvedValue({ ok: true, data: [] });
  });

  it("uses the session when no Authorization header exists", async () => {
    expect((await getSummary(request("/api/dashboard/summary"))).status).toBe(200);
    expect(resolveTokenMock).not.toHaveBeenCalled();
    expect(getDashboardSummaryMock).toHaveBeenCalledWith(
      expect.objectContaining({ userUuid: "session-user" })
    );
  });

  it("scopes the summary to the owner of a read token", async () => {
    resolveTokenMock.mockResolvedValueOnce(tokenWith([ApiTokenScope.TRANSACTIONS_READ]));

    const response = await getSummary(
      request(
        "/api/dashboard/summary?startDate=2026-09-01T00:00:00.000Z&endDate=2026-09-29T12:00:00.000Z",
        "Bearer test-pat"
      )
    );

    expect(response.status).toBe(200);
    expect(resolveTokenMock).toHaveBeenCalledWith("test-pat");
    expect(requireSessionUserMock).not.toHaveBeenCalled();
    expect(getDashboardSummaryMock).toHaveBeenCalledWith({
      userUuid: "pat-user",
      startDate: new Date("2026-09-01T00:00:00.000Z"),
      endDate: new Date("2026-09-29T12:00:00.000Z"),
    });
  });

  it("scopes category spending to the owner of a read token", async () => {
    resolveTokenMock.mockResolvedValueOnce(tokenWith([ApiTokenScope.TRANSACTIONS_READ]));

    const response = await getCategorySpending(
      request("/api/dashboard/spending-by-category", "Token test-pat")
    );

    expect(response.status).toBe(200);
    expect(getSpendingByCategoryMock).toHaveBeenCalledWith(
      expect.objectContaining({ userUuid: "pat-user" })
    );
  });

  it("returns 403 for a token without read scope", async () => {
    resolveTokenMock.mockResolvedValueOnce(tokenWith([ApiTokenScope.SMS_IMPORT]));

    expect((await getSummary(request("/api/dashboard/summary", "Bearer test-pat"))).status).toBe(403);
    expect(getDashboardSummaryMock).not.toHaveBeenCalled();
  });

  it.each(["", "Basic abc", "Bearer abc def"])(
    "rejects malformed header %p without session fallback",
    async (header) => {
      expect((await getSummary(request("/api/dashboard/summary", header))).status).toBe(401);
      expect(requireSessionUserMock).not.toHaveBeenCalled();
      expect(getDashboardSummaryMock).not.toHaveBeenCalled();
    }
  );

});


describe("dashboard scoped bearer authentication", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(sessionAuth.requireSessionUser).mockResolvedValue({ ok: true, data: { userUuid: "session-user" } });
  });

  const cases = [
    {
      name: "GET /api/dashboard/spending-by-period?granularity=month",
      scope: ApiTokenScope.TRANSACTIONS_READ,
      mock: jest.mocked(services.getSpendingByPeriod),
      data: [],
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/dashboard/spending-by-period?granularity=month", { method: "GET", headers: { authorization: "Bearer test-pat" } });
        return handlers.getPeriodSpending(request);
      },
    },
  ];

  describe.each(cases)("$name", ({ scope, mock, data, status, invoke }) => {
    it("accepts the required scope and uses the token owner", async () => {
      jest.mocked(tokenAuth.resolveApiToken).mockResolvedValue({ ok: true, data: {
        userUuid: "pat-user", tokenUuid: "token-1", scopes: [scope],
      } });
      // Each handler receives a successful service result; auth stays real.
      (mock as jest.Mock).mockResolvedValue({ ok: true, data });
      expect((await invoke()).status).toBe(status);
      expect(mock).toHaveBeenCalledWith(expect.objectContaining({ userUuid: "pat-user" }));
      expect(tokenAuth.resolveApiToken).toHaveBeenCalledWith("test-pat");
      expect(sessionAuth.requireSessionUser).not.toHaveBeenCalled();
    });

    it("returns 403 for the opposite ledger scope", async () => {
      const wrongScope = scope === ApiTokenScope.TRANSACTIONS_READ
        ? ApiTokenScope.TRANSACTIONS_WRITE : ApiTokenScope.TRANSACTIONS_READ;
      jest.mocked(tokenAuth.resolveApiToken).mockResolvedValue({ ok: true, data: {
        userUuid: "pat-user", tokenUuid: "token-1", scopes: [wrongScope],
      } });
      expect((await invoke()).status).toBe(403);
      expect(mock).not.toHaveBeenCalled();
      expect(sessionAuth.requireSessionUser).not.toHaveBeenCalled();
    });

    it("returns 401 for revoked credentials without session fallback", async () => {
      jest.mocked(tokenAuth.resolveApiToken).mockResolvedValue({ ok: false, error: "UNAUTHORIZED" });
      expect((await invoke()).status).toBe(401);
      expect(mock).not.toHaveBeenCalled();
      expect(sessionAuth.requireSessionUser).not.toHaveBeenCalled();
    });
  });
});
