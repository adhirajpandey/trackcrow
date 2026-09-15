jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__recipientsPrismaMock = {
    recipient: {
      count: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    transaction: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    recipientIdentifier: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  }),
}));

import { RecipientIdentifierKind } from "@/generated/prisma-rewrite";

import { createRecipient, listRecipients, updateRecipient, resolveRecipient } from "./service";

const mockPrisma = (globalThis as any).__recipientsPrismaMock;

function recipientRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    uuid: "rcp-1",
    displayName: "Biraj Borah",
    normalizedName: "biraj borah",
    note: null,
    identifiers: [
      {
        id: 11,
        uuid: "rid-11",
        kind: RecipientIdentifierKind.UPI_ID,
        value: "biraj@oksbi",
        normalizedValue: "biraj@oksbi",
      },
    ],
    _count: { transactions: 19 },
    ...overrides,
  };
}

describe("recipient service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.transaction.groupBy.mockResolvedValue([]);
    mockPrisma.$transaction.mockImplementation(async (callback: (client: unknown) => unknown) =>
      callback(mockPrisma)
    );
  });

  it("creates a searchable recipient with a text identifier", async () => {
    mockPrisma.recipient.findFirst.mockResolvedValueOnce(null);
    mockPrisma.recipient.create.mockResolvedValueOnce({
      id: 7,
      uuid: "rcp-7",
      displayName: "Uber India",
      normalizedName: "uber india",
    });
    mockPrisma.recipientIdentifier.create.mockResolvedValueOnce({ id: 17 });

    await expect(
      createRecipient({ userUuid: "user-1", displayName: "  Uber   India  " })
    ).resolves.toEqual({
      ok: true,
      data: {
        uuid: "rcp-7",
        displayName: "Uber India",
        normalizedName: "uber india",
      },
    });
    expect(mockPrisma.recipientIdentifier.create).toHaveBeenCalledWith({
      data: {
        userUuid: "user-1",
        recipientId: 7,
        kind: RecipientIdentifierKind.TEXT,
        value: "Uber India",
        normalizedValue: "uber india",
      },
    });
  });

  it("returns the matching recipient when a normalized name already exists", async () => {
    mockPrisma.recipient.findFirst.mockResolvedValueOnce({
      uuid: "rcp-existing",
      displayName: "Uber India",
    });

    await expect(
      createRecipient({ userUuid: "user-1", displayName: " uber india " })
    ).resolves.toEqual({
      ok: false,
      error: "CONFLICT",
      details: {
        existingRecipient: {
          uuid: "rcp-existing",
          displayName: "Uber India",
        },
      },
    });
    expect(mockPrisma.recipient.create).not.toHaveBeenCalled();
  });

  it("filters by recipient and identifier fields, paginates, and sorts by display name", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ total: 2 }])
      .mockResolvedValueOnce([{ id: 1, transactionCount: 19, totalAmount: 3200 }]);
    mockPrisma.recipient.findMany.mockResolvedValueOnce([recipientRecord()]);

    const result = await listRecipients({
      userUuid: "user-1",
      page: 2,
      size: 1,
      q: "oksbi",
      sortBy: "displayName",
      sortOrder: "desc",
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        page: 2,
        pageSize: 1,
        total: 2,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      },
    });
    expect(mockPrisma.recipient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userUuid: "user-1", id: { in: [1] } } })
    );
    expect(result).toMatchObject({
      ok: true,
      data: { recipients: [{ transactionCount: 19, totalAmount: 3200 }] },
    });
  });

  it("maps alias-label searches onto supported alias types", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([{ id: 1, transactionCount: 19, totalAmount: 3200 }]);
    mockPrisma.recipient.findMany.mockResolvedValueOnce([recipientRecord()]);

    await listRecipients({
      userUuid: "user-1",
      q: "text alias",
    });

    expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
  });

  it("sorts by transaction count with deterministic fallback ordering", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ total: 3 }])
      .mockResolvedValueOnce([{ id: 2, transactionCount: 4, totalAmount: 900 }]);
    mockPrisma.recipient.findMany.mockResolvedValueOnce([
      recipientRecord({ id: 2, displayName: "Luxmi Enterprises", _count: { transactions: 4 } }),
    ]);

    await listRecipients({
      userUuid: "user-1",
      sortBy: "transactionCount",
      sortOrder: "desc",
    });

    expect(mockPrisma.recipient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userUuid: "user-1", id: { in: [2] } } })
    );
  });

  it("applies inclusive transaction-count and total-amount ranges before paging", async () => {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce([{ total: 1 }])
      .mockResolvedValueOnce([{ id: 1, transactionCount: 5, totalAmount: 1250.5 }]);
    mockPrisma.recipient.findMany.mockResolvedValueOnce([
      recipientRecord({ _count: { transactions: 5 } }),
    ]);

    const result = await listRecipients({
      userUuid: "user-1",
      minTransactionCount: 5,
      maxTransactionCount: 5,
      minTotalAmount: 1250.5,
      maxTotalAmount: 1250.5,
      sortBy: "totalAmount",
      sortOrder: "desc",
    });

    expect(result).toMatchObject({
      ok: true,
      data: {
        total: 1,
        recipients: [{ transactionCount: 5, totalAmount: 1250.5 }],
      },
    });
  });

  it("returns an empty page when the requested page exceeds total pages", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ total: 11 }]);

    const result = await listRecipients({
      userUuid: "user-1",
      page: 4,
      size: 10,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        recipients: [],
        page: 4,
        pageSize: 10,
        total: 11,
        totalPages: 2,
        hasNext: false,
        hasPrev: true,
      },
    });
    expect(mockPrisma.recipient.findMany).not.toHaveBeenCalled();
  });
});


