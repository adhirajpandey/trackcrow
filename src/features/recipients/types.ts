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

export type RecipientListResponse = {
  recipients: RecipientListItemDto[];
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
  pagination: RecipientsPagination;
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

export type RecipientDetailIdentifierRow = {
  id: string;
  kindLabel: string;
  value: string;
  normalizedValue: string;
};

export type RecipientDetailCategoryRow = {
  id: string;
  category: string;
  transactionCount: number;
  totalAmount: number;
};

export type RecipientDetailTransactionRow = {
  id: number;
  uuid: string;
  amount: number;
  category: string | null;
  source: string;
  timestamp: string;
};

export type RecipientDetailMetadataItem = {
  label: string;
  value: string;
  copyValue?: string;
};

export type RecipientDetailQuickCheck = {
  id: string;
  label: string;
  status: "attention" | "passed";
  badgeLabel: string;
};

export type RecipientDetailInsight = {
  id: string;
  label: string;
  value: string;
  tone?: "default" | "accent";
};

export type RecipientDetailPageData = {
  recipientId: number;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  identifierCount: number;
  totalSpent: number;
  averagePayment: number;
  lastPaidAt: string | null;
  createdAt: string;
  updatedAt: string;
  identifiers: RecipientDetailIdentifierRow[];
  categoryRows: RecipientDetailCategoryRow[];
  recentTransactions: RecipientDetailTransactionRow[];
  metadata: RecipientDetailMetadataItem[];
  quickChecks: RecipientDetailQuickCheck[];
  insights: RecipientDetailInsight[];
};

export type RecipientDetailPageInitialData = {
  initialRecipientDetailData: RecipientDetailPageData;
};
