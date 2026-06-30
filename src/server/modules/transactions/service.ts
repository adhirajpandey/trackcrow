import { TransactionSource, TransactionType } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { resolveRecipient } from "@/server/modules/recipients/service";
import { fail, ok } from "@/server/shared/result";

import type {
  ListTransactionsInput,
  TransactionCategoryUpdateInput,
  TransactionCategoryUpdateResult,
  TransactionCreateResult,
  TransactionDeleteResult,
  TransactionDto,
  TransactionGetResult,
  TransactionListRangeInput,
  TransactionListResult,
  TransactionLookupInput,
  TransactionSuggestResult,
  TransactionUpdateInput,
  TransactionUpdateResult,
  TransactionWriteInput,
} from "./types";

type TransactionRecord = {
  id: number;
  uuid: string;
  userUuid: string;
  amount: { toNumber(): number };
  currency: string;
  type: TransactionType;
  source: TransactionSource;
  recipientId: number;
  recipientRaw: string;
  recipientName: string | null;
  reference: string | null;
  accountLabel: string | null;
  remarks: string | null;
  locationRaw: string | null;
  timestamp: Date;
  createdAt: Date;
  updatedAt: Date;
  categoryId: number | null;
  subcategoryId: number | null;
  recipient: {
    displayName: string;
  };
  category: { name: string } | null;
  subcategory: { name: string } | null;
};

function toTransactionDto(record: TransactionRecord): TransactionDto {
  return {
    id: record.id,
    uuid: record.uuid,
    userUuid: record.userUuid,
    amount: record.amount.toNumber(),
    currency: record.currency,
    type: record.type,
    source: record.source,
    recipientId: record.recipientId,
    recipientRaw: record.recipientRaw,
    recipientName: record.recipientName,
    recipientDisplayName: record.recipient.displayName,
    reference: record.reference,
    accountLabel: record.accountLabel,
    remarks: record.remarks,
    locationRaw: record.locationRaw,
    timestamp: record.timestamp.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
    category: record.category?.name ?? null,
    subcategory: record.subcategory?.name ?? null,
    categoryId: record.categoryId,
    subcategoryId: record.subcategoryId,
  };
}

async function ensureOwnedCategory(
  userUuid: string,
  categoryId: number | null | undefined
): Promise<boolean> {
  if (categoryId == null) {
    return true;
  }

  const category = await prisma.category.findFirst({
    where: { id: categoryId, userUuid },
    select: { id: true },
  });

  return Boolean(category);
}

async function ensureOwnedSubcategory(
  userUuid: string,
  categoryId: number | null | undefined,
  subcategoryId: number | null | undefined
): Promise<boolean> {
  if (subcategoryId == null) {
    return true;
  }

  const subcategory = await prisma.subcategory.findFirst({
    where: {
      id: subcategoryId,
      userUuid,
      ...(categoryId == null ? {} : { categoryId }),
    },
    select: { id: true },
  });

  return Boolean(subcategory);
}

async function getOwnedTransaction(userUuid: string, transactionId: number) {
  return prisma.transaction.findFirst({
    where: { id: transactionId, userUuid },
    include: {
      recipient: {
        select: { displayName: true },
      },
      category: {
        select: { name: true },
      },
      subcategory: {
        select: { name: true },
      },
    },
  });
}

