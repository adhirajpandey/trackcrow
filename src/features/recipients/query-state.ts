import type {
  RecipientsApiQuery,
  RecipientsQueryResult,
  RecipientSortBy,
  RecipientSortOrder,
} from "./types";

export type RecipientsSearchParams = Record<string, string | string[] | undefined>;

export type RecipientsPageState = {
  query: RecipientsApiQuery;
};

export const recipientsPageSize = 10;

const sortByOptions = new Set<RecipientSortBy>(["displayName", "transactionCount"]);
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

function parseSortBy(value: string | undefined): RecipientSortBy {
  return sortByOptions.has(value as RecipientSortBy)
    ? (value as RecipientSortBy)
    : "displayName";
}

function parseSortOrder(value: string | undefined): RecipientSortOrder {
  return sortOrderOptions.has(value as RecipientSortOrder)
    ? (value as RecipientSortOrder)
    : "asc";
}

export function getRecipientsPageState(
  searchParams: RecipientsSearchParams
): RecipientsPageState {
  return {
    query: {
      q: firstParam(searchParams.q)?.trim() ?? "",
      page: parsePage(firstParam(searchParams.page)),
      pageSize: recipientsPageSize,
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

export function buildRecipientsErrorQueryResult(message: string): RecipientsQueryResult {
  return {
    status: "error",
    message,
    recipients: [],
  };
}
