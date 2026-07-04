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
    uuid: string;
    displayName: string;
  };
  category: { uuid: string; name: string } | null;
  subcategory: { uuid: string; name: string } | null;
};

type ResolvedCategorySelection = {
  categoryId: number | null;
  subcategoryId: number | null;
};

function toTransactionDto(record: TransactionRecord): TransactionDto {
  return {
    uuid: record.uuid,
    userUuid: record.userUuid,
    amount: record.amount.toNumber(),
    currency: record.currency,
    type: record.type,
    source: record.source,
    recipientUuid: record.recipient.uuid,
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
    categoryUuid: record.category?.uuid ?? null,
    subcategoryUuid: record.subcategory?.uuid ?? null,
  };
}

async function resolveCategorySelection(input: {
  userUuid: string;
  categoryUuid?: string | null;
  subcategoryUuid?: string | null;
}): Promise<
  | { ok: true; data: ResolvedCategorySelection }
  | {
      ok: false;
      details: Array<{ path: string[]; message: string }>;
    }
> {
  if (input.categoryUuid == null) {
    if (input.subcategoryUuid != null) {
      return {
        ok: false,
        details: [
          {
            path: ["categoryUuid"],
            message: "Category is required when subcategory is set",
          },
        ],
      };
    }

    return { ok: true, data: { categoryId: null, subcategoryId: null } };
  }

  const category = await prisma.category.findFirst({
    where: { uuid: input.categoryUuid, userUuid: input.userUuid },
    select: { id: true },
  });
  if (!category) {
    return {
      ok: false,
      details: [{ path: ["categoryUuid"], message: "Unknown category" }],
    };
  }

  if (input.subcategoryUuid == null) {
    return { ok: true, data: { categoryId: category.id, subcategoryId: null } };
  }

  const subcategory = await prisma.subcategory.findFirst({
    where: { uuid: input.subcategoryUuid, userUuid: input.userUuid },
    select: { id: true, categoryId: true },
  });
  if (!subcategory) {
    return {
      ok: false,
      details: [{ path: ["subcategoryUuid"], message: "Unknown subcategory" }],
    };
  }

  if (subcategory.categoryId !== category.id) {
    return {
      ok: false,
      details: [
        {
          path: ["subcategoryUuid"],
          message: "Subcategory does not belong to category",
        },
      ],
    };
  }

  return {
    ok: true,
    data: { categoryId: category.id, subcategoryId: subcategory.id },
  };
}

