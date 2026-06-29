import { RecipientIdentifierKind } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type {
  RecipientDetailDto,
  RecipientDetailTransactionDto,
  RecipientDto,
  RecipientListInput,
  RecipientListResult,
  RecipientLookupInput,
  ResolveRecipientInput,
} from "./types";

function toRecipientDto(record: {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  identifiers: Array<{
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  }>;
  _count: { transactions: number };
}): RecipientDto {
  return {
    id: record.id,
    uuid: record.uuid,
    displayName: record.displayName,
    normalizedName: record.normalizedName,
    transactionCount: record._count.transactions,
    identifiers: record.identifiers,
  };
}

function toRecipientDetailTransactionDto(record: {
  id: number;
  uuid: string;
  amount: { toNumber(): number };
  currency: string;
  type: string;
  source: string;
  timestamp: Date;
  categoryId: number | null;
  subcategoryId: number | null;
  category: { name: string } | null;
  subcategory: { name: string } | null;
}): RecipientDetailTransactionDto {
  return {
    id: record.id,
    uuid: record.uuid,
    amount: record.amount.toNumber(),
    currency: record.currency,
    type: record.type,
    source: record.source,
    timestamp: record.timestamp.toISOString(),
    category: record.category?.name ?? null,
    subcategory: record.subcategory?.name ?? null,
    categoryId: record.categoryId,
    subcategoryId: record.subcategoryId,
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
    id: number;
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
    timestamp: Date;
    categoryId: number | null;
    subcategoryId: number | null;
    category: { name: string } | null;
    subcategory: { name: string } | null;
  }>;
}): RecipientDetailDto {
  return {
    id: record.id,
    uuid: record.uuid,
    displayName: record.displayName,
    normalizedName: record.normalizedName,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    transactionCount: record.transactions.length,
    identifiers: record.identifiers,
    linkedTransactions: record.transactions.map(toRecipientDetailTransactionDto),
  };
}

function normalizeValue(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function detectIdentifierKind(value: string): RecipientIdentifierKind {
  const trimmed = value.trim();
  if (trimmed.includes("@")) {
    return RecipientIdentifierKind.UPI_ID;
  }

  if (/^[0-9]{10,}$/.test(trimmed.replace(/\D/g, ""))) {
    return RecipientIdentifierKind.PHONE;
  }

  if (trimmed === trimmed.toUpperCase() && trimmed.length > 4) {
    return RecipientIdentifierKind.CARD_MERCHANT;
  }

  return RecipientIdentifierKind.TEXT;
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
  if (normalizedSearch.includes("phone")) {
    kindMatches.add(RecipientIdentifierKind.PHONE);
  }
  if (normalizedSearch.includes("text")) {
    kindMatches.add(RecipientIdentifierKind.TEXT);
  }

  const where: Record<string, unknown> = { userUuid: input.userUuid };

  if (q) {
    const identifierOrFilters: Array<Record<string, unknown>> = [
      { value: { contains: q, mode: "insensitive" } },
      { normalizedValue: { contains: normalizedSearch, mode: "insensitive" } },
    ];

    if (kindMatches.size > 0) {
      identifierOrFilters.push({ kind: { in: [...kindMatches] } });
    }

    where.OR = [
      { displayName: { contains: q, mode: "insensitive" } },
      { normalizedName: { contains: normalizedSearch, mode: "insensitive" } },
      {
        identifiers: {
          some: {
            OR: identifierOrFilters,
          },
        },
      },
    ];
  }

  try {
    const total = await prisma.recipient.count({ where });
    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const recipients =
      total > 0 && page <= totalPages
        ? await prisma.recipient.findMany({
            where,
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
                : [{ displayName: sortOrder }, { id: "asc" }],
            skip,
            take: pageSize,
          })
        : [];

    return ok({
      recipients: recipients.map(toRecipientDto),
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1 && totalPages > 0,
    });
  } catch (error) {
    logger.error("listRecipients - Failed to list recipients", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getRecipient(
  input: RecipientLookupInput
): Promise<ServiceResult<RecipientDto, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const recipient = await prisma.recipient.findFirst({
      where: { id: input.recipientId, userUuid: input.userUuid },
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

    return ok(toRecipientDto(recipient));
  } catch (error) {
    logger.error("getRecipient - Failed to get recipient", error as Error, {
      userUuid: input.userUuid,
      recipientId: input.recipientId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getRecipientDetail(
  input: RecipientLookupInput
): Promise<ServiceResult<RecipientDetailDto, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const recipient = await prisma.recipient.findFirst({
      where: { id: input.recipientId, userUuid: input.userUuid },
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
            timestamp: true,
            categoryId: true,
            subcategoryId: true,
            category: {
              select: { name: true },
            },
            subcategory: {
              select: { name: true },
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
    logger.error("getRecipientDetail - Failed to get recipient detail", error as Error, {
      userUuid: input.userUuid,
      recipientId: input.recipientId,
    });
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
  const identifierKind = detectIdentifierKind(recipientRaw);

  try {
    const existingIdentifier = await prisma.recipientIdentifier.findFirst({
      where: {
        userUuid: input.userUuid,
        kind: identifierKind,
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
        kind: identifierKind,
        value: recipientRaw,
        normalizedValue: normalizedRaw,
      },
    });

    return ok({
      recipientId: recipient.id,
      displayName: recipient.displayName,
    });
  } catch (error) {
    logger.error("resolveRecipient - Failed to resolve recipient", error as Error, {
      userUuid: input.userUuid,
      recipientRaw,
    });
    return fail("INTERNAL_ERROR");
  }
}
