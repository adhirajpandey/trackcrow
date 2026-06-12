import { TransactionSource, TransactionType } from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { resolveRecipient } from "@/server/modules/recipients/service";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

export type TransactionDto = {
  id: number;
  uuid: string;
  userUuid: string;
  amount: number;
  currency: string;
  type: TransactionType;
  source: TransactionSource;
  recipientRaw: string;
  recipientName: string | null;
  recipientDisplayName: string;
  reference: string | null;
  accountLabel: string | null;
  remarks: string | null;
  locationRaw: string | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  category: string | null;
  subcategory: string | null;
  categoryId: number | null;
  subcategoryId: number | null;
};

export type TransactionListDto = {
  transactions: TransactionDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  firstTxnDate: string | null;
  lastTxnDate: string | null;
};

export type TransactionListRangeInput = {
  startDate?: Date;
  endDate?: Date;
};

export type TransactionWriteInput = {
  userUuid: string;
  amount: number;
  recipientRaw: string;
  recipientName?: string | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  type: TransactionType;
  remarks?: string | null;
  timestamp: Date;
  reference?: string | null;
  accountLabel?: string | null;
  locationRaw?: string | null;
  source: TransactionSource;
};

type TransactionRecord = {
  id: number;
  uuid: string;
  userUuid: string;
  amount: { toNumber(): number };
  currency: string;
  type: TransactionType;
  source: TransactionSource;
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
  userUuid: string,
  searchParams: URLSearchParams
): Promise<ServiceResult<TransactionListDto, "INTERNAL_ERROR">> {
  const pageNum = Number(searchParams.get("page"));
  const sizeNum = Number(searchParams.get("size"));
  const page = Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1;
  const pageSize = Number.isFinite(sizeNum)
    ? Math.max(1, Math.min(100, Math.floor(sizeNum)))
    : 20;
  const skip = (page - 1) * pageSize;

  const q = searchParams.get("q")?.trim() ?? "";
  const sortBy = searchParams.get("sortBy");
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");

  const categoryParams = searchParams.getAll("category");
  const categoriesCsv = searchParams.get("categories");
  const categoryFilters = Array.from(
    new Set([
      ...categoryParams,
      ...(categoriesCsv
        ? categoriesCsv.split(",").map((value) => value.trim()).filter(Boolean)
        : []),
    ])
  );

  const where: Record<string, unknown> = { userUuid };
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

  if (startDateParam || endDateParam) {
    andFilters.push({
      timestamp: {
        ...(startDateParam ? { gte: new Date(startDateParam) } : {}),
        ...(endDateParam ? { lte: new Date(endDateParam) } : {}),
      },
    });
  }

  if (andFilters.length > 0) {
    where.AND = andFilters;
  }

  try {
    const [firstTxn, lastTxn, total] = await Promise.all([
      prisma.transaction.findFirst({
        where: { userUuid },
        orderBy: { timestamp: "asc" },
        select: { timestamp: true },
      }),
      prisma.transaction.findFirst({
        where: { userUuid },
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
      userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getTransactionById(
  userUuid: string,
  transactionId: number
): Promise<ServiceResult<TransactionDto, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const transaction = await getOwnedTransaction(userUuid, transactionId);
    if (!transaction) {
      return fail("NOT_FOUND");
    }

    return ok(toTransactionDto(transaction as unknown as TransactionRecord));
  } catch (error) {
    logger.error("getTransactionById - Failed to load transaction", error as Error, {
      userUuid,
      transactionId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function listTransactionsForRange(
  userUuid: string,
  input: TransactionListRangeInput = {}
): Promise<ServiceResult<TransactionDto[], "INTERNAL_ERROR">> {
  try {
    const records = await prisma.transaction.findMany({
      where: {
        userUuid,
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
      userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function createTransaction(
  input: TransactionWriteInput
): Promise<
  ServiceResult<
    { id: number; uuid: string },
    "VALIDATION_ERROR" | "INTERNAL_ERROR"
  >
> {
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
  input: TransactionWriteInput & { id: number }
): Promise<
  ServiceResult<{ id: number }, "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR">
> {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: input.id, userUuid: input.userUuid },
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
      where: { id: input.id },
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

    return ok({ id: input.id });
  } catch (error) {
    logger.error("updateTransaction - Failed to update transaction", error as Error, {
      userUuid: input.userUuid,
      transactionId: input.id,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function deleteTransaction(
  userUuid: string,
  transactionId: number
): Promise<ServiceResult<{ id: number }, "NOT_FOUND" | "INTERNAL_ERROR">> {
  try {
    const existing = await prisma.transaction.findFirst({
      where: { id: transactionId, userUuid },
      select: { id: true },
    });
    if (!existing) {
      return fail("NOT_FOUND");
    }

    await prisma.transaction.delete({ where: { id: transactionId } });
    return ok({ id: transactionId });
  } catch (error) {
    logger.error("deleteTransaction - Failed to delete transaction", error as Error, {
      userUuid,
      transactionId,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function suggestTransactionCategory(
  userUuid: string,
  transactionId: number
): Promise<
  ServiceResult<
    { suggestedCategory: string | null; suggestedSubCategory: string | null },
    "NOT_FOUND" | "INTERNAL_ERROR"
  >
> {
  try {
    const current = await prisma.transaction.findFirst({
      where: { id: transactionId, userUuid },
      select: { id: true, recipientId: true },
    });
    if (!current) {
      return fail("NOT_FOUND");
    }

    const matches = await prisma.transaction.findMany({
      where: {
        userUuid,
        recipientId: current.recipientId,
        id: { not: transactionId },
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
      userUuid,
      transactionId,
    });
    return fail("INTERNAL_ERROR");
  }
}
