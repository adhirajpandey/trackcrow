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
