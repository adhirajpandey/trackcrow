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

import { postApiToken, removeApiToken } from "./controller";
import { createApiToken, revokeApiToken } from "./service";

const requireSessionUserMock = jest.mocked(requireSessionUser);
const createApiTokenMock = jest.mocked(createApiToken);
const revokeApiTokenMock = jest.mocked(revokeApiToken);

function postRequest(body: unknown) {
  return new Request("http://localhost/api/tokens", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("api token controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    requireSessionUserMock.mockResolvedValue({
      ok: true,
      data: { userUuid: "user-1" },
    });
  });

  it("creates a token with the requested scopes", async () => {
    const createdAt = new Date("2026-09-15T00:00:00Z");
    createApiTokenMock.mockResolvedValue({
      ok: true,
      data: {
        token: "plain-token",
        record: { uuid: "read", label: "Reader", tokenPrefix: "plain", scopes: [ApiTokenScope.TRANSACTIONS_READ], createdAt, lastUsedAt: null, revokedAt: null },
      },
    });

    const response = await postApiToken(postRequest({ label: "Reader", scopes: [ApiTokenScope.TRANSACTIONS_READ] }));

    expect(response.status).toBe(201);
    expect(createApiTokenMock).toHaveBeenCalledWith({
      userUuid: "user-1",
      label: "Reader",
      scopes: [ApiTokenScope.TRANSACTIONS_READ],
    });
    expect((await response.json()).record).toHaveProperty("scopes");
  });

  it("rejects creation without scopes", async () => {
    const response = await postApiToken(postRequest({ label: "Phone" }));

    expect(response.status).toBe(400);
    expect(createApiTokenMock).not.toHaveBeenCalled();
  });

  it("revokes a token owned by the session user", async () => {
    revokeApiTokenMock.mockResolvedValue({ ok: true, data: { revoked: true } });
    const tokenUuid = "550e8400-e29b-41d4-a716-446655440000";

    const response = await removeApiToken(
      new Request(`http://localhost/api/tokens/${tokenUuid}`, { method: "DELETE" }),
      { params: Promise.resolve({ id: tokenUuid }) }
    );

    expect(response.status).toBe(200);
    expect(revokeApiTokenMock).toHaveBeenCalledWith({ userUuid: "user-1", tokenUuid });
  });
});
