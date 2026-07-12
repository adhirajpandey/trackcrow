import type { CategoryOption } from "@/common/types";

export type RecipientAliasDto = {
  uuid: string;
  aliasType: string;
  value: string;
  normalizedValue: string;
};

export type RecipientListItemDto = {
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  totalAmount: number;
  aliases: RecipientAliasDto[];
};

export type RecipientCreateDto = Pick<
  RecipientListItemDto,
  "uuid" | "displayName" | "normalizedName"
>;

export type RecipientCreateConflict = {
  existingRecipient: Pick<RecipientListItemDto, "uuid" | "displayName">;
};

export type RecipientAliasTransferImpact = {
  sourceRecipient: {
    uuid: string;
    displayName: string;
  };
  targetRecipient: {
    uuid: string;
    displayName: string;
  };
  alias: RecipientAliasDto;
  transactionCount: number;
  totalAmount: number;
};

export type RecipientAliasWriteDto = {
  status: "created" | "already_linked" | "moved";
  alias: RecipientAliasDto;
  movedTransactionCount: number;
  movedTransactionTotalAmount: number;
  deletedSourceRecipient: boolean;
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

export type RecipientAliasChip = {
  id: string;
  tone: "upi" | "text" | "card" | "default";
  value: string;
};

export type RecipientsPageRow = {
  uuid: string;
  displayName: string;
  transactionCount: number;
  totalAmount: number;
  secondaryLabel: string;
  aliasChips: RecipientAliasChip[];
  overflowAliasCount: number;
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

export type RecipientDetailAliasRow = {
  id: string;
  typeLabel: string;
  value: string;
  transactionCount: number;
  sourceLabel: string;
};

export type RecipientDetailCategoryRow = {
  id: string;
  category: string;
  categoryUuid: string | null;
  transactionCount: number;
  totalAmount: number;
  consistencyPercent: number;
};

export type RecipientDetailSubcategoryPattern = {
  id: string;
  subcategory: string;
  subcategoryUuid: string;
  transactionCount: number;
};

export type RecipientDetailTransactionRow = {
  uuid: string;
  amount: number;
  category: string | null;
  categoryUuid: string | null;
  subcategory: string | null;
  subcategoryUuid: string | null;
  source: string;
  timestamp: string;
  status: "categorized" | "uncategorized";
  isLarge: boolean;
  isRecent: boolean;
};

export type RecipientDetailCleanupSuggestion = {
  category: string | null;
  categoryUuid: string | null;
  subcategory: string | null;
  subcategoryUuid: string | null;
  consistencyPercent: number;
  categorizedTransactionCount: number;
  totalTransactionCount: number;
  totalAmount: number;
  uncategorizedCount: number;
  uncategorizedTransactionUuids: string[];
  reviewTransactionUuid: string | null;
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
  recipientUuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  aliasCount: number;
  totalSpent: number;
  averagePayment: number;
  lastPaidAt: string | null;
  createdAt: string;
  updatedAt: string;
  aliases: RecipientDetailAliasRow[];
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