export async function listTransactions(
  input: ListTransactionsInput
): Promise<TransactionListResult> {
  const page = input.page ? Math.max(1, Math.floor(input.page)) : 1;
  const pageSize = input.size ? Math.max(1, Math.min(100, Math.floor(input.size))) : 20;
  const skip = (page - 1) * pageSize;
  const q = input.q?.trim() ?? "";
  const sortBy = input.sortBy;
  const sortOrder = input.sortOrder === "asc" ? "asc" : "desc";
  const categoryFilters = input.categories ?? [];

  const where: Record<string, unknown> = { userUuid: input.userUuid };
  const andFilters: Array<Record<string, unknown>> = [];

  if (q) {
    const amount = Number(q.replace(/[^0-9.-]/g, ""));
    andFilters.push({
      OR: [
        { recipientRaw: { contains: q, mode: "insensitive" } },
        { recipientName: { contains: q, mode: "insensitive" } },
        { remarks: { contains: q, mode: "insensitive" } },
        { recipient: { displayName: { contains: q, mode: "insensitive" } } },
        ...(Number.isFinite(amount) ? [{ amount }] : []),
      ],
    });
  }

  if (categoryFilters.length > 0) {
    const includeUncategorized = categoryFilters.some(
      (value) => value.toLowerCase() === "uncategorized"
    );
    const namedCategories = categoryFilters.filter(
      (value) => value.toLowerCase() !== "uncategorized"
    );
    const categoryOrs: Array<Record<string, unknown>> = [];
    if (namedCategories.length > 0) {
      categoryOrs.push({ category: { name: { in: namedCategories } } });
    }
    if (includeUncategorized) {
      categoryOrs.push({ categoryId: null });
    }
    if (categoryOrs.length > 0) {
      andFilters.push({ OR: categoryOrs });
    }
  }

  if (input.startDate || input.endDate) {
    andFilters.push({
      timestamp: {
        ...(input.startDate ? { gte: input.startDate } : {}),
        ...(input.endDate ? { lte: input.endDate } : {}),
      },
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  try {
    const [firstTxn, lastTxn, total] = await Promise.all([
      prisma.transaction.findFirst({
        where: { userUuid: input.userUuid },
        orderBy: { timestamp: "asc" },
        select: { timestamp: true },
      }),
      prisma.transaction.findFirst({
        where: { userUuid: input.userUuid },
        orderBy: { timestamp: "desc" },
        select: { timestamp: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
    const records =
      total > 0 && page <= totalPages
        ? await prisma.transaction.findMany({
            where,
            orderBy:
              sortBy === "amount"
                ? { amount: sortOrder }
                : { timestamp: sortOrder },
            include: {
              recipient: { select: { displayName: true } },
              category: { select: { name: true } },
              subcategory: { select: { name: true } },
            },
            skip,
            take: pageSize,
          })
        : [];

    return ok({
      transactions: records.map((record) =>
        toTransactionDto(record as unknown as TransactionRecord)
      ),
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      firstTxnDate: firstTxn?.timestamp.toISOString() ?? null,
      lastTxnDate: lastTxn?.timestamp.toISOString() ?? null,
    });
  } catch (error) {
    logger.error("listTransactions - Failed to list transactions", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getTransactionById(
  input: TransactionLookupInput
): Promise<TransactionGetResult> {
  try {
    const transaction = await getOwnedTransaction(input.userUuid, input.transactionId);
    if (!transaction) {
      return fail("NOT_FOUND");
    }

    return ok(toTransactionDto(transaction as unknown as TransactionRecord));
  } catch (error) {
    logger.error("getTransactionById - Failed to load transaction", error as Error, {
      userUuid: input.userUuid,
      transactionId: input.transactionId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function listTransactionsForRange(
  input: TransactionListRangeInput
) {
  try {
    const records = await prisma.transaction.findMany({
      where: {
        userUuid: input.userUuid,
        ...(input.startDate || input.endDate
          ? {
              timestamp: {
                ...(input.startDate ? { gte: input.startDate } : {}),
                ...(input.endDate ? { lt: input.endDate } : {}),
              },
            }
          : {}),
      },
      include: {
        recipient: { select: { displayName: true } },
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    return ok(
      records.map((record) => toTransactionDto(record as unknown as TransactionRecord))
    );
  } catch (error) {
    logger.error("listTransactionsForRange - Failed to load transactions", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function createTransaction(
  input: TransactionWriteInput
): Promise<TransactionCreateResult> {
  try {
    const hasCategory = await ensureOwnedCategory(input.userUuid, input.categoryId);
    if (!hasCategory) {
      return fail("VALIDATION_ERROR", [{ path: ["categoryId"], message: "Unknown category" }]);
    }

    const hasSubcategory = await ensureOwnedSubcategory(
      input.userUuid,
      input.categoryId,
      input.subcategoryId
    );
    if (!hasSubcategory) {
      return fail("VALIDATION_ERROR", [
        { path: ["subcategoryId"], message: "Unknown subcategory" },
      ]);
    }

    const recipientResult = await resolveRecipient({
      userUuid: input.userUuid,
      recipientRaw: input.recipientRaw,
      recipientName: input.recipientName,
    });
    if (!recipientResult.ok) {
      return recipientResult;
    }

    const created = await prisma.transaction.create({
      data: {
        userUuid: input.userUuid,
        recipientId: recipientResult.data.recipientId,
        categoryId: input.categoryId ?? null,
        subcategoryId: input.subcategoryId ?? null,
        amount: input.amount,
        currency: "INR",
        type: input.type,
        source: input.source,
        recipientRaw: input.recipientRaw.trim(),
        recipientName: input.recipientName?.trim() || null,
        reference: input.reference?.trim() || null,
        accountLabel: input.accountLabel?.trim() || null,
        remarks: input.remarks?.trim() || null,
        locationRaw: input.locationRaw?.trim() || null,
        timestamp: input.timestamp,
      },
      select: {
        id: true,
        uuid: true,
      },
    });

    return ok(created);
  } catch (error) {
    logger.error("createTransaction - Failed to create transaction", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function updateTransaction(
  input: TransactionUpdateInput
): Promise<TransactionUpdateResult> {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: input.transactionId, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    const hasCategory = await ensureOwnedCategory(input.userUuid, input.categoryId);
    if (!hasCategory) {
      return fail("VALIDATION_ERROR", [{ path: ["categoryId"], message: "Unknown category" }]);
    }

    const hasSubcategory = await ensureOwnedSubcategory(
      input.userUuid,
      input.categoryId,
      input.subcategoryId
    );
    if (!hasSubcategory) {
      return fail("VALIDATION_ERROR", [
        { path: ["subcategoryId"], message: "Unknown subcategory" },
      ]);
    }

    const recipientResult = await resolveRecipient({
      userUuid: input.userUuid,
      recipientRaw: input.recipientRaw,
      recipientName: input.recipientName,
    });
    if (!recipientResult.ok) {
      return recipientResult;
    }

    await prisma.transaction.update({
      where: { id: input.transactionId },
      data: {
        recipientId: recipientResult.data.recipientId,
        categoryId: input.categoryId ?? null,
        subcategoryId: input.subcategoryId ?? null,
        amount: input.amount,
        type: input.type,
        recipientRaw: input.recipientRaw.trim(),
        recipientName: input.recipientName?.trim() || null,
        reference: input.reference?.trim() || null,
        accountLabel: input.accountLabel?.trim() || null,
        remarks: input.remarks?.trim() || null,
        locationRaw: input.locationRaw?.trim() || null,
        timestamp: input.timestamp,
      },
    });

    return ok({ id: input.transactionId });
  } catch (error) {
    logger.error("updateTransaction - Failed to update transaction", error as Error, {
      userUuid: input.userUuid,
      transactionId: input.transactionId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function updateTransactionCategory(
  input: TransactionCategoryUpdateInput
): Promise<TransactionCategoryUpdateResult> {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: input.transactionId, userUuid: input.userUuid },
      select: { id: true, categoryId: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    const hasCategory = await ensureOwnedCategory(input.userUuid, input.categoryId);
    if (!hasCategory) {
      return fail("VALIDATION_ERROR", [{ path: ["categoryId"], message: "Unknown category" }]);
    }

    const hasSubcategory = await ensureOwnedSubcategory(
      input.userUuid,
      input.categoryId,
      input.subcategoryId
    );
    if (!hasSubcategory) {
      return fail("VALIDATION_ERROR", [
        { path: ["subcategoryId"], message: "Unknown subcategory" },
      ]);
    }

    const updated = await prisma.transaction.update({
      where: { id: input.transactionId },
      data: {
        categoryId: input.categoryId,
        subcategoryId:
          input.categoryId == null
            ? null
            : input.subcategoryId !== undefined
              ? input.subcategoryId
              : existing.categoryId !== input.categoryId
                ? null
                : undefined,
      },
      include: {
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
      },
    });

    return ok({
      id: updated.id,
      categoryId: updated.categoryId,
      category: updated.category?.name ?? null,
      subcategoryId: updated.subcategoryId,
      subcategory: updated.subcategory?.name ?? null,
    });
  } catch (error) {
    logger.error("updateTransactionCategory - Failed to update transaction category", error as Error, {
      userUuid: input.userUuid,
      transactionId: input.transactionId,
      categoryId: input.categoryId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function deleteTransaction(
  input: TransactionLookupInput
): Promise<TransactionDeleteResult> {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: input.transactionId, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.transaction.delete({ where: { id: input.transactionId } });
    return ok({ id: input.transactionId });
  } catch (error) {
    logger.error("deleteTransaction - Failed to delete transaction", error as Error, {
      userUuid: input.userUuid,
      transactionId: input.transactionId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function suggestTransactionCategory(
  input: TransactionLookupInput
): Promise<TransactionSuggestResult> {
  try {
    const current = await prisma.transaction.findFirst({
      where: { id: input.transactionId, userUuid: input.userUuid },
      select: { id: true, recipientId: true },
    });
    if (!current) {
      return fail("NOT_FOUND");
    }

    const matches = await prisma.transaction.findMany({
      where: {
        userUuid: input.userUuid,
        recipientId: current.recipientId,
        id: { not: input.transactionId },
        categoryId: { not: null },
      },
      include: {
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    const categoryCounts = new Map<string, number>();
    const subcategoryCounts = new Map<string, number>();
    for (const transaction of matches) {
      if (transaction.category?.name) {
        categoryCounts.set(
          transaction.category.name,
          (categoryCounts.get(transaction.category.name) ?? 0) + 1
        );
      }
      if (transaction.subcategory?.name) {
        subcategoryCounts.set(
          transaction.subcategory.name,
          (subcategoryCounts.get(transaction.subcategory.name) ?? 0) + 1
        );
      }
    }

    const suggestedCategory =
      [...categoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
      null;
    const suggestedSubCategory =
      [...subcategoryCounts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] ??
      null;

    return ok({ suggestedCategory, suggestedSubCategory });
  } catch (error) {
    logger.error("suggestTransactionCategory - Failed to build suggestion", error as Error, {
      userUuid: input.userUuid,
      transactionId: input.transactionId,
    });
    return fail("INTERNAL_ERROR");
  }
}
