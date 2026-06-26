import type {
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

function normalizeIdentifierKind(kind: string) {
  switch (kind) {
    case "UPI_ID":
      return "UPI";
    case "CARD_MERCHANT":
      return "CARD";
    default:
      return kind.replace(/_/g, " ");
  }
}

function matchesRecipientSearch(
  recipient: RecipientsQueryResult["recipients"][number],
  search: string
) {
  const normalizedSearch = search.trim().toLowerCase();
  if (!normalizedSearch) {
    return true;
  }

  if (
    recipient.displayName.toLowerCase().includes(normalizedSearch) ||
    recipient.normalizedName.toLowerCase().includes(normalizedSearch)
  ) {
    return true;
  }

  return recipient.identifiers.some((identifier) => {
    return (
      identifier.value.toLowerCase().includes(normalizedSearch) ||
      identifier.normalizedValue.toLowerCase().includes(normalizedSearch) ||
      normalizeIdentifierKind(identifier.kind).toLowerCase().includes(normalizedSearch)
    );
  });
}

function compareRecipients(
  left: RecipientsQueryResult["recipients"][number],
  right: RecipientsQueryResult["recipients"][number],
  filters: RecipientsControlState
) {
  if (filters.sortBy === "transactionCount") {
    const countDelta = left.transactionCount - right.transactionCount;
    if (countDelta !== 0) {
      return filters.sortOrder === "asc" ? countDelta : -countDelta;
    }
  }

  const nameDelta = left.displayName.localeCompare(right.displayName, undefined, {
    sensitivity: "base",
  });
  if (nameDelta !== 0) {
    if (filters.sortBy === "displayName") {
      return filters.sortOrder === "asc" ? nameDelta : -nameDelta;
    }

    return nameDelta;
  }

  const secondaryCountDelta = left.transactionCount - right.transactionCount;
  return filters.sortOrder === "asc" ? secondaryCountDelta : -secondaryCountDelta;
}

export function buildPageHref(filters: RecipientsControlState, page: number) {
  const params = getBaseParams(filters);
  params.set("page", String(page));
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
  if (filters.sortBy === sortBy) {
    params.set("sortBy", sortBy);
    params.set("sortOrder", filters.sortOrder === "asc" ? "desc" : "asc");
  } else {
    params.set("sortBy", sortBy);
    params.set("sortOrder", sortBy === "transactionCount" ? "desc" : "asc");
  }

  return toHref(params);
}

export function buildSearchHref(filters: RecipientsControlState, q: string) {
  const params = getBaseParams(filters, {
    q: q.trim() || undefined,
  });
  params.set("page", "1");
  params.set("sortBy", filters.sortBy);
  params.set("sortOrder", filters.sortOrder);
  return toHref(params);
}

export function buildResetHref() {
  const params = new URLSearchParams();
  params.set("sortBy", "displayName");
  params.set("sortOrder", "asc");
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
  if (pagination.total === 0) {
    return "Showing 0 to 0 of 0 recipients";
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
  const filteredRecipients = input.result.recipients
    .filter((recipient) => matchesRecipientSearch(recipient, input.filters.q))
    .sort((left, right) => compareRecipients(left, right, input.filters));
  const total = filteredRecipients.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / input.filters.pageSize);
  const currentPage = totalPages === 0 ? 1 : Math.min(input.filters.page, totalPages);
  const startIndex = (currentPage - 1) * input.filters.pageSize;
  const visibleRecipients = filteredRecipients.slice(
    startIndex,
    startIndex + input.filters.pageSize
  );

  return {
    status: input.result.status,
    message: input.result.message,
    rows: visibleRecipients.map((recipient) => {
      const identifierChips = recipient.identifiers.slice(0, 2).map((identifier) => ({
        id: identifier.uuid,
        label: normalizeIdentifierKind(identifier.kind),
        value: identifier.value,
      }));

      return {
        id: recipient.id,
        uuid: recipient.uuid,
        displayName: recipient.displayName,
        normalizedName: recipient.normalizedName,
        transactionCount: recipient.transactionCount,
        status: recipient.transactionCount > 0 ? "active" : "empty",
        secondaryLabel:
          recipient.identifiers.length === 1
            ? "1 identifier"
            : `${recipient.identifiers.length} identifiers`,
        identifierChips,
        overflowIdentifierCount: Math.max(0, recipient.identifiers.length - identifierChips.length),
      };
    }),
    filters: {
      ...input.filters,
      page: currentPage,
    },
    pagination: {
      page: currentPage,
      pageSize: input.filters.pageSize,
      total,
      totalPages,
      hasNext: totalPages > 0 && currentPage < totalPages,
      hasPrev: totalPages > 0 && currentPage > 1,
    },
    emptyState:
      input.result.status === "error"
        ? "none"
        : input.result.recipients.length === 0
          ? "empty"
          : filteredRecipients.length === 0
            ? "filtered"
            : "none",
  };
}
