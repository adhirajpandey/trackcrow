export type RecipientIdentifierDto = {
  id: number;
  uuid: string;
  kind: string;
  value: string;
  normalizedValue: string;
};

export type RecipientListItemDto = {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  identifiers: RecipientIdentifierDto[];
};

export type RecipientSortBy = "displayName" | "transactionCount";
export type RecipientSortOrder = "asc" | "desc";

export type RecipientsApiQuery = {
  q: string;
  page: number;
  pageSize: number;
  sortBy: RecipientSortBy;
  sortOrder: RecipientSortOrder;
};

export type RecipientsControlState = RecipientsApiQuery;

export type RecipientIdentifierChip = {
  id: string;
  label: string;
  value: string;
};

export type RecipientsPageRow = {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  status: "active" | "empty";
  secondaryLabel: string;
  identifierChips: RecipientIdentifierChip[];
  overflowIdentifierCount: number;
};

export type RecipientsPagination = {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type RecipientsQueryResult = {
  status: "ready" | "error";
  message: string | null;
  recipients: RecipientListItemDto[];
};

export type RecipientsPageData = {
  status: "ready" | "error";
  message: string | null;
  rows: RecipientsPageRow[];
  filters: RecipientsControlState;
  pagination: RecipientsPagination;
  emptyState: "none" | "empty" | "filtered";
};

export type RecipientsPageInitialData = {
  initialRecipientsQuery: RecipientsApiQuery;
  initialRecipientsData: RecipientsQueryResult;
};
