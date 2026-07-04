import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { formatRecipientDisplayLabel } from "@/common/recipient-display";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type { DashboardRangeInput, SpendingByPeriodInput } from "./types";

const IST_OFFSET_MINUTES = 330;

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

function getIstDateParts(date: Date) {
  const istDate = new Date(date.getTime() + IST_OFFSET_MINUTES * 60 * 1000);

  return {
    year: istDate.getUTCFullYear(),
    month: istDate.getUTCMonth() + 1,
    day: istDate.getUTCDate(),
  };
}

function formatPeriodPart(value: number) {
  return String(value).padStart(2, "0");
}

function getPeriodKey(date: Date, granularity: NonNullable<SpendingByPeriodInput["granularity"]>) {
  const ist = getIstDateParts(date);

  if (granularity === "day") {
    return `${ist.year}-${formatPeriodPart(ist.month)}-${formatPeriodPart(ist.day)}`;
  }

  if (granularity === "week") {
    const istMidnight = new Date(Date.UTC(ist.year, ist.month - 1, ist.day));
    const day = istMidnight.getUTCDay();
    const daysSinceMonday = (day + 6) % 7;
    const monday = new Date(istMidnight);
    monday.setUTCDate(monday.getUTCDate() - daysSinceMonday);
    return monday.toISOString().slice(0, 10);
  }

  if (granularity === "year") {
    return String(ist.year);
  }

  return `${ist.year}-${formatPeriodPart(ist.month)}`;
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
    logger.error(
      {
        event: "dashboard.summary.db_failed",
        userId: input.userUuid,
        message: "Failed to load dashboard summary",
      },
      error
    );
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
      topSubcategory: {
        name: string;
        totalSpend: number;
        transactionCount: number;
      } | null;
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
        subcategory: {
          select: { name: true },
        },
      },
    });

    const groups = new Map<
      string,
      {
        totalSpend: number;
        transactionCount: number;
        subcategories: Map<string, { totalSpend: number; transactionCount: number }>;
      }
    >();
    for (const txn of transactions) {
      const key = txn.category?.name ?? "Uncategorized";
      const current = groups.get(key) ?? {
        totalSpend: 0,
        transactionCount: 0,
        subcategories: new Map<string, { totalSpend: number; transactionCount: number }>(),
      };
      current.totalSpend += Number(txn.amount);
      current.transactionCount += 1;

      if (txn.category?.name && txn.subcategory?.name) {
        const subcategory = current.subcategories.get(txn.subcategory.name) ?? {
          totalSpend: 0,
          transactionCount: 0,
        };
        subcategory.totalSpend += Number(txn.amount);
        subcategory.transactionCount += 1;
        current.subcategories.set(txn.subcategory.name, subcategory);
      }

      groups.set(key, current);
    }

    return ok(
      [...groups.entries()]
        .map(([category, data]) => {
          const topSubcategory =
            [...data.subcategories.entries()]
              .map(([name, subcategory]) => ({ name, ...subcategory }))
              .sort((left, right) => {
                if (right.totalSpend !== left.totalSpend) {
                  return right.totalSpend - left.totalSpend;
                }

                if (right.transactionCount !== left.transactionCount) {
                  return right.transactionCount - left.transactionCount;
                }

                return left.name.localeCompare(right.name);
              })[0] ?? null;

          return {
            category,
            totalSpend: data.totalSpend,
            transactionCount: data.transactionCount,
            topSubcategory,
          };
        })
        .sort((left, right) => right.totalSpend - left.totalSpend)
    );
  } catch (error) {
    logger.error(
      {
        event: "dashboard.category_spending.db_failed",
        userId: input.userUuid,
        message: "Failed to load spending by category",
      },
      error
    );
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
  const granularity = input.granularity ?? "month";
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
      const period = getPeriodKey(txn.timestamp, granularity);
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
    logger.error(
      {
        event: "dashboard.period_spending.db_failed",
        userId: input.userUuid,
        message: "Failed to load spending by period",
      },
      error
    );
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
    logger.error(
      {
        event: "dashboard.import_health.db_failed",
        userId: input.userUuid,
        message: "Failed to load import health",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function getLargeTransactionCount(
  input: DashboardRangeInput & { minimumAmount: number }
): Promise<ServiceResult<number, "INTERNAL_ERROR">> {
  const where = {
    userUuid: input.userUuid,
    ...buildDateFilter(input),
    amount: {
      gte: input.minimumAmount,
    },
  };

  try {
    const count = await prisma.transaction.count({ where });
    return ok(count);
  } catch (error) {
    logger.error(
      {
        event: "dashboard.large_transaction_count.db_failed",
        userId: input.userUuid,
        minimumAmount: input.minimumAmount,
        message: "Failed to load large transaction count",
      },
      error
    );
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
      subcategory: string | null;
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
        subcategory: { select: { name: true } },
      },
    });

    return ok(
      transactions.map((transaction) => ({
        uuid: transaction.uuid,
        recipient: formatRecipientDisplayLabel({
          recipientName: transaction.recipientName,
          recipientDisplayName: transaction.recipient?.displayName,
          recipientRaw: transaction.recipientRaw,
          fallbackLabel: "Unknown merchant",
        }),
        category: transaction.category?.name ?? null,
        subcategory: transaction.subcategory?.name ?? null,
        amount: Number(transaction.amount),
        timestamp: transaction.timestamp.toISOString(),
        source: transaction.source,
      }))
    );
  } catch (error) {
    logger.error(
      {
        event: "dashboard.recent_large_transactions.db_failed",
        userId: input.userUuid,
        message: "Failed to load recent large transactions",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function getRecentTransactions(
  input: DashboardRangeInput & { take?: number }
): Promise<
  ServiceResult<
    Array<{
      uuid: string;
      recipient: string;
      category: string | null;
      subcategory: string | null;
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
      orderBy: { timestamp: "desc" },
      take: input.take ?? 10,
      select: {
        uuid: true,
        amount: true,
        timestamp: true,
        source: true,
        recipientName: true,
        recipientRaw: true,
        recipient: { select: { displayName: true } },
        category: { select: { name: true } },
        subcategory: { select: { name: true } },
      },
    });

    return ok(
      transactions.map((transaction) => ({
        uuid: transaction.uuid,
        recipient: formatRecipientDisplayLabel({
          recipientName: transaction.recipientName,
          recipientDisplayName: transaction.recipient?.displayName,
          recipientRaw: transaction.recipientRaw,
          fallbackLabel: "Unknown merchant",
        }),
        category: transaction.category?.name ?? null,
        subcategory: transaction.subcategory?.name ?? null,
        amount: Number(transaction.amount),
        timestamp: transaction.timestamp.toISOString(),
        source: transaction.source,
      }))
    );
  } catch (error) {
    logger.error(
      {
        event: "dashboard.recent_transactions.db_failed",
        userId: input.userUuid,
        message: "Failed to load recent transactions",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}

export async function getFrequentRecipients(
  input: DashboardRangeInput & { take?: number }
): Promise<
  ServiceResult<
    Array<{
      recipientUuid: string | null;
      recipient: string;
      paymentCount: number;
      totalAmount: number;
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
        recipientName: true,
        recipientRaw: true,
        recipient: { select: { uuid: true, displayName: true } },
      },
    });

    const groups = new Map<
      string,
      { recipientUuid: string | null; recipient: string; paymentCount: number; totalAmount: number }
    >();
    for (const transaction of transactions) {
      const recipient =
        formatRecipientDisplayLabel({
          recipientName: transaction.recipientName,
          recipientDisplayName: transaction.recipient?.displayName,
          recipientRaw: transaction.recipientRaw,
          fallbackLabel: "Unknown payee",
        });
      const key = transaction.recipient?.uuid
        ? `uuid:${transaction.recipient.uuid}`
        : `label:${recipient}`;
      const current = groups.get(key) ?? {
        recipientUuid: transaction.recipient?.uuid ?? null,
        recipient,
        paymentCount: 0,
        totalAmount: 0,
      };
      current.paymentCount += 1;
      current.totalAmount += Number(transaction.amount);
      groups.set(key, current);
    }

    return ok(
      [...groups.values()]
        .sort((left, right) => {
          if (right.paymentCount !== left.paymentCount) {
            return right.paymentCount - left.paymentCount;
          }

          return right.totalAmount - left.totalAmount;
        })
        .slice(0, input.take ?? 5)
    );
  } catch (error) {
    logger.error(
      {
        event: "dashboard.frequent_recipients.db_failed",
        userId: input.userUuid,
        message: "Failed to load frequent recipients",
      },
      error
    );
    return fail("INTERNAL_ERROR");
  }
}