describe("recipient notes", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockPrisma.transaction.aggregate.mockResolvedValue({ _sum: { amount: null } });
  });

  it.each([["  football turf  ", "football turf"], ["   ", null], [null, null]])(
    "saves and normalizes a note without changing matching fields: %s",
    async (note, expected) => {
      mockPrisma.recipient.findFirst
        .mockResolvedValueOnce({ id: 1 })
        .mockResolvedValueOnce(recipientRecord({ note: expected }));
      const result = await updateRecipient({ userUuid: "user-1", recipientUuid: "rcp-1", note });
      expect(result).toMatchObject({ ok: true, data: { note: expected } });
      expect(mockPrisma.recipient.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { note: expected } });
      expect(mockPrisma.recipient.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { uuid: "rcp-1", userUuid: "user-1" } }));
      expect(mockPrisma.recipientIdentifier.create).not.toHaveBeenCalled();
    }
  );

  it("preserves an omitted note when renaming", async () => {
    mockPrisma.recipient.findFirst.mockResolvedValueOnce({ id: 1 }).mockResolvedValueOnce(null)
      .mockResolvedValueOnce(recipientRecord({ note: "football turf" }));
    await updateRecipient({ userUuid: "user-1", recipientUuid: "rcp-1", displayName: "Pada Arenas" });
    expect(mockPrisma.recipient.update).toHaveBeenCalledWith({ where: { id: 1 }, data: { displayName: "Pada Arenas", normalizedName: "pada arenas" } });
  });

  it("rejects an update to a recipient outside the user scope", async () => {
    mockPrisma.recipient.findFirst.mockResolvedValueOnce(null);
    await expect(updateRecipient({ userUuid: "other-user", recipientUuid: "rcp-1", note: "test" })).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
    expect(mockPrisma.recipient.update).not.toHaveBeenCalled();
  });

  it("searches notes while retaining the user filter", async () => {
    mockPrisma.$queryRaw.mockResolvedValueOnce([{ total: 0 }]);
    await listRecipients({ userUuid: "user-1", q: "football turf" });
    const query = mockPrisma.$queryRaw.mock.calls[0][0];
    expect(query.sql).toContain('r.note ILIKE');
    expect(query.values).toContain('%football turf%');
    expect(query.values).toContain('user-1');
  });

  it("resolves using identifiers and normalized names without querying notes", async () => {
    mockPrisma.recipientIdentifier.findFirst.mockResolvedValueOnce(null);
    mockPrisma.recipient.findFirst.mockResolvedValueOnce(recipientRecord({ note: "football turf" }));
    await resolveRecipient({ userUuid: "user-1", recipientRaw: "Biraj Borah" });
    expect(mockPrisma.recipient.findFirst).toHaveBeenCalledWith({ where: { userUuid: "user-1", normalizedName: "biraj borah" } });
    expect(mockPrisma.recipientIdentifier.findFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { userUuid: "user-1", kind: RecipientIdentifierKind.TEXT, normalizedValue: "biraj borah" } }));
  });
});
