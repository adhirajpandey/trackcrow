import { Prisma, RecipientIdentifierKind } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type {
  RecipientDetailDto,
  RecipientDetailTransactionDto,
  RecipientDto,
  RecipientAliasTransferImpact,
  RecipientAliasWriteInput,
  RecipientAliasWriteResult,
  RecipientListInput,
  RecipientListResult,
  RecipientLookupInput,
  RecipientUpdateInput,
  RecipientUpdateResult,
  ResolveRecipientInput,
} from "./types";

type RecipientAggregateSortRow = {
  id: number;
  totalAmount: Prisma.Decimal | number | string | null;
};

function toRecipientDto(record: {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  totalAmount: number;
  identifiers: Array<{
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  }>;
  _count: { transactions: number };
}): RecipientDto {
  return {
    uuid: record.uuid,
    displayName: record.displayName,
    normalizedName: record.normalizedName,
    transactionCount: record._count.transactions,
    totalAmount: record.totalAmount,
    aliases: record.identifiers.map(toAliasDto),
  };
}

function toRecipientDetailTransactionDto(record: {
  id: number;
  uuid: string;
  amount: { toNumber(): number };
  currency: string;
  type: string;
  source: string;
  recipientRaw: string;
  recipientName: string | null;
  timestamp: Date;
  categoryId: number | null;
  subcategoryId: number | null;
  category: { uuid: string; name: string } | null;
  subcategory: { uuid: string; name: string } | null;
}): RecipientDetailTransactionDto {
  return {
    uuid: record.uuid,
    amount: record.amount.toNumber(),
    currency: record.currency,
    type: record.type,
    source: record.source,
    recipientRaw: record.recipientRaw,
    recipientName: record.recipientName,
    timestamp: record.timestamp.toISOString(),
    category: record.category?.name ?? null,
    subcategory: record.subcategory?.name ?? null,
    categoryUuid: record.category?.uuid ?? null,
    subcategoryUuid: record.subcategory?.uuid ?? null,
  };
}

function toRecipientDetailDto(record: {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  createdAt: Date;
  updatedAt: Date;
  identifiers: Array<{
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  }>;
  transactions: Array<{
    id: number;
    uuid: string;
    amount: { toNumber(): number };
    currency: string;
    type: string;
    source: string;
    recipientRaw: string;
    recipientName: string | null;
    timestamp: Date;
    categoryId: number | null;
    subcategoryId: number | null;
    category: { uuid: string; name: string } | null;
    subcategory: { uuid: string; name: string } | null;
  }>;
}): RecipientDetailDto {
  return {
    uuid: record.uuid,
    displayName: record.displayName,
    normalizedName: record.normalizedName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    transactionCount: record.transactions.length,
    aliases: record.identifiers.map(toAliasDto),
    linkedTransactions: record.transactions.map(toRecipientDetailTransactionDto),
  };
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function buildNonEmptyRecipientWhere(userUuid: string) {
  return {
    userUuid,
    OR: [
      { identifiers: { some: {} } },
      { transactions: { some: {} } },
    ],
  };
}

function detectAliasType(value: string): RecipientIdentifierKind {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    return RecipientIdentifierKind.UPI_ID;
  }

  if (trimmed === trimmed.toUpperCase() && trimmed.length > 4) {
    return RecipientIdentifierKind.CARD_MERCHANT;
  }

  return RecipientIdentifierKind.TEXT;
}

function toAliasDto(identifier: {
  uuid: string;
  kind: string;
  value: string;
  normalizedValue: string;
}) {
  return {
    uuid: identifier.uuid,
    aliasType: identifier.kind,
    value: identifier.value,
    normalizedValue: identifier.normalizedValue,
  };
}

function transactionMatchesAlias(
  transaction: { recipientRaw: string; recipientName: string | null },
  normalizedValue: string
) {
  return (
    normalizeValue(transaction.recipientRaw) === normalizedValue ||
    (transaction.recipientName ? normalizeValue(transaction.recipientName) === normalizedValue : false)
  );
}

