jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(),
}));

jest.mock("./service", () => ({
  createApiToken: jest.fn(),
  listApiTokens: jest.fn(),
  revokeApiToken: jest.fn(),
}));

import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { requireSessionUser } from "@/server/auth/session";

import { getLegacyDeviceTokens, postApiToken, removeLegacyDeviceToken } from "./controller";
import { createApiToken, listApiTokens, revokeApiToken } from "./service";

const requireSessionUserMock = jest.mocked(requireSessionUser);
const createApiTokenMock = jest.mocked(createApiToken);
const listApiTokensMock = jest.mocked(listApiTokens);
const revokeApiTokenMock = jest.mocked(revokeApiToken);

describe("legacy device token controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({
      ok: true,
      data: { userUuid: "user-1" },
    });
  });

  it("lists only tokens with SMS import permission", async () => {
    const createdAt = new Date("2026-09-15T00:00:00Z");
    listApiTokensMock.mockResolvedValue({
      ok: true,
      data: [
        { uuid: "sms", label: "Phone", tokenPrefix: "sms", scopes: [ApiTokenScope.SMS_IMPORT], createdAt, lastUsedAt: null, revokedAt: null },
        { uuid: "read", label: "Reader", tokenPrefix: "read", scopes: [ApiTokenScope.TRANSACTIONS_READ], createdAt, lastUsedAt: null, revokedAt: null },
      ],
    });

    const response = await getLegacyDeviceTokens();

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body).toEqual([expect.objectContaining({ uuid: "sms" })]);
    expect(body[0]).not.toHaveProperty("scopes");
  });

  it("restricts legacy revocation to SMS import tokens", async () => {
    revokeApiTokenMock.mockResolvedValue({ ok: true, data: { revoked: true } });
    const tokenUuid = "550e8400-e29b-41d4-a716-446655440000";

    const response = await removeLegacyDeviceToken(
      new Request(`http://localhost/api/device-tokens/${tokenUuid}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: tokenUuid }) }
    );

    expect(response.status).toBe(200);
    expect(revokeApiTokenMock).toHaveBeenCalledWith({
      userUuid: "user-1",
      tokenUuid,
      requiredScope: ApiTokenScope.SMS_IMPORT,
    });
  });

  it("creates an SMS-only token without adding fields to the legacy response", async () => {
    const createdAt = new Date("2026-09-15T00:00:00Z");
    createApiTokenMock.mockResolvedValue({
      ok: true,
      data: {
        token: "plain-token",
        record: { uuid: "sms", label: "Phone", tokenPrefix: "plain", scopes: [ApiTokenScope.SMS_IMPORT], createdAt, lastUsedAt: null, revokedAt: null },
      },
    });

    const response = await postApiToken(new Request("http://localhost/api/device-tokens", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "Phone" }),
    }), true);
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(createApiTokenMock).toHaveBeenCalledWith({
      userUuid: "user-1",
      label: "Phone",
      scopes: [ApiTokenScope.SMS_IMPORT],
    });
    expect(body.record).not.toHaveProperty("scopes");
  });
});
