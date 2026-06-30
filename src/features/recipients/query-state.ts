import type {
  RecipientListResponse,
  RecipientsApiQuery,
  RecipientsPagination,
  RecipientsQueryResult,
  RecipientSortBy,
  RecipientSortOrder,
} from "./types";

export type RecipientsSearchParams = Record<string, string | string[] | undefined>;

export type RecipientsPageState = {
  query: RecipientsApiQuery;
};

export const recipientsPageSize = 10;

const sortByOptions = new Set<RecipientSortBy>([
  "displayName",
  "transactionCount",
  "totalAmount",
]);
const sortOrderOptions = new Set<RecipientSortOrder>(["asc", "desc"]);

function firstParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
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
    return recipientsPageSize;
  }

  return Math.min(100, Math.floor(parsed));
}

function parseSortBy(value: string | undefined): RecipientSortBy {
  return sortByOptions.has(value as RecipientSortBy)
    ? (value as RecipientSortBy)
    : "transactionCount";
}

function parseSortOrder(value: string | undefined): RecipientSortOrder {
  return sortOrderOptions.has(value as RecipientSortOrder)
    ? (value as RecipientSortOrder)
    : "desc";
}

export function getRecipientsPageState(
  searchParams: RecipientsSearchParams
): RecipientsPageState {
  return {
    query: {
      q: firstParam(searchParams.q)?.trim() ?? "",
      page: parsePage(firstParam(searchParams.page)),
      pageSize: parsePageSize(firstParam(searchParams.size)),
      sortBy: parseSortBy(firstParam(searchParams.sortBy)),
      sortOrder: parseSortOrder(firstParam(searchParams.sortOrder)),
    },
  };
}

export function isSameRecipientsQuery(left: RecipientsApiQuery, right: RecipientsApiQuery) {
  return (
    left.q === right.q &&
    left.page === right.page &&
    left.pageSize === right.pageSize &&
    left.sortBy === right.sortBy &&
    left.sortOrder === right.sortOrder
  );
}

export function buildRecipientsApiSearchParams(query: RecipientsApiQuery) {
  const params = new URLSearchParams();

  if (query.q) {
    params.set("q", query.q);
  }

  params.set("page", String(query.page));
  params.set("size", String(query.pageSize));
  params.set("sortBy", query.sortBy);
  params.set("sortOrder", query.sortOrder);

  return params;
}

function toRecipientsPagination(response: RecipientListResponse): RecipientsPagination {
  return {
    page: response.page,
    pageSize: response.pageSize,
    total: response.total,
    totalPages: response.totalPages,
    hasNext: response.hasNext,
    hasPrev: response.hasPrev,
  };
}

export function buildRecipientsQueryResult(input: {
  recipients: RecipientListResponse;
}): RecipientsQueryResult {
  return {
    status: "ready",
    message: null,
    recipients: input.recipients.recipients,
    pagination: toRecipientsPagination(input.recipients),
  };
}

export function buildRecipientsErrorQueryResult(
  query: RecipientsApiQuery,
  message: string
): RecipientsQueryResult {
  return {
    status: "error",
    message,
    recipients: [],
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
