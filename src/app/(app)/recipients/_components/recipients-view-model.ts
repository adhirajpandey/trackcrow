import type {
  RecipientIdentifierChip,
  RecipientsControlState,
  RecipientsPageData,
  RecipientsQueryResult,
} from "@/features/recipients/types";

function getBaseParams(
  filters: RecipientsControlState,
  overrides: Partial<Pick<RecipientsControlState, "q">> = {}
) {
  const nextFilters = {
    ...filters,
    ...overrides,
  };
  const params = new URLSearchParams();

  if (nextFilters.q) {
    params.set("q", nextFilters.q);
  }

  return params;
}

function toHref(params: URLSearchParams) {
  const query = params.toString();
  return query ? `/recipients?${query}` : "/recipients";
}

function getIdentifierTone(kind: string): RecipientIdentifierChip["tone"] {
  switch (kind) {
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
      const identifierChips = recipient.identifiers.slice(0, 2).map((identifier) => ({
        id: identifier.uuid,
        tone: getIdentifierTone(identifier.kind),
        value: identifier.value,
      }));

      return {
        id: recipient.id,
        uuid: recipient.uuid,
        displayName: recipient.displayName,
        transactionCount: recipient.transactionCount,
        totalAmount: recipient.totalAmount,
        secondaryLabel:
          recipient.identifiers.length === 1
            ? "1 identifier"
            : `${recipient.identifiers.length} identifiers`,
        identifierChips,
        overflowIdentifierCount: Math.max(0, recipient.identifiers.length - identifierChips.length),
      };
    }),
    filters: input.filters,
    pagination: input.result.pagination,
    emptyState:
      input.result.status === "error"
        ? "none"
        : input.result.pagination.total === 0
          ? input.filters.q
            ? "filtered"
            : "empty"
          : "none",
  };
}
