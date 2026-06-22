import "server-only";

import type { CategoryOption, TransactionListResponse, TransactionRecord } from "@/common/types";
import { formatRecipientDisplayLabel } from "@/common/recipient-display";
import {
  getDashboardRangeState,
  type DashboardRangeValue,
} from "@/features/dashboard/query-state";
import { getApiErrorMessage, getCategories, getTransactions } from "@/lib/internal-api";
import { requirePageSessionUser } from "@/server/auth/session";

type SearchParams = Record<string, string | string[] | undefined>;
type TransactionSortBy = "timestamp" | "amount";
type TransactionSortOrder = "asc" | "desc";
type TransactionReview = "queue" | "large";
type TransactionStatus = "uncategorized";

export type TransactionsPageRow = {
  id: number;
  uuid: string;
  recipient: string;
  amount: number;
  category: string | null;
  source: TransactionRecord["source"];
  timestamp: string;
  isSelected: boolean;
};

export type TransactionsPageData = {
  status: "ready" | "error";
  message: string | null;
  rows: TransactionsPageRow[];
  categories: CategoryOption[];
  filters: {
    q: string;
    range: DashboardRangeValue;
    rangeLabel: string;
    startDate: string | null;
    endDate: string | null;
    categories: string[];
    page: number;
    sortBy: TransactionSortBy;
    sortOrder: TransactionSortOrder;
    selectedTransactionUuid: string | null;
    review: TransactionReview | null;
    status: TransactionStatus | null;
  };
  pagination: Pick<
    TransactionListResponse,
    "page" | "pageSize" | "total" | "totalPages" | "hasNext" | "hasPrev"
  >;
  drilldownLabel: string | null;
};

const pageSize = 10;
const sortByOptions = new Set<TransactionSortBy>(["timestamp", "amount"]);
const sortOrderOptions = new Set<TransactionSortOrder>(["asc", "desc"]);
const dashboardRangeValues = new Set([
  "this-month",
  "last-30-days",
  "last-90-days",
  "last-month",
  "last-3-months",
  "last-6-months",
  "this-year",
  "last-12-months",
  "all-time",
  "custom",
] satisfies DashboardRangeValue[]);

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function getRepeatedParams(value: string | string[] | undefined) {
  if (!value) {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];
  return values
    .flatMap((item) => item.split(","))
    .map((item) => item.trim())
    .filter(Boolean);
}

function parsePage(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return Math.floor(parsed);
}

function parseSortBy(value: string | undefined): TransactionSortBy {
  return sortByOptions.has(value as TransactionSortBy)
    ? (value as TransactionSortBy)
    : "timestamp";
}

function parseSortOrder(value: string | undefined): TransactionSortOrder {
  return sortOrderOptions.has(value as TransactionSortOrder)
    ? (value as TransactionSortOrder)
    : "desc";
}

function parseReview(value: string | undefined): TransactionReview | null {
  return value === "queue" || value === "large" ? value : null;
}

function parseStatus(value: string | undefined): TransactionStatus | null {
  return value === "uncategorized" ? value : null;
}

function parseDateParam(value: string | undefined) {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  return value;
}

function getTransactionsRangeState(searchParams: SearchParams) {
  const requestedRange = firstParam(searchParams.range);
  const hasValidRange = dashboardRangeValues.has(requestedRange as DashboardRangeValue);
  const shouldFallbackToAllTime =
    !hasValidRange ||
    (requestedRange === "custom" &&
      (!parseDateParam(firstParam(searchParams.startDate)) ||
        !parseDateParam(firstParam(searchParams.endDate))));

  return getDashboardRangeState({
    searchParams: shouldFallbackToAllTime
      ? { ...searchParams, range: "all-time", startDate: undefined, endDate: undefined }
      : searchParams,
    persistedRange: "all-time",
  });
}

function mapDrilldownLabel(searchParams: SearchParams) {
  const review = firstParam(searchParams.review);
  if (review === "queue") {
    return "Review queue drilldown";
  }

  if (review === "large") {
    return "Large transactions drilldown";
  }

  if (firstParam(searchParams.status) === "uncategorized") {
    return "Uncategorized transactions";
  }

  return null;
}

