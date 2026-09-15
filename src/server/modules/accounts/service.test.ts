jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__accountsPrismaMock = {
    account: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
  }),
}));

import { cleanAccountName, normalizeAccountName } from "./normalize";
import { createAccount, matchAccountByName, resolveAccountId, updateAccount } from "./service";

const prisma = (globalThis as any).__accountsPrismaMock;

describe("account service", () => {
  beforeEach(() => jest.clearAllMocks());

  it("normalizes only casing and whitespace", () => {
    expect(cleanAccountName("  Kotak   811 ")).toBe("Kotak 811");
    expect(normalizeAccountName("  KOTAK   811 ")).toBe("kotak 811");
    expect(normalizeAccountName("Kotak Bank")).not.toBe(normalizeAccountName("Kotak"));
    expect(normalizeAccountName("Ktoak")).not.toBe(normalizeAccountName("Kotak"));
  });

  it("stores a cleaned display name and normalized unique name", async () => {
    prisma.account.create.mockResolvedValue({ uuid: "account-1", name: "Kotak 811" });
    await expect(createAccount({ userUuid: "user-1", name: " Kotak   811 " })).resolves.toEqual({
      ok: true, data: { uuid: "account-1", name: "Kotak 811" },
    });
    expect(prisma.account.create).toHaveBeenCalledWith(expect.objectContaining({
      data: { userUuid: "user-1", name: "Kotak 811", normalizedName: "kotak 811" },
    }));
  });

  it("maps unique constraint races to conflict", async () => {
    prisma.account.create.mockRejectedValue({ code: "P2002" });
    await expect(createAccount({ userUuid: "user-1", name: "Kotak" })).resolves.toEqual({ ok: false, error: "CONFLICT" });
  });

  it("maps rename conflicts to conflict", async () => {
    prisma.account.findFirst.mockResolvedValue({ id: 1 });
    prisma.account.update.mockRejectedValue({ code: "P2002" });
    await expect(updateAccount({ userUuid: "user-1", accountUuid: "account-1", name: "HDFC" }))
      .resolves.toEqual({ ok: false, error: "CONFLICT" });
  });

  it("does not reveal whether an account belongs to another user", async () => {
    prisma.account.findFirst.mockResolvedValue(null);
    await expect(updateAccount({ userUuid: "user-1", accountUuid: "foreign", name: "Renamed" }))
      .resolves.toEqual({ ok: false, error: "NOT_FOUND" });
    await expect(resolveAccountId({ userUuid: "user-1", accountUuid: "foreign" }))
      .resolves.toEqual({ ok: false, error: "VALIDATION_ERROR" });
  });

  it("matches SMS account names only when one normalized account exists", async () => {
    prisma.account.findMany.mockResolvedValueOnce([{ uuid: "account-1" }]).mockResolvedValueOnce([]);
    await expect(matchAccountByName({ userUuid: "user-1", name: "  HDFC " }))
      .resolves.toEqual({ ok: true, data: { accountUuid: "account-1" } });
    expect(prisma.account.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { userUuid: "user-1", normalizedName: "hdfc" }, take: 2,
    }));
    await expect(matchAccountByName({ userUuid: "user-1", name: "Unknown" }))
      .resolves.toEqual({ ok: true, data: { accountUuid: null } });
  });
});
