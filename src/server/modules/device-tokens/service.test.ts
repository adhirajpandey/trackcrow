jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__deviceTokensPrismaMock = {
    deviceToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  }),
}));

import {
  createDeviceToken,
  hashDeviceToken,
  listDeviceTokens,
  revokeDeviceToken,
} from "./service";

const mockPrisma = (globalThis as any).__deviceTokensPrismaMock;

describe("device token service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("hashes tokens with SHA-256", () => {
    expect(hashDeviceToken("token")).toBe(
      "3c469e9d6c5875d37a43f353d4f88e61fcf812c66eee3457465a40b0da4153e0"
    );
  });

  it("creates a plain token once and stores only hash and prefix", async () => {
    const createdAt = new Date("2026-06-14T10:00:00.000Z");
    mockPrisma.deviceToken.create.mockResolvedValueOnce({
      id: 1,
      uuid: "token-uuid",
      label: "Phone",
      tokenPrefix: "ignored",
      createdAt,
      lastUsedAt: null,
      revokedAt: null,
    });

    const result = await createDeviceToken({
      userUuid: "user-1",
      label: " Phone ",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }
    expect(result.data.token).toHaveLength(48);
    expect(mockPrisma.deviceToken.create).toHaveBeenCalledWith({
      data: {
        userUuid: "user-1",
        label: "Phone",
        tokenHash: hashDeviceToken(result.data.token),
        tokenPrefix: result.data.token.slice(0, 8),
      },
      select: {
        id: true,
        uuid: true,
        label: true,
        tokenPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    });
  });

  it("lists user tokens newest first", async () => {
    mockPrisma.deviceToken.findMany.mockResolvedValueOnce([]);

    await listDeviceTokens({ userUuid: "user-1" });

    expect(mockPrisma.deviceToken.findMany).toHaveBeenCalledWith({
      where: { userUuid: "user-1" },
      select: {
        id: true,
        uuid: true,
        label: true,
        tokenPrefix: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
  });

  it("revokes only active user-owned tokens", async () => {
    mockPrisma.deviceToken.findFirst.mockResolvedValueOnce(null);
    await expect(
      revokeDeviceToken({ userUuid: "user-1", tokenId: 10 })
    ).resolves.toMatchObject({ ok: false, error: "NOT_FOUND" });
    expect(mockPrisma.deviceToken.update).not.toHaveBeenCalled();

    mockPrisma.deviceToken.findFirst.mockResolvedValueOnce({ id: 10 });
    await expect(
      revokeDeviceToken({ userUuid: "user-1", tokenId: 10 })
    ).resolves.toEqual({ ok: true, data: { revoked: true } });
    expect(mockPrisma.deviceToken.findFirst).toHaveBeenLastCalledWith({
      where: {
        id: 10,
        userUuid: "user-1",
        revokedAt: null,
      },
      select: { id: true },
    });
    expect(mockPrisma.deviceToken.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { revokedAt: expect.any(Date) },
    });
  });
});