async function buildAliasTransferImpact(input: {
  userUuid: string;
  targetRecipient: { id: number; uuid: string; displayName: string };
  sourceRecipient: { id: number; uuid: string; displayName: string };
  alias: {
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  };
}): Promise<RecipientAliasTransferImpact> {
  const transactions = await prisma.transaction.findMany({
    where: {
      userUuid: input.userUuid,
      recipientId: input.sourceRecipient.id,
    },
    select: {
      amount: true,
      recipientRaw: true,
      recipientName: true,
    },
  });
  const matchingTransactions = transactions.filter((transaction) =>
    transactionMatchesAlias(transaction, input.alias.normalizedValue)
  );
  const totalAmount = matchingTransactions.reduce(
    (sum, transaction) => sum + transaction.amount.toNumber(),
    0
  );

  return {
    sourceRecipient: {
      uuid: input.sourceRecipient.uuid,
      displayName: input.sourceRecipient.displayName,
    },
    targetRecipient: {
      uuid: input.targetRecipient.uuid,
      displayName: input.targetRecipient.displayName,
    },
    alias: toAliasDto(input.alias),
    transactionCount: matchingTransactions.length,
    totalAmount,
  };
}

export async function listRecipients(
  input: RecipientListInput
): Promise<RecipientListResult> {
  const page = input.page ? Math.max(1, Math.floor(input.page)) : 1;
  const pageSize = input.size ? Math.max(1, Math.min(100, Math.floor(input.size))) : 20;
  const skip = (page - 1) * pageSize;
  const q = input.q?.trim() ?? "";
  const sortBy = input.sortBy ?? "displayName";
  const sortOrder = input.sortOrder === "desc" ? "desc" : "asc";

  const normalizedSearch = normalizeValue(q);
  const kindMatches = new Set<RecipientIdentifierKind>();
  if (normalizedSearch.includes("upi")) {
    kindMatches.add(RecipientIdentifierKind.UPI_ID);
  }
  if (normalizedSearch.includes("card")) {
    kindMatches.add(RecipientIdentifierKind.CARD_MERCHANT);
  }
  if (normalizedSearch.includes("text") || normalizedSearch.includes("alias")) {
    kindMatches.add(RecipientIdentifierKind.TEXT);
  }

  const where: Record<string, unknown> = {
    AND: [buildNonEmptyRecipientWhere(input.userUuid)],
  };

  if (q) {
    const identifierOrFilters: Array<Record<string, unknown>> = [
      { value: { contains: q, mode: "insensitive" } },
      { normalizedValue: { contains: normalizedSearch, mode: "insensitive" } },
    ];

    if (kindMatches.size > 0) {
      identifierOrFilters.push({ kind: { in: [...kindMatches] } });
    }

    (where.AND as Array<Record<string, unknown>>).push({
      OR: [
        { displayName: { contains: q, mode: "insensitive" } },
        { normalizedName: { contains: normalizedSearch, mode: "insensitive" } },
        {
          identifiers: {
            some: {
              OR: identifierOrFilters,
            },
          },
        },
      ],
    });
  }

  try {
    const total = await prisma.recipient.count({ where });
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const aggregateSortRows =
      total > 0 && page <= totalPages && sortBy === "totalAmount"
        ? await prisma.$queryRaw<RecipientAggregateSortRow[]>(Prisma.sql`
            SELECT
              r.id,
              COALESCE(SUM(t.amount), 0) AS "totalAmount"
            FROM "recipient" r
            LEFT JOIN "transaction" t
              ON t."recipient_id" = r.id
              AND t."user_uuid" = r."user_uuid"
            WHERE
              r."user_uuid" = ${input.userUuid}
              AND (
                EXISTS (
                  SELECT 1
                  FROM "recipient_identifier" ri_non_empty
                  WHERE ri_non_empty."recipient_id" = r.id
                )
                OR EXISTS (
                  SELECT 1
                  FROM "transaction" t_non_empty
                  WHERE t_non_empty."recipient_id" = r.id
                    AND t_non_empty."user_uuid" = r."user_uuid"
                )
              )
              ${q
                ? Prisma.sql`
                    AND (
                      r."displayName" ILIKE ${`%${q}%`}
                      OR r."normalized_name" ILIKE ${`%${normalizedSearch}%`}
                      OR EXISTS (
                        SELECT 1
                        FROM "recipient_identifier" ri
                        WHERE ri."recipient_id" = r.id
                          AND (
                            ri.value ILIKE ${`%${q}%`}
                            OR ri."normalized_value" ILIKE ${`%${normalizedSearch}%`}
                            ${
                              kindMatches.size > 0
                                ? Prisma.sql`OR ri.kind IN (${Prisma.join(
                                    [...kindMatches].map((kind) => Prisma.sql`${kind}`)
                                  )})`
                                : Prisma.empty
                            }
                          )
                      )
                    )
                  `
                : Prisma.empty}
            GROUP BY r.id
            ORDER BY
              COALESCE(SUM(t.amount), 0) ${Prisma.raw(sortOrder.toUpperCase())},
              r."displayName" ASC,
              r.id ASC
            OFFSET ${skip}
            LIMIT ${pageSize}
          `)
        : [];
    const aggregateTotalsByRecipientId = new Map(
      aggregateSortRows.map((row) => [row.id, Number(row.totalAmount ?? 0)])
    );
    const aggregateSortedRecipientIds = aggregateSortRows.map((row) => row.id);
    const recipients =
      total > 0 && page <= totalPages
        ? await prisma.recipient.findMany({
            where:
              sortBy === "totalAmount"
                ? {
                    ...buildNonEmptyRecipientWhere(input.userUuid),
                    id: { in: aggregateSortedRecipientIds },
                  }
                : where,
            include: {
              identifiers: {
                orderBy: { createdAt: "asc" },
                select: {
                  id: true,
                  uuid: true,
                  kind: true,
                  value: true,
                  normalizedValue: true,
                },
              },
              _count: {
                select: { transactions: true },
              },
            },
            orderBy:
              sortBy === "transactionCount"
                ? [
                    { transactions: { _count: sortOrder } },
                    { displayName: "asc" },
                    { id: "asc" },
                  ]
                : sortBy === "displayName"
                  ? [{ displayName: sortOrder }, { id: "asc" }]
                  : undefined,
            skip: sortBy === "totalAmount" ? undefined : skip,
            take: sortBy === "totalAmount" ? undefined : pageSize,
          })
        : [];
    const orderedRecipients =
      sortBy === "totalAmount"
        ? aggregateSortedRecipientIds
            .map((recipientId) =>
              recipients.find((recipient) => recipient.id === recipientId)
            )
            .filter((recipient): recipient is (typeof recipients)[number] => Boolean(recipient))
        : recipients;

    const totals =
      orderedRecipients.length > 0 && sortBy !== "totalAmount"
        ? await prisma.transaction.groupBy({
            by: ["recipientId"],
            where: {
              userUuid: input.userUuid,
              recipientId: {
                in: orderedRecipients.map((recipient) => recipient.id),
              },
            },
            _sum: {
              amount: true,
            },
          })
        : [];
    const totalsByRecipientId = new Map(
      totals.map((row) => [row.recipientId, row._sum.amount?.toNumber() ?? 0])
    );

    return ok({
      recipients: orderedRecipients.map((recipient) =>
        toRecipientDto({
          ...recipient,
          totalAmount:
            aggregateTotalsByRecipientId.get(recipient.id) ??
            totalsByRecipientId.get(recipient.id) ??
            0,
        })
      ),
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1 && totalPages > 0,
    });
  } catch (error) {
    logger.error(
      {
        event: "recipient.list.db_failed",
        userId: input.userUuid,
        message: "Failed to list recipients",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function getRecipient(
  input: RecipientLookupInput
): Promise<ServiceResult<RecipientDto, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const recipient = await prisma.recipient.findFirst({
      where: { uuid: input.recipientUuid, userUuid: input.userUuid },
      include: {
        identifiers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            uuid: true,
            kind: true,
            value: true,
            normalizedValue: true,
          },
        },
        _count: {
          select: { transactions: true },
        },
      },
    });

    if (!recipient) {
      return fail("NOT_FOUND");
    }

    const totals = await prisma.transaction.aggregate({
      where: {
        userUuid: input.userUuid,
        recipientId: recipient.id,
      },
      _sum: {
        amount: true,
      },
    });

    return ok(
      toRecipientDto({
        ...recipient,
        totalAmount: totals._sum.amount?.toNumber() ?? 0,
      })
    );
  } catch (error) {
    logger.error(
      {
        event: "recipient.read.db_failed",
        userId: input.userUuid,
        recipientUuid: input.recipientUuid,
        message: "Failed to get recipient",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function getRecipientDetail(
  input: RecipientLookupInput
): Promise<ServiceResult<RecipientDetailDto, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const recipient = await prisma.recipient.findFirst({
      where: { uuid: input.recipientUuid, userUuid: input.userUuid },
      include: {
        identifiers: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            uuid: true,
            kind: true,
            value: true,
            normalizedValue: true,
          },
        },
        transactions: {
          orderBy: { timestamp: "desc" },
          select: {
            id: true,
            uuid: true,
            amount: true,
            currency: true,
            type: true,
            source: true,
            recipientRaw: true,
            recipientName: true,
            timestamp: true,
            categoryId: true,
            subcategoryId: true,
            category: {
              select: { uuid: true, name: true },
            },
            subcategory: {
              select: { uuid: true, name: true },
            },
          },
        },
      },
    });

    if (!recipient) {
      return fail("NOT_FOUND");
    }

    return ok(toRecipientDetailDto(recipient));
  } catch (error) {
    logger.error(
      {
        event: "recipient.detail.db_failed",
        userId: input.userUuid,
        recipientUuid: input.recipientUuid,
        message: "Failed to get recipient detail",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function updateRecipient(
  input: RecipientUpdateInput
): Promise<RecipientUpdateResult> {
  const displayName = input.displayName.trim();
  const normalizedName = normalizeValue(displayName);

  try {
    const existing = await prisma.recipient.findFirst({
      where: { uuid: input.recipientUuid, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    const duplicate = await prisma.recipient.findFirst({
      where: {
        userUuid: input.userUuid,
        normalizedName,
        id: { not: existing.id },
      },
      select: { id: true },
    });
    if (duplicate) {
      return fail("CONFLICT");
    }

    await prisma.recipient.update({
      where: { id: existing.id },
      data: { displayName, normalizedName },
    });

    return getRecipient(input);
  } catch (error) {
    logger.error(
      {
        event: "recipient.update.db_failed",
        userId: input.userUuid,
        recipientUuid: input.recipientUuid,
        message: "Failed to update recipient",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function addRecipientAlias(
  input: RecipientAliasWriteInput
): Promise<RecipientAliasWriteResult> {
  const value = input.value.trim();
  const normalizedValue = normalizeValue(value);
  const kind =
    input.aliasType && input.aliasType !== "AUTO" ? input.aliasType : detectAliasType(value);

  try {
    const targetRecipient = await prisma.recipient.findFirst({
      where: { uuid: input.recipientUuid, userUuid: input.userUuid },
      select: { id: true, uuid: true, displayName: true },
    });
    if (!targetRecipient) {
      return fail("NOT_FOUND");
    }

    const existingIdentifier = await prisma.recipientIdentifier.findFirst({
      where: {
        userUuid: input.userUuid,
        kind,
        normalizedValue,
      },
      include: {
        recipient: {
          select: { id: true, uuid: true, displayName: true },
        },
      },
    });

    if (!existingIdentifier) {
      const created = await prisma.recipientIdentifier.create({
        data: {
          userUuid: input.userUuid,
          recipientId: targetRecipient.id,
          kind,
          value,
          normalizedValue,
        },
        select: {
          id: true,
          uuid: true,
          kind: true,
          value: true,
          normalizedValue: true,
        },
      });

      logger.info({
        event: "recipient.alias_added",
        userId: input.userUuid,
        recipientId: targetRecipient.id,
        aliasType: kind,
        status: "created",
      });

      return ok({
        status: "created",
        alias: toAliasDto(created),
        movedTransactionCount: 0,
        movedTransactionTotalAmount: 0,
        deletedSourceRecipient: false,
      });
    }

    if (existingIdentifier.recipientId === targetRecipient.id) {
      return ok({
        status: "already_linked",
        alias: toAliasDto(existingIdentifier),
        movedTransactionCount: 0,
        movedTransactionTotalAmount: 0,
        deletedSourceRecipient: false,
      });
    }

    const sourceRecipient = {
      id: existingIdentifier.recipient.id,
      uuid: existingIdentifier.recipient.uuid,
      displayName: existingIdentifier.recipient.displayName,
    };
    const impact = await buildAliasTransferImpact({
      userUuid: input.userUuid,
      targetRecipient,
      sourceRecipient,
      alias: existingIdentifier,
    });

    if (!input.transfer) {
      return fail("CONFLICT", impact);
    }

    const sourceTransactions = await prisma.transaction.findMany({
      where: {
        userUuid: input.userUuid,
        recipientId: sourceRecipient.id,
      },
      select: {
        id: true,
        amount: true,
        recipientRaw: true,
        recipientName: true,
      },
    });
    const matchingTransactions = sourceTransactions.filter((transaction) =>
      transactionMatchesAlias(transaction, normalizedValue)
    );
    const matchingTransactionIds = matchingTransactions.map((transaction) => transaction.id);
    const movedTransactionTotalAmount = matchingTransactions.reduce(
      (sum, transaction) => sum + transaction.amount.toNumber(),
      0
    );

    const moveResult = await prisma.$transaction(async (tx) => {
      const updatedIdentifier = await tx.recipientIdentifier.update({
        where: { id: existingIdentifier.id },
        data: { recipientId: targetRecipient.id },
        select: {
          id: true,
          uuid: true,
          kind: true,
          value: true,
          normalizedValue: true,
        },
      });

      if (matchingTransactionIds.length > 0) {
        await tx.transaction.updateMany({
          where: {
            userUuid: input.userUuid,
            recipientId: sourceRecipient.id,
            id: { in: matchingTransactionIds },
          },
          data: { recipientId: targetRecipient.id },
        });
      }

      const [remainingIdentifiers, remainingTransactions] = await Promise.all([
        tx.recipientIdentifier.count({
          where: {
            userUuid: input.userUuid,
            recipientId: sourceRecipient.id,
          },
        }),
        tx.transaction.count({
          where: {
            userUuid: input.userUuid,
            recipientId: sourceRecipient.id,
          },
        }),
      ]);
      const deletedSourceRecipient =
        remainingIdentifiers === 0 && remainingTransactions === 0;

      if (deletedSourceRecipient) {
        await tx.recipient.delete({
          where: { id: sourceRecipient.id },
        });
      }

      return {
        identifier: updatedIdentifier,
        deletedSourceRecipient,
      };
    });

    logger.info({
      event: "recipient.alias_added",
      userId: input.userUuid,
      recipientId: targetRecipient.id,
      aliasType: kind,
      status: "moved",
      movedTransactionCount: matchingTransactionIds.length,
    });

    return ok({
      status: "moved",
      alias: toAliasDto(moveResult.identifier),
      movedTransactionCount: matchingTransactionIds.length,
      movedTransactionTotalAmount,
      deletedSourceRecipient: moveResult.deletedSourceRecipient,
    });
  } catch (error) {
    logger.error(
      {
        event: "recipient.alias_add.db_failed",
        userId: input.userUuid,
        recipientUuid: input.recipientUuid,
        aliasType: kind,
        message: "Failed to add recipient alias",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function resolveRecipient(
  input: ResolveRecipientInput
): Promise<
  ServiceResult<
    {
      recipientId: number;
      displayName: string;
    },
    "INTERNAL_ERROR"
  >
> {
  const recipientRaw = input.recipientRaw.trim();
  const normalizedRaw = normalizeValue(recipientRaw);
  const displayName = (input.recipientName?.trim() || recipientRaw).trim();
  const normalizedName = normalizeValue(displayName);
  const aliasType = detectAliasType(recipientRaw);

  try {
    const existingIdentifier = await prisma.recipientIdentifier.findFirst({
      where: {
        userUuid: input.userUuid,
        kind: aliasType,
        normalizedValue: normalizedRaw,
      },
      include: {
        recipient: true,
      },
    });

    if (existingIdentifier) {
      return ok({
        recipientId: existingIdentifier.recipientId,
        displayName: existingIdentifier.recipient.displayName,
      });
    }

    const existingRecipient = await prisma.recipient.findFirst({
      where: {
        userUuid: input.userUuid,
        normalizedName,
      },
    });

    const recipient =
      existingRecipient ??
      (await prisma.recipient.create({
        data: {
          userUuid: input.userUuid,
          displayName,
          normalizedName,
        },
      }));

    await prisma.recipientIdentifier.create({
      data: {
        userUuid: input.userUuid,
        recipientId: recipient.id,
        kind: aliasType,
        value: recipientRaw,
        normalizedValue: normalizedRaw,
      },
    });

    return ok({
      recipientId: recipient.id,
      displayName: recipient.displayName,
    });
  } catch (error) {
    logger.error(
      {
        event: "recipient.resolve.db_failed",
        userId: input.userUuid,
        message: "Failed to resolve recipient",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}