function toRow(
  transaction: TransactionRecord,
  selectedTransactionUuid: string | null
): TransactionsPageRow {
  return {
    id: transaction.id,
    uuid: transaction.uuid,
    recipient: formatRecipientDisplayLabel({
      recipientName: transaction.recipientName,
      recipientDisplayName: transaction.recipientDisplayName,
      recipientRaw: transaction.recipientRaw,
      fallbackLabel: "Unknown recipient",
    }),
    amount: transaction.amount,
    category: transaction.category,
    source: transaction.source,
    timestamp: transaction.timestamp,
    isSelected: selectedTransactionUuid === transaction.uuid,
  };
}

export async function getTransactionsPageData(
  searchParams: SearchParams
): Promise<TransactionsPageData> {
  await requirePageSessionUser();

  const rangeState = getTransactionsRangeState(searchParams);
  const q = firstParam(searchParams.q)?.trim() ?? "";
  const startDate = parseDateParam(rangeState.startDate ?? undefined);
  const endDate = parseDateParam(rangeState.endDate ?? undefined);
  const sortBy = parseSortBy(firstParam(searchParams.sortBy));
  const sortOrder = parseSortOrder(firstParam(searchParams.sortOrder));
  const page = parsePage(firstParam(searchParams.page));
  const selectedTransactionUuid = firstParam(searchParams.transaction)?.trim() ?? null;
  const review = parseReview(firstParam(searchParams.review));
  const status = parseStatus(firstParam(searchParams.status));
  const rawCategories = getRepeatedParams(searchParams.category);
  const categories = [...new Set(rawCategories)];
  const normalizedCategories =
    status === "uncategorized" &&
    !categories.some((category) => category.toLowerCase() === "uncategorized")
      ? [...categories, "Uncategorized"]
      : categories;

  const params = new URLSearchParams();
  if (q) {
    params.set("q", q);
  }
  if (startDate) {
    params.set("startDate", startDate);
  }
  if (endDate) {
    params.set("endDate", endDate);
  }
  for (const category of normalizedCategories) {
    params.append("category", category);
  }
  params.set("page", String(page));
  params.set("size", String(pageSize));
  params.set("sortBy", sortBy);
  params.set("sortOrder", sortOrder);

  try {
    const [transactions, categoriesResponse] = await Promise.all([
      getTransactions(`?${params.toString()}`),
      getCategories(),
    ]);

    return {
      status: "ready",
      message: null,
      rows: transactions.transactions.map((transaction) =>
        toRow(transaction, selectedTransactionUuid)
      ),
      categories: categoriesResponse,
      filters: {
        q,
        range: rangeState.range,
        rangeLabel: rangeState.label,
        startDate,
        endDate,
        categories: normalizedCategories,
        page: transactions.page,
        sortBy,
        sortOrder,
        selectedTransactionUuid,
        review,
        status,
      },
      pagination: {
        page: transactions.page,
        pageSize: transactions.pageSize,
        total: transactions.total,
        totalPages: transactions.totalPages,
        hasNext: transactions.hasNext,
        hasPrev: transactions.hasPrev,
      },
      drilldownLabel: mapDrilldownLabel(searchParams),
    };
  } catch (error) {
    return {
      status: "error",
      message: getApiErrorMessage(
        error,
        "Transactions are temporarily unavailable. Try again in a moment."
      ),
      rows: [],
      categories: [],
      filters: {
        q,
        range: rangeState.range,
        rangeLabel: rangeState.label,
        startDate,
        endDate,
        categories: normalizedCategories,
        page: 1,
        sortBy,
        sortOrder,
        selectedTransactionUuid,
        review,
        status,
      },
      pagination: {
        page: 1,
        pageSize,
        total: 0,
        totalPages: 0,
        hasNext: false,
        hasPrev: false,
      },
      drilldownLabel: mapDrilldownLabel(searchParams),
    };
  }
}
