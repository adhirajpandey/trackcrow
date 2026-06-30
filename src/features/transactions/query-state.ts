import type { CategoryOption, TransactionListResponse, TransactionRecord } from "@/common/types";
import { formatRecipientDisplayLabel } from "@/common/recipient-display";
import {
  getDashboardRangeState,
  type DashboardRangeValue,
} from "@/features/dashboard/query-state";

import type {
  TransactionReview,
  TransactionsApiQuery,
  TransactionsControlState,
  TransactionsPageData,
  TransactionsPageRow,
  TransactionsPagination,
  TransactionsQueryResult,
  TransactionsQueryRow,
  TransactionsViewState,
  TransactionSortBy,
  TransactionSortOrder,
  TransactionStatus,
} from "./types";

export type TransactionsSearchParams = Record<string, string | string[] | undefined>;

export type TransactionsPageState = {
  query: TransactionsApiQuery;
  view: TransactionsViewState;
};

export const transactionsPageSize = 10;

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

function parsePageSize(value: string | undefined) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return transactionsPageSize;
  }

  return Math.min(100, Math.floor(parsed));
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

function getTransactionsRangeState(
  searchParams: TransactionsSearchParams,
  persistedRange?: string | null
) {
  const requestedRange = firstParam(searchParams.range);
  const hasValidRange = dashboardRangeValues.has(requestedRange as DashboardRangeValue);
  const hasInvalidCustomRange =
    requestedRange === "custom" &&
    (!parseDateParam(firstParam(searchParams.startDate)) ||
      !parseDateParam(firstParam(searchParams.endDate)));
  const normalizedSearchParams =
    hasValidRange && !hasInvalidCustomRange
      ? searchParams
      : hasInvalidCustomRange
        ? { ...searchParams, range: "all-time", startDate: undefined, endDate: undefined }
        : { ...searchParams, range: undefined, startDate: undefined, endDate: undefined };

  return getDashboardRangeState({
    searchParams: normalizedSearchParams,
    persistedRange: persistedRange ?? "all-time",
  });
}

function getSelectedCategorySubcategories(
  availableCategories: CategoryOption[] | undefined,
  selectedCategories: string[]
) {
  if (!availableCategories || availableCategories.length === 0) {
    return null;
  }

  const selectedCategoryNames = new Set(
    selectedCategories
      .filter((category) => category.toLowerCase() !== "uncategorized")
      .map((category) => category.toLowerCase())
  );

  if (selectedCategoryNames.size === 0) {
    return new Set<string>();
  }

  const subcategories = new Set<string>();
  for (const category of availableCategories) {
    if (!selectedCategoryNames.has(category.name.toLowerCase())) {
      continue;
    }

    for (const subcategory of category.subcategories) {
      subcategories.add(subcategory.name);
    }
  }

  return subcategories;
}

function toQueryRow(transaction: TransactionRecord): TransactionsQueryRow {
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
  };
}

function normalizeCategories(categories: string[]) {
  return [...categories].sort((left, right) =>
    left.localeCompare(right, undefined, { sensitivity: "base" })
  );
}

export function getTransactionsPageState(
  searchParams: TransactionsSearchParams,
  options: {
    persistedRange?: string | null;
    categories?: CategoryOption[];
  } = {}
): TransactionsPageState {
  const rangeState = getTransactionsRangeState(searchParams, options.persistedRange);
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
  const normalizedSortedCategories = normalizeCategories(normalizedCategories);
  const rawSubcategories = getRepeatedParams(searchParams.subcategory);
  const allowedSubcategories = getSelectedCategorySubcategories(
    options.categories,
    normalizedSortedCategories
  );
  const normalizedSubcategories =
    allowedSubcategories === null
      ? rawSubcategories
      : rawSubcategories.filter((subcategory) => allowedSubcategories.has(subcategory));

  return {
    query: {
      q,
      startDate,
      endDate,
      categories: normalizedSortedCategories,
      subcategories: normalizeCategories([...new Set(normalizedSubcategories)]),
      page,
      pageSize: parsePageSize(firstParam(searchParams.size)),
      sortBy,
      sortOrder,
    },
    view: {
      range: rangeState.range,
      rangeLabel: rangeState.label,
      selectedTransactionUuid,
      review,
      status,
    },
  };
}

export function isSameTransactionsQuery(
  left: TransactionsApiQuery,
  right: TransactionsApiQuery
) {
  return (
    left.q === right.q &&
    left.startDate === right.startDate &&
    left.endDate === right.endDate &&
    left.page === right.page &&
    left.pageSize === right.pageSize &&
    left.sortBy === right.sortBy &&
    left.sortOrder === right.sortOrder &&
    left.categories.length === right.categories.length &&
    left.categories.every((category, index) => category === right.categories[index]) &&
    left.subcategories.length === right.subcategories.length &&
    left.subcategories.every((subcategory, index) => subcategory === right.subcategories[index])
  );
}

export function buildTransactionsApiSearchParams(query: TransactionsApiQuery) {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }
  if (query.startDate) {
    params.set("startDate", query.startDate);
  }
  if (query.endDate) {
    params.set("endDate", query.endDate);
  }
  for (const category of query.categories) {
    params.append("category", category);
  }
  for (const subcategory of query.subcategories) {
    params.append("subcategory", subcategory);
  }

  params.set("page", String(query.page));
  params.set("size", String(query.pageSize));
  params.set("sortBy", query.sortBy);
  params.set("sortOrder", query.sortOrder);

  return params;
}

export function buildTransactionsQueryResult(input: {
  transactions: TransactionListResponse;
}): TransactionsQueryResult {
  return {
    status: "ready",
    message: null,
    rows: input.transactions.transactions.map(toQueryRow),
    pagination: {
      page: input.transactions.page,
      pageSize: input.transactions.pageSize,
      total: input.transactions.total,
      totalPages: input.transactions.totalPages,
      hasNext: input.transactions.hasNext,
      hasPrev: input.transactions.hasPrev,
    },
  };
}

export function buildTransactionsErrorQueryResult(
  query: TransactionsApiQuery,
  message: string
): TransactionsQueryResult {
  return {
    status: "error",
    message,
    rows: [],
    pagination: {
      page: 1,
      pageSize: query.pageSize,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false,
    },
  };
}

export function buildTransactionsControlState(input: {
  query: TransactionsApiQuery;
  view: TransactionsViewState;
  pagination: TransactionsPagination;
}): TransactionsControlState {
  return {
    ...input.query,
    page: input.pagination.page,
    pageSize: input.pagination.pageSize,
    range: input.view.range,
    rangeLabel: input.view.rangeLabel,
    selectedTransactionUuid: input.view.selectedTransactionUuid,
    review: input.view.review,
    status: input.view.status,
  };
}

export function buildTransactionsPageData(input: {
  query: TransactionsApiQuery;
  view: TransactionsViewState;
  result: TransactionsQueryResult;
  categories: CategoryOption[];
}): TransactionsPageData {
  return {
    status: input.result.status,
    message: input.result.message,
    rows: input.result.rows.map((row): TransactionsPageRow => ({
      ...row,
      isSelected: input.view.selectedTransactionUuid === row.uuid,
    })),
    categories: input.categories,
    filters: buildTransactionsControlState({
      query: input.query,
      view: input.view,
      pagination: input.result.pagination,
    }),
    pagination: input.result.pagination,
  };
}

