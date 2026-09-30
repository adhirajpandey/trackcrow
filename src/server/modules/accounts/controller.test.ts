import * as tokenAuth from "@/server/modules/api-tokens/service";
import * as sessionAuth from "@/server/auth/session";
import * as handlers from "./controller";
import * as services from "./service";
jest.mock("@/server/modules/api-tokens/service", () => ({
  resolveApiToken: jest.fn(),
  hasApiTokenScope: (identity: { scopes: string[] }, scope: string) => identity.scopes.includes(scope),
}));
jest.mock("@/server/auth/session", () => ({ requireSessionUser: jest.fn() }));
jest.mock("./service", () => ({
  listAccounts: jest.fn(),
  createAccount: jest.fn(),
  updateAccount: jest.fn(),
}));

import { ApiTokenScope } from "@/generated/prisma-rewrite";

describe("accounts scoped bearer authentication", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(sessionAuth.requireSessionUser).mockResolvedValue({ ok: true, data: { userUuid: "session-user" } });
  });

  const cases = [
    {
      name: "GET /api/accounts",
      scope: ApiTokenScope.TRANSACTIONS_READ,
      mock: jest.mocked(services.listAccounts),
      data: [],
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/accounts", { method: "GET", headers: { authorization: "Bearer test-pat" } });
        return handlers.getAccounts(request);
      },
    },
    {
      name: "POST /api/accounts",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.createAccount),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 201,
      invoke: () => {
        const request = new Request("http://localhost/api/accounts", { method: "POST", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"name": "Bank"}) });
        return handlers.postAccount(request);
      },
    },
    {
      name: "PATCH /api/accounts/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.updateAccount),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/accounts/550e8400-e29b-41d4-a716-446655440000", { method: "PATCH", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"name": "Bank"}) });
        return handlers.patchAccount(request, { params: Promise.resolve({ accountUuid: "550e8400-e29b-41d4-a716-446655440000" }) });
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
