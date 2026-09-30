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
  createRule: jest.fn(),
  deleteRule: jest.fn(),
  getRule: jest.fn(),
  listRules: jest.fn(),
  updateRule: jest.fn(),
}));

import { requireSessionUser } from "@/server/auth/session";

import { getRuleByUuid, getRules, postRule } from "./controller";
import { createRule, getRule, listRules } from "./service";

const auth = jest.mocked(requireSessionUser);
const list = jest.mocked(listRules);
const create = jest.mocked(createRule);
const get = jest.mocked(getRule);

describe("rules controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    auth.mockResolvedValue({ ok: true, data: { userUuid: "user-1" } });
  });

  it("parses list filters", async () => {
    list.mockResolvedValue({ ok: true, data: { rules: [], page: 2, pageSize: 10, total: 0, totalPages: 0, hasNext: false, hasPrev: true } });
    const response = await getRules(new Request("http://localhost/api/rules?page=2&size=10&q=swiggy&status=enabled"));
    expect(response.status).toBe(200);
    expect(list).toHaveBeenCalledWith({ userUuid: "user-1", page: 2, size: 10, q: "swiggy", status: "enabled" });
  });

  it("uses ruleUuid and rejects non-UUID route values", async () => {
    const response = await getRuleByUuid(new Request("http://localhost/api/rules/123"), { params: Promise.resolve({ ruleUuid: "123" }) });
    expect(response.status).toBe(400);
    expect(get).not.toHaveBeenCalled();
  });

  it("returns the specified overlap error contract", async () => {
    create.mockResolvedValue({ ok: false, error: "RULE_RECIPIENT_CONFLICT", details: { existingRule: { uuid: "rule-1", name: "Existing" } } });
    const response = await postRule(new Request("http://localhost/api/rules", { method: "POST", body: JSON.stringify({
      name: "Rule", isEnabled: true,
      conditions: { recipient: { equals: "7a4bfec7-f109-4d37-bf9b-41f909f25dad" } },
      action: { categoryUuid: "5ac11b5c-f9af-41e6-a621-bd085836338e", subcategoryUuid: null },
    }) }));
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      message: "An enabled rule already exists for this recipient",
      code: "RULE_RECIPIENT_CONFLICT",
      details: { existingRule: { uuid: "rule-1", name: "Existing" } },
    });
  });
});

import { ApiTokenScope } from "@/generated/prisma-rewrite";

describe("rules scoped bearer authentication", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    jest.mocked(sessionAuth.requireSessionUser).mockResolvedValue({ ok: true, data: { userUuid: "session-user" } });
  });

  const cases = [
    {
      name: "GET /api/rules",
      scope: ApiTokenScope.TRANSACTIONS_READ,
      mock: jest.mocked(services.listRules),
      data: {"rules": []},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/rules", { method: "GET", headers: { authorization: "Bearer test-pat" } });
        return handlers.getRules(request);
      },
    },
    {
      name: "POST /api/rules",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.createRule),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 201,
      invoke: () => {
        const request = new Request("http://localhost/api/rules", { method: "POST", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"name": "Ignore merchant", "isEnabled": true, "conditions": {"recipient": {"equals": "550e8400-e29b-41d4-a716-446655440000"}}, "action": {"type": "IGNORE"}}) });
        return handlers.postRule(request);
      },
    },
    {
      name: "GET /api/rules/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_READ,
      mock: jest.mocked(services.getRule),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/rules/550e8400-e29b-41d4-a716-446655440000", { method: "GET", headers: { authorization: "Bearer test-pat" } });
        return handlers.getRuleByUuid(request, { params: Promise.resolve({ ruleUuid: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "PATCH /api/rules/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.updateRule),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/rules/550e8400-e29b-41d4-a716-446655440000", { method: "PATCH", headers: { authorization: "Bearer test-pat" }, body: JSON.stringify({"isEnabled": false}) });
        return handlers.patchRule(request, { params: Promise.resolve({ ruleUuid: "550e8400-e29b-41d4-a716-446655440000" }) });
      },
    },
    {
      name: "DELETE /api/rules/550e8400-e29b-41d4-a716-446655440000",
      scope: ApiTokenScope.TRANSACTIONS_WRITE,
      mock: jest.mocked(services.deleteRule),
      data: {"uuid": "550e8400-e29b-41d4-a716-446655440000"},
      status: 200,
      invoke: () => {
        const request = new Request("http://localhost/api/rules/550e8400-e29b-41d4-a716-446655440000", { method: "DELETE", headers: { authorization: "Bearer test-pat" } });
        return handlers.removeRule(request, { params: Promise.resolve({ ruleUuid: "550e8400-e29b-41d4-a716-446655440000" }) });
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
