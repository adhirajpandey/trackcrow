import "server-only";

import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";
import type { DashboardGranularity, DashboardRangeValue } from "@/features/dashboard/query-state";
import { getDashboardRangeState } from "@/features/dashboard/query-state";
import { requirePageSessionUser } from "@/server/auth/session";
import {
  getDashboardSummary,
  getImportHealth,
  getLargeTransactionCount,
  getRecentLargeTransactions,
  getSpendingByCategory,
  getSpendingByPeriod,
} from "@/server/modules/dashboard/service";

export type DashboardSummaryDto = {
  totalSpend: number;
  transactionCount: number;
  categorizedCount: number;
  uncategorizedCount: number;
  averageSpend: number;
};

export type DashboardCategorySpendDto = {
  category: string;
  totalSpend: number;
  transactionCount: number;
};

export type DashboardPeriodSpendDto = {
  period: string;
  totalSpend: number;
  transactionCount: number;
};

export type DashboardImportHealthDto = {
  parsedCount: number;
  failedCount: number;
  unparseableCount: number;
};

export type DashboardRecentTransactionDto = {
  uuid: string;
  recipient: string;
  category: string | null;
  amount: number;
  timestamp: string;
  source: string;
};

export type DashboardPageData = {
  status: "ready" | "error";
  message: string | null;
  range: {
    value: DashboardRangeValue;
    label: string;
    startDate: string | null;
    endDate: string | null;
    granularity: DashboardGranularity;
  };
  rangeLabel: string;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  summary: DashboardSummaryDto;
  importHealth: DashboardImportHealthDto;
  largeTransactionCount: number;
  spendingByCategory: DashboardCategorySpendDto[];
  spendingByPeriod: DashboardPeriodSpendDto[];
  recentLargeTransactions: DashboardRecentTransactionDto[];
};

type SearchParams = Record<string, string | string[] | undefined>;
type DashboardPageOptions = {
  persistedRange?: string | null;
  now?: Date;
};

const emptySummary: DashboardSummaryDto = {
  totalSpend: 0,
  transactionCount: 0,
  categorizedCount: 0,
  uncategorizedCount: 0,
  averageSpend: 0,
};

const emptyImportHealth: DashboardImportHealthDto = {
  parsedCount: 0,
  failedCount: 0,
  unparseableCount: 0,
};

function emptyDashboardData(
  user: DashboardPageData["user"],
  range: DashboardPageData["range"],
  message: string
): DashboardPageData {
  return {
    status: "error",
    message,
    range,
    rangeLabel: range.label,
    user,
    summary: emptySummary,
    importHealth: emptyImportHealth,
    largeTransactionCount: 0,
    spendingByCategory: [],
    spendingByPeriod: [],
    recentLargeTransactions: [],
  };
}

export async function getDashboardPageData(
  searchParams: SearchParams,
  options: DashboardPageOptions = {}
): Promise<DashboardPageData> {
  const sessionUser = await requirePageSessionUser();
  const rangeState = getDashboardRangeState({
    searchParams,
    persistedRange: options.persistedRange,
    now: options.now,
  });
  const range = {
    value: rangeState.range,
    label: rangeState.label,
    startDate: rangeState.startDate,
    endDate: rangeState.endDate,
    granularity: rangeState.granularity,
  };
  const user = {
    name: sessionUser.name,
    email: sessionUser.email,
    image: sessionUser.image,
  };
  const rangeInput = {
    userUuid: sessionUser.userUuid,
    startDate: rangeState.serviceStartDate,
    endDate: rangeState.serviceEndDate,
  };

  const [summary, spendingByCategory, importHealth, largeTransactionCount, recentLargeTransactions] =
    await Promise.all([
      getDashboardSummary(rangeInput),
      getSpendingByCategory(rangeInput),
      getImportHealth(rangeInput),
      getLargeTransactionCount({
        ...rangeInput,
        minimumAmount: LARGE_TRANSACTION_THRESHOLD,
      }),
      getRecentLargeTransactions({
        ...rangeInput,
        take: 5,
      }),
    ]);

  let spendingByPeriod = await getSpendingByPeriod({
    ...rangeInput,
    granularity: rangeState.granularity,
  });

  if (
    rangeState.range === "all-time" &&
    spendingByPeriod.ok &&
    spendingByPeriod.data.length > 36
  ) {
    spendingByPeriod = await getSpendingByPeriod({
      ...rangeInput,
      granularity: "year",
    });
    range.granularity = "year";
  }

  if (
    !summary.ok ||
    !spendingByCategory.ok ||
    !spendingByPeriod.ok ||
    !importHealth.ok ||
    !largeTransactionCount.ok ||
    !recentLargeTransactions.ok
  ) {
    return emptyDashboardData(
      user,
      range,
      "Dashboard data is temporarily unavailable. Try again in a moment."
    );
  }

  return {
    status: "ready",
    message: null,
    range,
    rangeLabel: range.label,
    user,
    summary: summary.data,
    importHealth: importHealth.data,
    largeTransactionCount: largeTransactionCount.data,
    spendingByCategory: spendingByCategory.data,
    spendingByPeriod: spendingByPeriod.data,
    recentLargeTransactions: recentLargeTransactions.data,
  };
}
