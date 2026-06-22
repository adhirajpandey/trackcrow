import type { CategoryOption } from "@/common/types";
import type { DashboardRangeValue } from "@/features/dashboard/query-state";
import { formatDate, toDate } from "@/common/utils";
import type { TransactionsPageData } from "@/server/page-data/transactions-page-data";
import { formatCurrency } from "@/app/(app)/dashboard/_components/dashboard-view-model";

type LinkValue = string | number | null | undefined;
type TransactionsFilters = TransactionsPageData["filters"];

const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kolkata",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatTime(value: string) {
  return timeFormatter.format(toDate(value));
}

function getBaseParams(
  filters: TransactionsFilters,
  overrides: Partial<
    Pick<
      TransactionsFilters,
      | "q"
      | "range"
      | "startDate"
      | "endDate"
      | "categories"
      | "selectedTransactionUuid"
      | "review"
      | "status"
    >
  > = {}
) {
  const nextFilters = {
    ...filters,
    ...overrides,
  };
  const params = new URLSearchParams();

  params.set("range", nextFilters.range);
  if (nextFilters.q) {
    params.set("q", nextFilters.q);
  }
  if (nextFilters.range === "custom" && nextFilters.startDate) {
    params.set("startDate", nextFilters.startDate);
  }
  if (nextFilters.range === "custom" && nextFilters.endDate) {
    params.set("endDate", nextFilters.endDate);
  }
  for (const category of nextFilters.categories) {
    params.append("category", category);
  }
  if (nextFilters.selectedTransactionUuid) {
    params.set("transaction", nextFilters.selectedTransactionUuid);
  }
  if (nextFilters.review) {
    params.set("review", nextFilters.review);
  }
  if (nextFilters.status) {
    params.set("status", nextFilters.status);
  }

  return params;
}

function toHref(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/transactions?${query}` : "/transactions";
}

export function buildPageHref(
  filters: TransactionsFilters,
  page: number
) {
  const params = getBaseParams(filters);
  params.set("page", String(page));
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);
  return toHref(params);
}

export function buildSortHref(
  filters: TransactionsFilters,
  sortBy: TransactionsFilters["sortBy"]
) {
  const params = getBaseParams(filters);
  params.set("page", "1");
  if (filters.sortBy === sortBy) {
    params.set("sortBy", sortBy);
    params.set("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc");
  } else {
    params.set("sortBy", sortBy);
    params.set("sortOrder", "desc");
  }

  return toHref(params);
}

export function buildSearchHref(filters: TransactionsFilters, q: string) {
  const params = getBaseParams(filters, {
    q: q.trim() || null,
  });
  params.set("page", "1");
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);
  return toHref(params);
}

export function buildPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 1) {
    return [1];
  }

  const pages = new Set<number>([
    1,
    totalPages,
    currentPage - 1,
    currentPage,
    currentPage + 1,
  ]);
  const normalizedPages = [...pages]
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);
  const items: Array<number | "ellipsis"> = [];

  normalizedPages.forEach((page, index) => {
    const previous = normalizedPages[index - 1];
    if (index > 0 && previous && page - previous > 1) {
      items.push("ellipsis");
    }
    items.push(page);
  });

  return items;
}

export function buildFooterSummary(pagination: TransactionsPageData["pagination"]) {
  if (pagination.total === 0) {
    return "Showing 0 to 0 of 0 transactions";
  }

  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
  return `Showing ${start} to ${end} of ${pagination.total} transactions`;
}

export function getSortDirection(
  filters: TransactionsFilters,
  column: TransactionsFilters["sortBy"]
) {
  return filters.sortBy === column ? filters.sortOrder : null;
}

export function buildCategoryOptions(categories: CategoryOption[]) {
  return categories.map((category) => ({
    value: category.name,
    label: category.name,
  }));
}

export function buildCategoryTriggerLabel(filters: TransactionsFilters) {
  if (filters.categories.length === 0) {
    return "All categories";
  }

  if (filters.categories.length === 1) {
    return filters.categories[0] ?? "All categories";
  }

  return `${filters.categories.length} categories`;
}

function buildCategoryHref(
  filters: TransactionsFilters,
  categories: string[]
) {
  const nextStatus =
    filters.status === "uncategorized" &&
    categories.some((category) => category.toLowerCase() === "uncategorized")
      ? "uncategorized"
      : null;

  const params = getBaseParams(filters, {
    categories,
    status: nextStatus,
  });
  params.set("page", "1");
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);
  return toHref(params);
}

export function buildClearCategoriesHref(filters: TransactionsFilters) {
  return buildCategoryHref(filters, []);
}

export function buildToggleCategoryHref(
  filters: TransactionsFilters,
  category: string
) {
  const nextCategories = filters.categories.includes(category)
    ? filters.categories.filter((value) => value !== category)
    : [...filters.categories, category];

  return buildCategoryHref(filters, nextCategories);
}

export function formatTransactionDateLabel(timestamp: string) {
  return formatDate(timestamp);
}

export function formatTransactionTimeLabel(timestamp: string) {
  return formatTime(timestamp);
}

export function formatTransactionAmount(amount: number) {
  return formatCurrency(amount);
}

export function buildResetHref() {
  const params = new URLSearchParams();
  params.set("range", "all-time");
  params.set("sortBy", "timestamp");
  params.set("sortOrder", "desc");
  return toHref(params);
}

export function buildFilterFormHiddenParams(filters: TransactionsFilters) {
  const hiddenParams: Array<{ name: string; value: LinkValue }> = [];
  hiddenParams.push({ name: "range", value: filters.range });
  hiddenParams.push({ name: "sortBy", value: filters.sortBy });
  hiddenParams.push({ name: "sortOrder", value: filters.sortOrder });
  if (filters.range === "custom") {
    hiddenParams.push({ name: "startDate", value: filters.startDate });
    hiddenParams.push({ name: "endDate", value: filters.endDate });
  }
  if (filters.selectedTransactionUuid) {
    hiddenParams.push({ name: "transaction", value: filters.selectedTransactionUuid });
  }
  if (filters.review) {
    hiddenParams.push({ name: "review", value: filters.review });
  }
  if (filters.status) {
    hiddenParams.push({ name: "status", value: filters.status });
  }
  for (const category of filters.categories) {
    hiddenParams.push({ name: "category", value: category });
  }
  return hiddenParams;
}

export function buildTransactionsRangeHref(
  filters: TransactionsFilters,
  range: DashboardRangeValue,
  startDate?: string,
  endDate?: string
) {
  const params = getBaseParams(filters, {
    range,
    startDate: range === "custom" ? startDate ?? null : null,
    endDate: range === "custom" ? endDate ?? null : null,
  });
  params.set("page", "1");
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);

  return toHref(params);
}
