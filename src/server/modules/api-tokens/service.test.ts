jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as typeof globalThis & { __apiTokenPrismaMock?: unknown }).__apiTokenPrismaMock = {
    apiToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      updateMany: jest.fn(),
    },
  }),
}));

import { ApiTokenScope } from "@/generated/prisma-rewrite";

import { createApiToken, hashApiToken, resolveApiToken, revokeApiToken } from "./service";

const prisma = (globalThis as typeof globalThis & { __apiTokenPrismaMock: {
  apiToken: Record<"create" | "findFirst" | "findMany" | "updateMany", jest.Mock>;
} }).__apiTokenPrismaMock;

describe("API token service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("requires explicit scopes and stores only the hash", async () => {
    await expect(createApiToken({ userUuid: "user", label: "Empty", scopes: [] })).resolves.toEqual({ ok: false, error: "VALIDATION_ERROR", details: undefined });
    expect(prisma.apiToken.create).not.toHaveBeenCalled();

    prisma.apiToken.create.mockResolvedValue({
      uuid: "550e8400-e29b-41d4-a716-446655440000", label: "Codex", tokenPrefix: "prefix", scopes: [ApiTokenScope.TRANSACTIONS_READ], createdAt: new Date(), lastUsedAt: null, revokedAt: null,
    });
    const result = await createApiToken({ userUuid: "user", label: " Codex ", scopes: [ApiTokenScope.TRANSACTIONS_READ, ApiTokenScope.TRANSACTIONS_READ] });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(prisma.apiToken.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ label: "Codex", scopes: [ApiTokenScope.TRANSACTIONS_READ], tokenHash: hashApiToken(result.data.token) }) }));
  });

  it("returns the owning identity and conditionally updates old usage", async () => {
    prisma.apiToken.findFirst.mockResolvedValue({ uuid: "token", userUuid: "user", scopes: [ApiTokenScope.TRANSACTIONS_WRITE], lastUsedAt: null });
    prisma.apiToken.updateMany.mockResolvedValue({ count: 1 });
    await expect(resolveApiToken("plain")).resolves.toEqual({ ok: true, data: { userUuid: "user", tokenUuid: "token", scopes: [ApiTokenScope.TRANSACTIONS_WRITE] } });
    expect(prisma.apiToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ uuid: "token", OR: expect.any(Array) }) }));
  });

  it("does not reject valid authentication when usage bookkeeping fails", async () => {
    prisma.apiToken.findFirst.mockResolvedValue({ uuid: "token", userUuid: "user", scopes: [], lastUsedAt: null });
    prisma.apiToken.updateMany.mockRejectedValue(new Error("write failed"));
    await expect(resolveApiToken("plain")).resolves.toMatchObject({ ok: true });
  });

  it("fails closed on lookup failures and hides invalid or revoked records", async () => {
    prisma.apiToken.findFirst.mockResolvedValueOnce(null);
    await expect(resolveApiToken("invalid")).resolves.toEqual({ ok: false, error: "UNAUTHORIZED", details: undefined });
    prisma.apiToken.findFirst.mockRejectedValueOnce(new Error("database down"));
    await expect(resolveApiToken("valid-looking")).resolves.toEqual({ ok: false, error: "SERVICE_UNAVAILABLE", details: undefined });
  });

  it("revokes only active user-owned records", async () => {
    prisma.apiToken.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    await expect(revokeApiToken({ userUuid: "other", tokenUuid: "token" })).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });
    await expect(revokeApiToken({ userUuid: "user", tokenUuid: "token" })).resolves.toEqual({ ok: true, data: { revoked: true } });
  });

  it("can restrict revocation to a required scope", async () => {
    prisma.apiToken.updateMany.mockResolvedValueOnce({ count: 1 });

    await revokeApiToken({
      userUuid: "user",
      tokenUuid: "token",
      requiredScope: ApiTokenScope.SMS_IMPORT,
    });

    expect(prisma.apiToken.updateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ scopes: { has: ApiTokenScope.SMS_IMPORT } }),
    }));
  });
});
