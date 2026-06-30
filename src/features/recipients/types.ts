import type { CategoryOption } from "@/common/types";

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
  totalAmount: number;
  identifiers: RecipientIdentifierDto[];
};

export type RecipientIdentifierTransferImpact = {
  sourceRecipient: {
    id: number;
    displayName: string;
  };
  targetRecipient: {
    id: number;
    displayName: string;
  };
  identifier: RecipientIdentifierDto;
  transactionCount: number;
  totalAmount: number;
};

export type RecipientIdentifierWriteDto = {
  status: "created" | "already_linked" | "moved";
  identifier: RecipientIdentifierDto;
  movedTransactionCount: number;
  movedTransactionTotalAmount: number;
};

export type RecipientSortBy = "displayName" | "transactionCount" | "totalAmount";
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
  transactionCount: number;
  totalAmount: number;
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
  transactionCount: number;
  sourceLabel: string;
};

export type RecipientDetailCategoryRow = {
  id: string;
  category: string;
  categoryId: number | null;
  transactionCount: number;
  totalAmount: number;
  consistencyPercent: number;
};

export type RecipientDetailSubcategoryPattern = {
  id: string;
  subcategory: string;
  subcategoryId: number;
  transactionCount: number;
};

export type RecipientDetailTransactionRow = {
  id: number;
  uuid: string;
  amount: number;
  category: string | null;
  categoryId: number | null;
  subcategory: string | null;
  subcategoryId: number | null;
  source: string;
  timestamp: string;
  status: "categorized" | "uncategorized";
  isLarge: boolean;
  isRecent: boolean;
};

export type RecipientDetailCleanupSuggestion = {
  category: string | null;
  categoryId: number | null;
  subcategory: string | null;
  subcategoryId: number | null;
  consistencyPercent: number;
  categorizedTransactionCount: number;
  totalTransactionCount: number;
  totalAmount: number;
  uncategorizedCount: number;
  uncategorizedTransactionIds: number[];
  reviewTransactionId: number | null;
  applyLabel: string | null;
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
  dominantCategory: RecipientDetailCategoryRow | null;
  dominantSubcategory: RecipientDetailSubcategoryPattern | null;
  cleanupSuggestion: RecipientDetailCleanupSuggestion;
  recentTransactions: RecipientDetailTransactionRow[];
  metadata: RecipientDetailMetadataItem[];
  quickChecks: RecipientDetailQuickCheck[];
  insights: RecipientDetailInsight[];
};

export type RecipientDetailPageInitialData = {
  initialRecipientDetailData: RecipientDetailPageData;
  initialCategoriesData: CategoryOption[];
};
