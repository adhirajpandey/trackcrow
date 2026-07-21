import type {
  RecipientAliasChip,
  RecipientsControlState,
  RecipientsPageData,
  RecipientsQueryResult,
} from "@/features/recipients/types";

function getBaseParams(
  filters: RecipientsControlState,
  overrides: Partial<RecipientsControlState> = {}
) {
  const nextFilters = {
    ...filters,
    ...overrides,
  };
  const params = new URLSearchParams();

  if (nextFilters.q) {
    params.set("q", nextFilters.q);
  }

  if (nextFilters.minTransactionCount !== null) {
    params.set("minTransactionCount", String(nextFilters.minTransactionCount));
  }
  if (nextFilters.maxTransactionCount !== null) {
    params.set("maxTransactionCount", String(nextFilters.maxTransactionCount));
  }
  if (nextFilters.minTotalAmount !== null) {
    params.set("minTotalAmount", String(nextFilters.minTotalAmount));
  }
  if (nextFilters.maxTotalAmount !== null) {
    params.set("maxTotalAmount", String(nextFilters.maxTotalAmount));
  }

  return params;
}

function toHref(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/recipients?${query}` : "/recipients";
}

function getAliasTone(aliasType: string): RecipientAliasChip["tone"] {
  switch (aliasType) {
    case "UPI_ID":
      return "upi";
    case "TEXT":
      return "text";
    case "CARD_MERCHANT":
      return "card";
    default:
      return "default";
  }
}

export function buildPageHref(filters: RecipientsControlState, page: number) {
  const params = getBaseParams(filters);
  params.set("page", String(page));
  params.set("size", String(filters.pageSize));
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);
  return toHref(params);
}

export function buildSortHref(
  filters: RecipientsControlState,
  sortBy: RecipientsControlState["sortBy"]
) {
  const params = getBaseParams(filters);
  params.set("page", "1");
  params.set("size", String(filters.pageSize));
  if (filters.sortBy === sortBy) {
    params.set("sortBy", sortBy);
    params.set("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc");
  } else {
    params.set("sortBy", sortBy);
    params.set(
      "sortOrder",
      sortBy === "displayName" ? "asc" : "desc"
    );
  }

  return toHref(params);
}

export function buildSearchHref(filters: RecipientsControlState, q: string) {
  const params = getBaseParams(filters, {
    q: q.trim() || undefined,
  });
  params.set("page", "1");
  params.set("size", String(filters.pageSize));
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);
  return toHref(params);
}

export function buildApplyFiltersHref(filters: RecipientsControlState) {
  const params = getBaseParams(filters, { q: filters.q.trim() });
  params.set("page", "1");
  params.set("size", String(filters.pageSize));
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);
  return toHref(params);
}

export function buildResetFiltersState(
  filters: RecipientsControlState
): RecipientsControlState {
  return {
    ...filters,
    q: "",
    page: 1,
    sortBy: "transactionCount",
    sortOrder: "desc",
    minTransactionCount: null,
    maxTransactionCount: null,
    minTotalAmount: null,
    maxTotalAmount: null,
  };
}

export function buildResetFiltersHref(filters: RecipientsControlState) {
  return buildApplyFiltersHref(buildResetFiltersState(filters));
}

export function hasRecipientFilters(filters: RecipientsControlState) {
  return Boolean(
    filters.q ||
      filters.minTransactionCount !== null ||
      filters.maxTransactionCount !== null ||
      filters.minTotalAmount !== null ||
      filters.maxTotalAmount !== null ||
      filters.sortBy !== "transactionCount" ||
      filters.sortOrder !== "desc"
  );
}

export function getRecipientRangeError(
  minimum: number | null,
  maximum: number | null,
  label: string
) {
  if (minimum !== null && maximum !== null && minimum > maximum) {
    return `${label} maximum must be at least the minimum.`;
  }
  return null;
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

export function buildFooterSummary(pagination: RecipientsPageData["pagination"]) {
  if (pagination.total === 0 || pagination.page > pagination.totalPages) {
    return `Showing 0 to 0 of ${pagination.total} recipients`;
  }

  const start = (pagination.page - 1) * pagination.pageSize + 1;
  const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
  return `Showing ${start} to ${end} of ${pagination.total} recipients`;
}

export function getSortDirection(
  filters: RecipientsControlState,
  column: RecipientsControlState["sortBy"]
) {
  return filters.sortBy === column ? filters.sortOrder : null;
}

export function buildRecipientsPageData(input: {
  filters: RecipientsControlState;
  result: RecipientsQueryResult;
}): RecipientsPageData {
  return {
    status: input.result.status,
    message: input.result.message,
    rows: input.result.recipients.map((recipient) => {
      const aliasChips = recipient.aliases.slice(0, 2).map((alias) => ({
        id: alias.uuid,
        tone: getAliasTone(alias.aliasType),
        value: alias.value,
      }));

      return {
        uuid: recipient.uuid,
        displayName: recipient.displayName,
        transactionCount: recipient.transactionCount,
        totalAmount: recipient.totalAmount,
        secondaryLabel:
          recipient.aliases.length === 1
            ? "1 alias"
            : `${recipient.aliases.length} aliases`,
        aliasChips,
        overflowAliasCount: Math.max(0, recipient.aliases.length - aliasChips.length),
      };
    }),
    filters: input.filters,
    pagination: input.result.pagination,
    emptyState:
      input.result.status === "error"
        ? "none"
        : input.result.pagination.total === 0
          ? input.filters.q ||
            input.filters.minTransactionCount !== null ||
            input.filters.maxTransactionCount !== null ||
            input.filters.minTotalAmount !== null ||
            input.filters.maxTotalAmount !== null
            ? "filtered"
            : "empty"
          : "none",
  };
}
