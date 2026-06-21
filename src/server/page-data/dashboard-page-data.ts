import "server-only";

import { LARGE_TRANSACTION_THRESHOLD } from "@/features/dashboard/constants";
import type { DashboardGranularity, DashboardRangeValue } from "@/features/dashboard/query-state";
import {
  getDashboardRangeState,
  getPreviousDashboardRangeState,
} from "@/features/dashboard/query-state";
import { requirePageSessionUser } from "@/server/auth/session";
import {
  getDashboardSummary,
  getImportHealth,
  getLargeTransactionCount,
  getRecentTransactions,
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

export type DashboardSectionStatus = {
  transactions: "ready" | "empty" | "error";
  categories: "ready" | "empty" | "incomplete" | "error";
  imports: "ready" | "empty" | "attention" | "error";
  comparison: "ready" | "unavailable";
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
  importIssueCount: number;
  sectionStatus: DashboardSectionStatus;
  comparison: {
    rangeLabel: string;
    summary: DashboardSummaryDto;
    spendingByCategory: DashboardCategorySpendDto[];
  } | null;
  spendingByCategory: DashboardCategorySpendDto[];
  spendingByPeriod: DashboardPeriodSpendDto[];
  recentLargeTransactions: DashboardRecentTransactionDto[];
  recentTransactions: DashboardRecentTransactionDto[];
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

const emptySectionStatus: DashboardSectionStatus = {
  transactions: "error",
  categories: "error",
  imports: "error",
  comparison: "unavailable",
};

function getDashboardSectionStatus(input: {
  summary: DashboardSummaryDto;
  importHealth: DashboardImportHealthDto;
  hasComparison: boolean;
}): DashboardSectionStatus {
  const importCount =
    input.importHealth.parsedCount +
    input.importHealth.failedCount +
    input.importHealth.unparseableCount;
  const importIssueCount =
    input.importHealth.failedCount + input.importHealth.unparseableCount;
  const hasTransactions = input.summary.transactionCount > 0;
  const hasCategorizedTransactions = input.summary.categorizedCount > 0;

  return {
    transactions: hasTransactions ? "ready" : "empty",
    categories: !hasTransactions
      ? "empty"
      : input.summary.uncategorizedCount > 0
        ? "incomplete"
        : hasCategorizedTransactions
          ? "ready"
          : "empty",
    imports:
      importCount === 0
        ? "empty"
        : importIssueCount > 0
          ? "attention"
          : "ready",
    comparison: input.hasComparison ? "ready" : "unavailable",
  };
}

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
    importIssueCount: 0,
    sectionStatus: emptySectionStatus,
    comparison: null,
    spendingByCategory: [],
    spendingByPeriod: [],
    recentLargeTransactions: [],
    recentTransactions: [],
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
  const previousRange = getPreviousDashboardRangeState(rangeState);
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

  const [
    summary,
    spendingByCategory,
    importHealth,
    largeTransactionCount,
    recentLargeTransactions,
    recentTransactions,
  ] = await Promise.all([
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
      getRecentTransactions({
        ...rangeInput,
        take: 10,
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
    !recentLargeTransactions.ok ||
    !recentTransactions.ok
  ) {
    return emptyDashboardData(
      user,
      range,
      "Dashboard data is temporarily unavailable. Try again in a moment."
    );
  }

  let comparison: DashboardPageData["comparison"] = null;
  if (previousRange) {
    const previousRangeInput = {
      userUuid: sessionUser.userUuid,
      startDate: previousRange.serviceStartDate,
      endDate: previousRange.serviceEndDate,
    };
    const [previousSummary, previousSpendingByCategory] = await Promise.all([
      getDashboardSummary(previousRangeInput),
      getSpendingByCategory(previousRangeInput),
    ]);

    if (previousSummary.ok && previousSpendingByCategory.ok) {
      comparison = {
        rangeLabel: previousRange.label,
        summary: previousSummary.data,
        spendingByCategory: previousSpendingByCategory.data,
      };
    }
  }

  const importIssueCount = importHealth.data.failedCount + importHealth.data.unparseableCount;
  const sectionStatus = getDashboardSectionStatus({
    summary: summary.data,
    importHealth: importHealth.data,
    hasComparison: Boolean(comparison),
  });

  return {
    status: "ready",
    message: null,
    range,
    rangeLabel: range.label,
    user,
    summary: summary.data,
    importHealth: importHealth.data,
    largeTransactionCount: largeTransactionCount.data,
    importIssueCount,
    sectionStatus,
    comparison,
    spendingByCategory: spendingByCategory.data,
    spendingByPeriod: spendingByPeriod.data,
    recentLargeTransactions: recentLargeTransactions.data,
    recentTransactions: recentTransactions.data,
  };
}
