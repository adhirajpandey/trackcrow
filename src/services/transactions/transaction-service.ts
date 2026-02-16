import { z } from 'zod';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { parseTransactionMessage } from '@/common/sms-parser';
import { transactionReadSchema } from '@/common/schemas';
import { fail, ok, type ServiceResult } from '@/services/shared/result';
import { requireOwnedTransaction } from '@/services/auth/guard-service';

type SortBy = 'timestamp' | 'amount' | null;
type SortOrder = 'asc' | 'desc' | null;

export type ListTransactionsOutput = {
  transactions: z.infer<typeof transactionReadSchema>[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  firstTxnDate: Date | null;
  lastTxnDate: Date | null;
};

export type CreateManualTransactionInput = {
  userUuid: string;
  amount: number;
  recipient: string;
  recipient_name?: string;
  categoryId: number;
  subcategoryId?: number;
  type: 'UPI' | 'CARD' | 'CASH' | 'NETBANKING' | 'OTHER';
  remarks?: string;
  timestamp: Date;
};

export type UpdateTransactionInput = {
  userUuid: string;
  id: number;
  amount: number;
  recipient: string;
  recipient_name?: string | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  type: 'UPI' | 'CARD' | 'CASH' | 'NETBANKING' | 'OTHER';
  remarks?: string | null;
  timestamp?: Date | null;
};

export function parseTokenFromAuthHeader(headerValue: string | null): string | null {
  if (!headerValue) return null;
  const m = headerValue.match(/^Token\s+(\S+)$/i);
  return m ? m[1] : null;
}

export async function listTransactions(input: {
  userUuid: string;
  searchParams: URLSearchParams;
}): Promise<ServiceResult<ListTransactionsOutput, 'INTERNAL_ERROR'>> {
  const { userUuid, searchParams } = input;

  const pageParam = searchParams.get('page');
  const sizeParam = searchParams.get('size');
  const qParam = searchParams.get('q');
  const sortBy = (searchParams.get('sortBy') as SortBy) ?? null;
  const sortOrder = (searchParams.get('sortOrder') as SortOrder) ?? null;
  const startDateParam = searchParams.get('startDate');
  const endDateParam = searchParams.get('endDate');

  const categoryParams = searchParams.getAll('category');
  const categoriesCsv = searchParams.get('categories');
  const categoriesFromCsv = categoriesCsv
    ? categoriesCsv
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const categoryFilters = Array.from(
    new Set([...categoryParams, ...categoriesFromCsv])
  );

  const pageNum = Number(pageParam);
  const page = Number.isFinite(pageNum) ? Math.max(1, Math.floor(pageNum)) : 1;
  const sizeNum = sizeParam === null ? Number.NaN : Number(sizeParam);
  const pageSize = Number.isFinite(sizeNum)
    ? Math.max(1, Math.min(100, Math.floor(sizeNum)))
    : 20;

  const skip = (page - 1) * pageSize;

  const q = (qParam ?? '').trim();
  const orFilters: any[] = [];
  if (q.length > 0) {
    orFilters.push(
      { recipient: { contains: q, mode: 'insensitive' } },
      { recipient_name: { contains: q, mode: 'insensitive' } },
      { remarks: { contains: q, mode: 'insensitive' } }
    );
    const qDigits = q.replace(/[^0-9.-]/g, '');
    const qNum = Number(qDigits);
    if (Number.isFinite(qNum)) {
      orFilters.push({ amount: qNum });
    }
  }

  const andFilters: any[] = [];
  if (categoryFilters.length > 0) {
    const includeUncategorized = categoryFilters.some(
      (c) => c.toLowerCase() === 'uncategorized'
    );
    const named = categoryFilters.filter(
      (c) => c && c.toLowerCase() !== 'uncategorized'
    );
    const ors: any[] = [];
    if (named.length > 0) ors.push({ Category: { name: { in: named } } });
    if (includeUncategorized) ors.push({ categoryId: null });
    if (ors.length > 0) andFilters.push({ OR: ors });
  }

  const where: any = {
    user_uuid: userUuid,
    ...(orFilters.length > 0 ? { OR: orFilters } : {}),
    ...(andFilters.length > 0 ? { AND: andFilters } : {}),
  };

  if (startDateParam) {
    where.timestamp = { ...where.timestamp, gte: new Date(startDateParam) };
  }
  if (endDateParam) {
    where.timestamp = { ...where.timestamp, lte: new Date(endDateParam) };
  }

  logger.debug('listTransactions - Query parameters', {
    userUuid,
    page,
    pageSize,
    searchQuery: q,
    categoryFilters,
    sortBy,
    sortOrder,
    dateRange: { startDateParam, endDateParam },
  });

  try {
    const [firstTxn, lastTxn, total] = await Promise.all([
      prisma.transaction.findFirst({
        where: { user_uuid: userUuid },
        orderBy: { timestamp: 'asc' },
        select: { timestamp: true },
      }),
      prisma.transaction.findFirst({
        where: { user_uuid: userUuid },
        orderBy: { timestamp: 'desc' },
        select: { timestamp: true },
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);

    let transactions: Array<any> = [];
    if (total > 0 && page <= totalPages) {
      const orderBy: any = {};
      if (sortBy === 'timestamp') {
        orderBy.timestamp = sortOrder === 'asc' ? 'asc' : 'desc';
      } else if (sortBy === 'amount') {
        orderBy.amount = sortOrder === 'asc' ? 'asc' : 'desc';
      } else {
        orderBy.timestamp = 'desc';
      }

      transactions = await prisma.transaction.findMany({
        where,
        orderBy,
        select: {
          user_uuid: true,
          id: true,
          timestamp: true,
          recipient: true,
          amount: true,
          type: true,
          recipient_name: true,
          remarks: true,
          location: true,
          Category: { select: { name: true } },
          Subcategory: { select: { name: true } },
        },
        skip,
        take: pageSize,
      });
    }

    const flat = transactions.map((t) => ({
      user_uuid: t.user_uuid,
      id: t.id,
      timestamp: t.timestamp,
      recipient: t.recipient,
      amount: Number(t.amount),
      type: t.type,
      location: t.location ?? null,
      recipient_name: t.recipient_name ?? null,
      category: t.Category?.name ?? null,
      subcategory: t.Subcategory?.name ?? null,
      remarks: t.remarks ?? null,
    }));

    const parsed = z.array(transactionReadSchema).safeParse(flat);
    if (!parsed.success) {
      logger.error('listTransactions - Failed to validate mapped transactions', undefined, {
        userUuid,
        validationErrors: parsed.error.issues,
      });
      return fail('INTERNAL_ERROR');
    }

    return ok({
      transactions: parsed.data,
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      firstTxnDate: firstTxn?.timestamp ?? null,
      lastTxnDate: lastTxn?.timestamp ?? null,
    });
  } catch (error) {
    logger.error('listTransactions - Database error', error as Error, { userUuid });
    return fail('INTERNAL_ERROR');
  }
}

export async function createSmsTransaction(input: {
  token: string | null;
  message: string;
  location?: string | null;
}): Promise<
  ServiceResult<
    { id: number; uuid: string },
    'UNAUTHORIZED' | 'UNPROCESSABLE' | 'INTERNAL_ERROR'
  >
> {
  const { token, message, location } = input;

  if (!token) {
    return fail('UNAUTHORIZED');
  }

  try {
    const user = await prisma.user.findFirst({ where: { lt_token: token } });
    if (!user) {
      return fail('UNAUTHORIZED');
    }

    const details = parseTransactionMessage(message);
    if (!details || !details.amount || !details.recipient) {
      return fail('UNPROCESSABLE', {
        missing: {
          amount: !details?.amount,
          recipient: !details?.recipient,
        },
        parsedDetails: details,
        originalMessage: message,
      });
    }

    const created = await prisma.transaction.create({
      data: {
        uuid: crypto.randomUUID(),
        user_uuid: user.uuid,
        amount: details.amount,
        type: details.type,
        recipient: details.recipient,
        input_mode: 'AUTO',
        timestamp: new Date().toISOString(),
        reference: details.reference,
        account: details.account,
        raw_message: message,
        location,
      },
      select: { uuid: true, id: true },
    });

    return ok(created);
  } catch (error) {
    logger.error('createSmsTransaction - Failed to create transaction', error as Error);
    return fail('INTERNAL_ERROR');
  }
}

export async function suggestCategory(input: {
  userUuid: string;
  transactionId: number;
}): Promise<
  ServiceResult<
    { suggestedCategory: string | null; suggestedSubCategory: string | null },
    'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR'
  >
> {
  const { userUuid, transactionId } = input;

  if (!Number.isFinite(transactionId)) {
    return fail('VALIDATION_ERROR');
  }

  try {
    const currentTransaction = await prisma.transaction.findFirst({
      where: {
        id: transactionId,
        user_uuid: userUuid,
      },
      select: {
        recipient: true,
      },
    });

    if (!currentTransaction) {
      return fail('NOT_FOUND');
    }

    const similarTransactions = await prisma.transaction.findMany({
      where: {
        user_uuid: userUuid,
        recipient: currentTransaction.recipient,
        id: {
          not: transactionId,
        },
        categoryId: {
          not: null,
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      select: {
        Category: {
          select: {
            name: true,
          },
        },
        Subcategory: {
          select: {
            name: true,
          },
        },
      },
    });

    let suggestedCategory: string | null = null;
    let suggestedSubCategory: string | null = null;

    if (similarTransactions.length > 0) {
      const categoryCounts = new Map<string, number>();
      const subcategoryCounts = new Map<string, number>();

      for (const txn of similarTransactions) {
        if (txn.Category?.name) {
          categoryCounts.set(
            txn.Category.name,
            (categoryCounts.get(txn.Category.name) || 0) + 1
          );
        }
        if (txn.Subcategory?.name) {
          subcategoryCounts.set(
            txn.Subcategory.name,
            (subcategoryCounts.get(txn.Subcategory.name) || 0) + 1
          );
        }
      }

      let maxCategoryCount = 0;
      for (const [category, count] of categoryCounts.entries()) {
        if (count > maxCategoryCount) {
          maxCategoryCount = count;
          suggestedCategory = category;
        }
      }

      let maxSubcategoryCount = 0;
      for (const [subcategory, count] of subcategoryCounts.entries()) {
        if (count > maxSubcategoryCount) {
          maxSubcategoryCount = count;
          suggestedSubCategory = subcategory;
        }
      }
    }

    return ok({ suggestedCategory, suggestedSubCategory });
  } catch (error) {
    logger.error('suggestCategory - Failed to build suggestion', error as Error, {
      userUuid,
      transactionId,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function createManualTransaction(
  input: CreateManualTransactionInput
): Promise<ServiceResult<{ id: number; uuid: string }, 'INTERNAL_ERROR'>> {
  const { userUuid, ...txnData } = input;

  try {
    const transaction = await prisma.transaction.create({
      data: {
        user_uuid: userUuid,
        ...txnData,
        input_mode: 'MANUAL',
        uuid: crypto.randomUUID(),
      },
      select: {
        id: true,
        uuid: true,
      },
    });

    return ok(transaction);
  } catch (error) {
    logger.error('createManualTransaction - Failed to create transaction', error as Error, {
      userUuid,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function updateManualTransaction(
  input: UpdateTransactionInput
): Promise<ServiceResult<{ id: number }, 'NOT_FOUND' | 'INTERNAL_ERROR'>> {
  const {
    userUuid,
    id,
    amount,
    recipient,
    recipient_name,
    categoryId,
    subcategoryId,
    type,
    remarks,
    timestamp,
  } = input;

  const ownership = await requireOwnedTransaction(id, userUuid);
  if (!ownership.ok) {
    if (ownership.error === 'NOT_FOUND') {
      return fail('NOT_FOUND');
    }
    return fail('INTERNAL_ERROR');
  }

  const recipientNameForDb =
    typeof recipient_name === 'string' && recipient_name.trim() === ''
      ? null
      : recipient_name ?? null;
  const remarksForDb =
    typeof remarks === 'string' && remarks.trim() === '' ? null : remarks ?? null;

  const updateData: {
    amount: number;
    recipient: string;
    recipient_name: string | null;
    type: 'UPI' | 'CARD' | 'CASH' | 'NETBANKING' | 'OTHER';
    remarks: string | null;
    timestamp?: Date;
    categoryId?: number | null;
    subcategoryId?: number | null;
  } = {
    amount,
    recipient,
    recipient_name: recipientNameForDb,
    type,
    remarks: remarksForDb,
    ...(timestamp ? { timestamp } : {}),
  };

  if (categoryId !== undefined) {
    updateData.categoryId = categoryId;
    if (categoryId === null) {
      updateData.subcategoryId = null;
    } else if (typeof categoryId === 'number' && subcategoryId === undefined) {
      updateData.subcategoryId = null;
    }
  }

  if (subcategoryId !== undefined) {
    updateData.subcategoryId = subcategoryId;
  }

  try {
    await prisma.transaction.update({ where: { id }, data: updateData });
    return ok({ id });
  } catch (error) {
    logger.error('updateManualTransaction - Failed to update transaction', error as Error, {
      userUuid,
      transactionId: id,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function deleteTransactionById(input: {
  userUuid: string;
  transactionId: number;
}): Promise<ServiceResult<{ id: number }, 'NOT_FOUND' | 'INTERNAL_ERROR'>> {
  const { userUuid, transactionId } = input;

  const ownership = await requireOwnedTransaction(transactionId, userUuid);
  if (!ownership.ok) {
    if (ownership.error === 'NOT_FOUND') {
      return fail('NOT_FOUND');
    }
    return fail('INTERNAL_ERROR');
  }

  try {
    await prisma.transaction.delete({ where: { id: transactionId } });
    return ok({ id: transactionId });
  } catch (error) {
    logger.error('deleteTransactionById - Failed to delete transaction', error as Error, {
      userUuid,
      transactionId,
    });
    return fail('INTERNAL_ERROR');
  }
}
