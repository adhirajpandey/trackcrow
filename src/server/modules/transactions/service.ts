import { ClassificationSource, TransactionSource, TransactionType } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { resolveRecipient } from "@/server/modules/recipients/service";
import { resolveCreateClassification } from "@/server/modules/rules/evaluator";
import { loadEvaluatableRules } from "@/server/modules/rules/service";
import { fail, ok } from "@/server/shared/result";

import type {
  ListTransactionsInput,
  TransactionCategoryUpdateInput,
  TransactionCategoryUpdateResult,
  TransactionCreateResult,
  TransactionDeleteResult,
  TransactionDto,
  TransactionListItemDto,
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
  classificationSource: ClassificationSource | null;
  classificationRuleId: number | null;
  classificationChangedAt: Date | null;
  recipient: {
    uuid: string;
    displayName: string;
  };
  category: { uuid: string; name: string } | null;
  subcategory: { uuid: string; name: string } | null;
  classificationRule: { uuid: string; name: string; deletedAt: Date | null } | null;
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
    classificationSource: record.classificationSource,
    classificationChangedAt: record.classificationChangedAt?.toISOString() ?? null,
    classificationRule: record.classificationRule
      ? {
          uuid: record.classificationRule.uuid,
          name: record.classificationRule.name,
          isDeleted: record.classificationRule.deletedAt !== null,
        }
      : null,
  };
}

function toTransactionListItemDto(record: TransactionRecord): TransactionListItemDto {
  const dto = toTransactionDto(record);
  return {
    uuid: dto.uuid,
    userUuid: dto.userUuid,
    amount: dto.amount,
    currency: dto.currency,
    type: dto.type,
    source: dto.source,
    recipientUuid: dto.recipientUuid,
    recipientDisplayName: dto.recipientDisplayName,
    reference: dto.reference,
    accountLabel: dto.accountLabel,
    remarks: dto.remarks,
    locationRaw: dto.locationRaw,
    timestamp: dto.timestamp,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    category: dto.category,
    subcategory: dto.subcategory,
    categoryUuid: dto.categoryUuid,
    subcategoryUuid: dto.subcategoryUuid,
    classificationSource: dto.classificationSource,
    classificationChangedAt: dto.classificationChangedAt,
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
      classificationRule: {
        select: { uuid: true, name: true, deletedAt: true },
      },
    },
  });
}