async function getOwnedTransaction(userUuid: string, transactionUuid: string) {
  return prisma.transaction.findFirst({
    where: { uuid: transactionUuid, userUuid },
    include: {
      recipient: {
        select: { uuid: true, displayName: true },
      },
      category: {
        select: { uuid: true, name: true },
      },
      subcategory: {
        select: { uuid: true, name: true },
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
  const subcategoryFilters = input.subcategories ?? [];

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

  if (subcategoryFilters.length > 0) {
    andFilters.push({ subcategory: { name: { in: subcategoryFilters } } });
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
              recipient: { select: { uuid: true, displayName: true } },
              category: { select: { uuid: true, name: true } },
              subcategory: { select: { uuid: true, name: true } },
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
    logger.error(
      {
        event: "transaction.list.db_failed",
        userId: input.userUuid,
        message: "Failed to list transactions",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function getTransactionById(
  input: TransactionLookupInput
): Promise<TransactionGetResult> {
  try {
    const transaction = await getOwnedTransaction(input.userUuid, input.transactionUuid);
    if (!transaction) {
      return fail("NOT_FOUND");
    }

    return ok(toTransactionDto(transaction as unknown as TransactionRecord));
  } catch (error) {
    logger.error(
      {
        event: "transaction.read.db_failed",
        userId: input.userUuid,
        transactionUuid: input.transactionUuid,
        message: "Failed to load transaction",
      },
      error
    );
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
        recipient: { select: { uuid: true, displayName: true } },
        category: { select: { uuid: true, name: true } },
        subcategory: { select: { uuid: true, name: true } },
      },
      orderBy: { timestamp: "desc" },
    });

    return ok(
      records.map((record) => toTransactionDto(record as unknown as TransactionRecord))
    );
  } catch (error) {
    logger.error(
      {
        event: "transaction.range_list.db_failed",
        userId: input.userUuid,
        message: "Failed to load transactions for range",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function createTransaction(
  input: TransactionWriteInput
): Promise<TransactionCreateResult> {
  try {
    const categorySelection = await resolveCategorySelection({
      userUuid: input.userUuid,
      categoryUuid: input.categoryUuid,
      subcategoryUuid: input.subcategoryUuid,
    });
    if (!categorySelection.ok) {
      return fail("VALIDATION_ERROR", categorySelection.details);
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
        categoryId: categorySelection.data.categoryId,
        subcategoryId: categorySelection.data.subcategoryId,
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

    logger.info({
      event: "transaction.created",
      userId: input.userUuid,
      transactionId: created.id,
      source: input.source,
    });

    return ok({ uuid: created.uuid });
  } catch (error) {
    logger.error(
      {
        event: "transaction.create.db_failed",
        userId: input.userUuid,
        source: input.source,
        message: "Failed to create transaction",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function updateTransaction(
  input: TransactionUpdateInput
): Promise<TransactionUpdateResult> {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { uuid: input.transactionUuid, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    const categorySelection = await resolveCategorySelection({
      userUuid: input.userUuid,
      categoryUuid: input.categoryUuid,
      subcategoryUuid: input.subcategoryUuid,
    });
    if (!categorySelection.ok) {
      return fail("VALIDATION_ERROR", categorySelection.details);
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
      where: { id: existing.id },
      data: {
        recipientId: recipientResult.data.recipientId,
        categoryId: categorySelection.data.categoryId,
        subcategoryId: categorySelection.data.subcategoryId,
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

    logger.info({
      event: "transaction.updated",
      userId: input.userUuid,
      transactionId: existing.id,
      source: input.source,
    });

    return ok({ uuid: input.transactionUuid });
  } catch (error) {
    logger.error(
      {
        event: "transaction.update.db_failed",
        userId: input.userUuid,
        transactionUuid: input.transactionUuid,
        source: input.source,
        message: "Failed to update transaction",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function updateTransactionCategory(
  input: TransactionCategoryUpdateInput
): Promise<TransactionCategoryUpdateResult> {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { uuid: input.transactionUuid, userUuid: input.userUuid },
      select: { id: true, categoryId: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    const categorySelection = await resolveCategorySelection({
      userUuid: input.userUuid,
      categoryUuid: input.categoryUuid,
      subcategoryUuid: input.subcategoryUuid,
    });
    if (!categorySelection.ok) {
      return fail("VALIDATION_ERROR", categorySelection.details);
    }

    const updated = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        categoryId: categorySelection.data.categoryId,
        subcategoryId:
          categorySelection.data.categoryId == null
            ? null
            : input.subcategoryUuid !== undefined
              ? categorySelection.data.subcategoryId
              : existing.categoryId !== categorySelection.data.categoryId
                ? null
                : undefined,
      },
      include: {
        category: { select: { uuid: true, name: true } },
        subcategory: { select: { uuid: true, name: true } },
      },
    });

    logger.info({
      event: "transaction.category_changed",
      userId: input.userUuid,
      transactionId: existing.id,
      categoryId: updated.categoryId,
      subcategoryId: updated.subcategoryId,
    });

    return ok({
      uuid: updated.uuid,
      categoryUuid: updated.category?.uuid ?? null,
      category: updated.category?.name ?? null,
      subcategoryUuid: updated.subcategory?.uuid ?? null,
      subcategory: updated.subcategory?.name ?? null,
    });
  } catch (error) {
    logger.error(
      {
        event: "transaction.category_change.db_failed",
        userId: input.userUuid,
        transactionUuid: input.transactionUuid,
        categoryUuid: input.categoryUuid,
        message: "Failed to update transaction category",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function deleteTransaction(
  input: TransactionLookupInput
): Promise<TransactionDeleteResult> {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { uuid: input.transactionUuid, userUuid: input.userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.transaction.delete({ where: { id: existing.id } });
    logger.info({
      event: "transaction.deleted",
      userId: input.userUuid,
      transactionId: existing.id,
    });
    return ok({ uuid: input.transactionUuid });
  } catch (error) {
    logger.error(
      {
        event: "transaction.delete.db_failed",
        userId: input.userUuid,
        transactionUuid: input.transactionUuid,
        message: "Failed to delete transaction",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function suggestTransactionCategory(
  input: TransactionLookupInput
): Promise<TransactionSuggestResult> {
  try {
    const current = await prisma.transaction.findFirst({
      where: { uuid: input.transactionUuid, userUuid: input.userUuid },
      select: { id: true, recipientId: true },
    });
    if (!current) {
      return fail("NOT_FOUND");
    }

    const matches = await prisma.transaction.findMany({
      where: {
        userUuid: input.userUuid,
        recipientId: current.recipientId,
        id: { not: current.id },
        categoryId: { not: null },
      },
      include: {
        category: { select: { uuid: true, name: true } },
        subcategory: { select: { uuid: true, name: true } },
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
    logger.error(
      {
        event: "transaction.suggestion.db_failed",
        userId: input.userUuid,
        transactionUuid: input.transactionUuid,
        message: "Failed to build transaction category suggestion",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}
