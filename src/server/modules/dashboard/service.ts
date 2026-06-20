import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type { DashboardRangeInput, SpendingByPeriodInput } from "./types";

function buildDateFilter(input: { startDate?: Date; endDate?: Date }) {
  return {
    ...(input.startDate || input.endDate
      ? {
          timestamp: {
            ...(input.startDate ? { gte: input.startDate } : {}),
            ...(input.endDate ? { lte: input.endDate } : {}),
          },
        }
      : {}),
  };
}

function buildRawMessageDateFilter(input: { startDate?: Date; endDate?: Date }) {
  return {
    ...(input.startDate || input.endDate
      ? {
          receivedAt: {
            ...(input.startDate ? { gte: input.startDate } : {}),
            ...(input.endDate ? { lte: input.endDate } : {}),
          },
        }
      : {}),
  };
}

export async function getDashboardSummary(
  input: DashboardRangeInput
): Promise<
  ServiceResult<
    {
      totalSpend: number;
      transactionCount: number;
      categorizedCount: number;
      uncategorizedCount: number;
      averageSpend: number;
    },
    "INTERNAL_ERROR"
  >
> {
  const where = {
    userUuid: input.userUuid,
    ...buildDateFilter(input),
  };

  try {
    const [aggregate, total, categorized] = await Promise.all([
      prisma.transaction.aggregate({
        where,
        _sum: { amount: true },
        _avg: { amount: true },
      }),
      prisma.transaction.count({ where }),
      prisma.transaction.count({
        where: {
          ...where,
          categoryId: { not: null },
        },
      }),
    ]);

    return ok({
      totalSpend: Number(aggregate._sum.amount ?? 0),
      transactionCount: total,
      categorizedCount: categorized,
      uncategorizedCount: total - categorized,
      averageSpend: Number(aggregate._avg.amount ?? 0),
    });
  } catch (error) {
    logger.error("getDashboardSummary - Failed", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getSpendingByCategory(
  input: DashboardRangeInput
): Promise<
  ServiceResult<
    Array<{
      category: string;
      totalSpend: number;
      transactionCount: number;
    }>,
    "INTERNAL_ERROR"
  >
> {
  const where = {
    userUuid: input.userUuid,
    ...buildDateFilter(input),
  };

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        category: {
          select: { name: true },
        },
      },
    });

    const groups = new Map<string, { totalSpend: number; transactionCount: number }>();
    for (const txn of transactions) {
      const key = txn.category?.name ?? "Uncategorized";
      const current = groups.get(key) ?? { totalSpend: 0, transactionCount: 0 };
      current.totalSpend += Number(txn.amount);
      current.transactionCount += 1;
      groups.set(key, current);
    }

    return ok(
      [...groups.entries()]
        .map(([category, data]) => ({ category, ...data }))
        .sort((a, b) => b.totalSpend - a.totalSpend)
    );
  } catch (error) {
    logger.error("getSpendingByCategory - Failed", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getSpendingByPeriod(
  input: SpendingByPeriodInput
): Promise<
  ServiceResult<
    Array<{
      period: string;
      totalSpend: number;
      transactionCount: number;
    }>,
    "INTERNAL_ERROR"
  >
> {
  const granularity = input.granularity === "day" ? "day" : "month";
  const where = {
    userUuid: input.userUuid,
    ...buildDateFilter(input),
  };

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      select: {
        amount: true,
        timestamp: true,
      },
      orderBy: { timestamp: "asc" },
    });

    const groups = new Map<string, { totalSpend: number; transactionCount: number }>();
    for (const txn of transactions) {
      const period =
        granularity === "day"
          ? txn.timestamp.toISOString().slice(0, 10)
          : txn.timestamp.toISOString().slice(0, 7);
      const current = groups.get(period) ?? { totalSpend: 0, transactionCount: 0 };
      current.totalSpend += Number(txn.amount);
      current.transactionCount += 1;
      groups.set(period, current);
    }

    return ok(
      [...groups.entries()].map(([period, data]) => ({
        period,
        ...data,
      }))
    );
  } catch (error) {
    logger.error("getSpendingByPeriod - Failed", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getImportHealth(
  input: DashboardRangeInput
): Promise<
  ServiceResult<
    {
      parsedCount: number;
      failedCount: number;
      unparseableCount: number;
    },
    "INTERNAL_ERROR"
  >
> {
  const where = {
    userUuid: input.userUuid,
    ...buildRawMessageDateFilter(input),
  };

  try {
    const [parsedCount, failedCount, unparseableCount] = await Promise.all([
      prisma.rawMessage.count({ where: { ...where, parseStatus: "PARSED" } }),
      prisma.rawMessage.count({ where: { ...where, parseStatus: "FAILED" } }),
      prisma.rawMessage.count({ where: { ...where, parseStatus: "UNPARSEABLE" } }),
    ]);

    return ok({ parsedCount, failedCount, unparseableCount });
  } catch (error) {
    logger.error("getImportHealth - Failed", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}

export async function getRecentLargeTransactions(
  input: DashboardRangeInput & { take?: number }
): Promise<
  ServiceResult<
    Array<{
      uuid: string;
      recipient: string;
      category: string | null;
      amount: number;
      timestamp: string;
      source: string;
    }>,
    "INTERNAL_ERROR"
  >
> {
  const where = {
    userUuid: input.userUuid,
    ...buildDateFilter(input),
  };

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [{ amount: "desc" }, { timestamp: "desc" }],
      take: input.take ?? 5,
      select: {
        uuid: true,
        amount: true,
        timestamp: true,
        source: true,
        recipientName: true,
        recipientRaw: true,
        recipient: { select: { displayName: true } },
        category: { select: { name: true } },
      },
    });

    return ok(
      transactions.map((transaction) => ({
        uuid: transaction.uuid,
        recipient:
          transaction.recipientName ??
          transaction.recipient?.displayName ??
          transaction.recipientRaw,
        category: transaction.category?.name ?? null,
        amount: Number(transaction.amount),
        timestamp: transaction.timestamp.toISOString(),
        source: transaction.source,
      }))
    );
  } catch (error) {
    logger.error("getRecentLargeTransactions - Failed", error as Error, {
      userUuid: input.userUuid,
    });
    return fail("INTERNAL_ERROR");
  }
}