async function resolveExistingRecipient(input: {
  userUuid: string;
  recipientUuid: string;
}) {
  try {
    const recipient = await prisma.recipient.findFirst({
      where: { uuid: input.recipientUuid, userUuid: input.userUuid },
      select: { id: true, uuid: true, displayName: true },
    });

    if (!recipient) {
      return fail("VALIDATION_ERROR" as const, [
        { path: ["recipientUuid"], message: "Unknown recipient" },
      ]);
    }

    return ok({
      recipientId: recipient.id,
      recipientUuid: recipient.uuid,
      displayName: recipient.displayName,
    });
  } catch (error) {
    logger.error(
      {
        event: "transaction.recipient_resolve.db_failed",
        userId: input.userUuid,
        recipientUuid: input.recipientUuid,
        message: "Failed to resolve transaction recipient",
      },
      error
    );
    return fail("INTERNAL_ERROR" as const);
  }
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
  const classificationSources = input.classificationSources ?? [];

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

  if (classificationSources.length > 0) {
    andFilters.push({ classificationSource: { in: classificationSources } });
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
              classificationRule: { select: { uuid: true, name: true, deletedAt: true } },
            },
            skip,
            take: pageSize,
          })
        : [];

    return ok({
      transactions: records.map((record) =>
        toTransactionListItemDto(record as unknown as TransactionRecord)
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
        classificationRule: { select: { uuid: true, name: true, deletedAt: true } },
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
    const isManual = Object.prototype.hasOwnProperty.call(input, "categoryUuid");
    const manualSelection = isManual
      ? await resolveCategorySelection({
          userUuid: input.userUuid,
          categoryUuid: input.categoryUuid,
          subcategoryUuid: input.subcategoryUuid,
        })
      : null;
    if (manualSelection && !manualSelection.ok) {
      return fail("VALIDATION_ERROR", manualSelection.details);
    }

    const recipientResult =
      "recipientUuid" in input
        ? await resolveExistingRecipient({
            userUuid: input.userUuid,
            recipientUuid: input.recipientUuid,
          })
        : await resolveRecipient({
            userUuid: input.userUuid,
            recipientRaw: input.recipientRaw,
            recipientName: input.recipientName,
          });
    if (!recipientResult.ok) {
      return recipientResult;
    }

    let classification;
    if (isManual) {
      classification = resolveCreateClassification(
        { recipientUuid: recipientResult.data.recipientUuid },
        {
          type: "MANUAL",
          categoryId: manualSelection!.data.categoryId,
          subcategoryId: manualSelection!.data.subcategoryId,
        },
        []
      );
    } else {
      classification = resolveCreateClassification(
        { recipientUuid: recipientResult.data.recipientUuid },
        { type: "AUTO" },
        await loadEvaluatableRules(input.userUuid)
      );
    }

    if (classification.type === "MULTIPLE_MATCHES") {
      logger.error({
        event: "transaction.classification.multiple_rules",
        userId: input.userUuid,
        recipientUuid: recipientResult.data.recipientUuid,
      });
    }
    const assigned = classification.type === "ASSIGNED" ? classification : null;

    const recipientRaw =
      "recipientRaw" in input ? input.recipientRaw.trim() : recipientResult.data.displayName;
    const recipientName =
      "recipientName" in input ? input.recipientName?.trim() || null : recipientResult.data.displayName;

    const created = await prisma.transaction.create({
      data: {
        userUuid: input.userUuid,
        recipientId: recipientResult.data.recipientId,
        categoryId: assigned?.categoryId ?? null,
        subcategoryId: assigned?.subcategoryId ?? null,
        classificationSource: assigned?.classificationSource ?? null,
        classificationRuleId: assigned?.classificationRuleId ?? null,
        classificationChangedAt: assigned ? new Date() : null,
        amount: input.amount,
        currency: "INR",
        type: input.type,
        source: input.source,
        recipientRaw,
        recipientName,
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
      select: { id: true, categoryId: true, subcategoryId: true },
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

    const classificationChanged =
      existing.categoryId !== categorySelection.data.categoryId ||
      existing.subcategoryId !== categorySelection.data.subcategoryId;
    let classificationSource: ClassificationSource | undefined;
    if (classificationChanged && input.classificationIntent === "SUGGESTION") {
      const verification = await verifySuggestionSelection(input, {
        categoryUuid: input.categoryUuid,
        subcategoryUuid: input.subcategoryUuid,
      });
      if (!verification.ok) return verification;
      classificationSource = ClassificationSource.SUGGESTION;
    } else if (classificationChanged) {
      classificationSource = ClassificationSource.MANUAL;
    }

    await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        categoryId: categorySelection.data.categoryId,
        subcategoryId: categorySelection.data.subcategoryId,
        ...(classificationChanged
          ? {
              classificationSource,
              classificationRuleId: null,
              classificationChangedAt: new Date(),
            }
          : {}),
        amount: input.amount,
        type: input.type,
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
      select: {
        id: true,
        uuid: true,
        categoryId: true,
        subcategoryId: true,
        category: { select: { uuid: true, name: true } },
        subcategory: { select: { uuid: true, name: true } },
      },
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

    const nextSubcategoryId =
      categorySelection.data.categoryId == null
        ? null
        : Object.prototype.hasOwnProperty.call(input, "subcategoryUuid")
          ? categorySelection.data.subcategoryId
          : existing.categoryId !== categorySelection.data.categoryId
            ? null
            : existing.subcategoryId;
    const classificationChanged =
      existing.categoryId !== categorySelection.data.categoryId ||
      existing.subcategoryId !== nextSubcategoryId;

    if (!classificationChanged) {
      return ok({
        uuid: existing.uuid,
        categoryUuid: existing.category?.uuid ?? null,
        category: existing.category?.name ?? null,
        subcategoryUuid: existing.subcategory?.uuid ?? null,
        subcategory: existing.subcategory?.name ?? null,
      });
    }

    if (input.classificationIntent === "SUGGESTION") {
      const verification = await verifySuggestionSelection(input, {
        categoryUuid: input.categoryUuid,
        subcategoryUuid: input.subcategoryUuid,
      });
      if (!verification.ok) return verification;
    }

    const updated = await prisma.transaction.update({
      where: { id: existing.id },
      data: {
        categoryId: categorySelection.data.categoryId,
        subcategoryId: nextSubcategoryId,
        classificationSource:
          input.classificationIntent === "SUGGESTION"
            ? ClassificationSource.SUGGESTION
            : ClassificationSource.MANUAL,
        classificationRuleId: null,
        classificationChangedAt: new Date(),
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

async function verifySuggestionSelection(
  input: TransactionLookupInput & { classificationIntent?: "SUGGESTION" },
  submitted: { categoryUuid?: string | null; subcategoryUuid?: string | null }
) {
  if (
    !submitted.categoryUuid ||
    submitted.subcategoryUuid === undefined
  ) {
    return fail("VALIDATION_ERROR" as const, [
      {
        path: ["classificationIntent"],
        message: "Suggestion intent requires a complete category pair",
      },
    ]);
  }

  const suggestion = await suggestTransactionCategory(input);
  if (!suggestion.ok) return suggestion;
  if (
    suggestion.data.suggestedCategoryUuid !== submitted.categoryUuid ||
    suggestion.data.suggestedSubcategoryUuid !== (submitted.subcategoryUuid ?? null)
  ) {
    return fail("TRANSACTION_SUGGESTION_CONFLICT" as const, {
      suggestion: {
        categoryUuid: suggestion.data.suggestedCategoryUuid,
        subcategoryUuid: suggestion.data.suggestedSubcategoryUuid,
      },
    });
  }
  return ok({ verified: true as const });
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

    const categoryCounts = new Map<string, { uuid: string; name: string; count: number }>();
    for (const transaction of matches) {
      if (transaction.category) {
        const current = categoryCounts.get(transaction.category.uuid);
        categoryCounts.set(transaction.category.uuid, {
          uuid: transaction.category.uuid,
          name: transaction.category.name,
          count: (current?.count ?? 0) + 1,
        });
      }
    }

    const category = [...categoryCounts.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    )[0];
    const subcategoryCounts = new Map<string, { uuid: string; name: string; count: number }>();
    if (category) {
      for (const transaction of matches) {
        if (transaction.category?.uuid !== category.uuid || !transaction.subcategory) continue;
        const current = subcategoryCounts.get(transaction.subcategory.uuid);
        subcategoryCounts.set(transaction.subcategory.uuid, {
          uuid: transaction.subcategory.uuid,
          name: transaction.subcategory.name,
          count: (current?.count ?? 0) + 1,
        });
      }
    }
    const subcategory = [...subcategoryCounts.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name)
    )[0];

    return ok({
      suggestedCategory: category?.name ?? null,
      suggestedSubCategory: subcategory?.name ?? null,
      suggestedCategoryUuid: category?.uuid ?? null,
      suggestedSubcategoryUuid: subcategory?.uuid ?? null,
    });
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
