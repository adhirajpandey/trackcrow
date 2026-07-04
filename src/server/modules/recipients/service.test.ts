jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__recipientsPrismaMock = {
    recipient: {
      count: jest.fn(),
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
    transaction: {
      groupBy: jest.fn(),
    },
    recipientIdentifier: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  }),
}));

import { RecipientIdentifierKind } from "@/generated/prisma-rewrite";

import { listRecipients } from "./service";

const mockPrisma = (globalThis as any).__recipientsPrismaMock;

function recipientRecord(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    uuid: "rcp-1",
    displayName: "Biraj Borah",
    normalizedName: "biraj borah",
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
  });

  it("filters by recipient and identifier fields, paginates, and sorts by display name", async () => {
    mockPrisma.recipient.count.mockResolvedValueOnce(2);
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
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              userUuid: "user-1",
              OR: expect.arrayContaining([
                { identifiers: { some: {} } },
                { transactions: { some: {} } },
              ]),
            }),
            expect.objectContaining({
              OR: expect.arrayContaining([
                { displayName: { contains: "oksbi", mode: "insensitive" } },
                { normalizedName: { contains: "oksbi", mode: "insensitive" } },
                {
                  identifiers: {
                    some: {
                      OR: expect.arrayContaining([
                        { value: { contains: "oksbi", mode: "insensitive" } },
                        { normalizedValue: { contains: "oksbi", mode: "insensitive" } },
                      ]),
                    },
                  },
                },
              ]),
            }),
          ]),
        }),
        orderBy: [{ displayName: "desc" }, { id: "asc" }],
        skip: 1,
        take: 1,
      })
    );
  });

  it("maps alias-label searches onto supported alias types", async () => {
    mockPrisma.recipient.count.mockResolvedValueOnce(1);
    mockPrisma.recipient.findMany.mockResolvedValueOnce([recipientRecord()]);

    await listRecipients({
      userUuid: "user-1",
      q: "text alias",
    });

    expect(mockPrisma.recipient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          AND: expect.arrayContaining([
            expect.objectContaining({
              userUuid: "user-1",
              OR: expect.arrayContaining([
                { identifiers: { some: {} } },
                { transactions: { some: {} } },
              ]),
            }),
            expect.objectContaining({
              OR: expect.arrayContaining([
                {
                  identifiers: {
                    some: {
                      OR: expect.arrayContaining([
                        { kind: { in: [RecipientIdentifierKind.TEXT] } },
                      ]),
                    },
                  },
                },
              ]),
            }),
          ]),
        }),
      })
    );
  });

  it("sorts by transaction count with deterministic fallback ordering", async () => {
    mockPrisma.recipient.count.mockResolvedValueOnce(3);
    mockPrisma.recipient.findMany.mockResolvedValueOnce([
      recipientRecord({ id: 2, displayName: "Luxmi Enterprises", _count: { transactions: 4 } }),
    ]);

    await listRecipients({
      userUuid: "user-1",
      sortBy: "transactionCount",
      sortOrder: "desc",
    });

    expect(mockPrisma.recipient.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [
          { transactions: { _count: "desc" } },
          { displayName: "asc" },
          { id: "asc" },
        ],
      })
    );
  });

  it("returns an empty page when the requested page exceeds total pages", async () => {
    mockPrisma.recipient.count.mockResolvedValueOnce(11);

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
