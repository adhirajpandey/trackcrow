jest.mock("@/server/modules/api-tokens/service", () => ({
  resolveApiToken: jest.fn(),
  hasApiTokenScope: (identity: { scopes: string[] }, scope: string) => identity.scopes.includes(scope),
}));
jest.mock("./service", () => ({ importSmsTransaction: jest.fn() }));
import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { resolveApiToken } from "@/server/modules/api-tokens/service";
import { postSmsImport } from "./controller";
import { importSmsTransaction } from "./service";
const resolve = jest.mocked(resolveApiToken);
const imported = jest.mocked(importSmsTransaction);
const request = (timestamp?: string) => new Request("http://localhost/api/imports/sms", {
  method: "POST", headers: { authorization: "Bearer test-pat", "Content-Type": "application/json" },
  body: JSON.stringify({ data: { message: "sms", timestamp }, metadata: { location: null } }),
});
beforeEach(() => {
  jest.resetAllMocks();
  resolve.mockResolvedValue({ ok: true, data: { userUuid: "pat-owner", tokenUuid: "token", scopes: [ApiTokenScope.SMS_IMPORT] } });
  imported.mockResolvedValue({ ok: true, data: { ignored: false, uuid: "transaction-uuid" } });
});
it("passes a zoned timestamp as a Date and preserves the import response", async () => {
  const response = await postSmsImport(request("2026-09-28T17:30:00+05:30"));
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ message: "Transaction created", uuid: "transaction-uuid" });
  expect(imported).toHaveBeenCalledWith({ userUuid: "pat-owner", message: "sms", timestamp: new Date("2026-09-28T12:00:00Z"), location: null });
});
it("omits occurrence time for existing clients", async () => {
  await postSmsImport(request());
  expect(imported).toHaveBeenCalledWith({ userUuid: "pat-owner", message: "sms", location: null });
});
it("returns 400 without importing an invalid timestamp", async () => {
  expect((await postSmsImport(request("2026-09-28T12:00:00"))).status).toBe(400);
  expect(imported).not.toHaveBeenCalled();
});
it("preserves rule-ignore responses", async () => {
  imported.mockResolvedValueOnce({ ok: true, data: { ignored: true, ruleUuid: "rule" } });
  const response = await postSmsImport(request());
  expect(response.status).toBe(201);
  expect(await response.json()).toEqual({ message: "Message ignored by rule" });
});
it("rejects a read-only PAT before processing SMS", async () => {
  resolve.mockResolvedValueOnce({ ok: true, data: { userUuid: "owner", tokenUuid: "token", scopes: [ApiTokenScope.TRANSACTIONS_READ] } });
  expect((await postSmsImport(request())).status).toBe(403);
  expect(imported).not.toHaveBeenCalled();
});
