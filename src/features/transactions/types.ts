import type {
  CategoryOption,
  TransactionListResponse,
  TransactionRecord,
  TransactionType,
} from "@/common/types";
import type { DashboardRangeValue } from "@/features/dashboard/query-state";

export type TransactionSortBy = "timestamp" | "amount";
export type TransactionSortOrder = "asc" | "desc";
export type TransactionReview = "queue" | "large";
export type TransactionStatus = "uncategorized";

export type TransactionsQueryRow = {
  uuid: string;
  recipientUuid: string;
  recipient: string;
  amount: number;
  category: string | null;
  subcategory: string | null;
  source: TransactionRecord["source"];
  timestamp: string;
};

export type TransactionsPageRow = TransactionsQueryRow & {
  isSelected: boolean;
};

export type TransactionsApiQuery = {
  q: string;
  startDate: string | null;
  endDate: string | null;
  categories: string[];
  subcategories: string[];
  page: number;
  pageSize: number;
  sortBy: TransactionSortBy;
  sortOrder: TransactionSortOrder;
};

export type TransactionsViewState = {
  range: DashboardRangeValue;
  rangeLabel: string;
  selectedTransactionUuid: string | null;
  review: TransactionReview | null;
  status: TransactionStatus | null;
};

export type TransactionsControlState = TransactionsApiQuery & {
  range: DashboardRangeValue;
  rangeLabel: string;
  selectedTransactionUuid: string | null;
  review: TransactionReview | null;
  status: TransactionStatus | null;
};

export type TransactionsPagination = Pick<
  TransactionListResponse,
  "page" | "pageSize" | "total" | "totalPages" | "hasNext" | "hasPrev"
>;

export type TransactionsQueryResult = {
  status: "ready" | "error";
  message: string | null;
  rows: TransactionsQueryRow[];
  pagination: TransactionsPagination;
};

export type TransactionsPageData = {
  status: "ready" | "error";
  message: string | null;
  rows: TransactionsPageRow[];
  categories: CategoryOption[];
  filters: TransactionsControlState;
  pagination: TransactionsPagination;
};

export type TransactionsPageInitialData = {
  initialTransactionsQuery: TransactionsApiQuery;
  initialTransactionsData: TransactionsQueryResult;
  initialCategoriesData: CategoryOption[];
};

export type TransactionDetailSuggestion = {
  suggestedCategory: string | null;
  suggestedSubCategory: string | null;
};

export type TransactionDetailPageInitialData = {
  transactionUuid: string;
  initialTransactionData: TransactionRecord;
  initialCategoriesData: CategoryOption[];
};

export type TransactionCreateInput = {
  amount: number;
  recipientUuid: string;
  categoryUuid?: string | null;
  subcategoryUuid?: string | null;
  type: TransactionType;
  remarks?: string | null;
  timestamp: string;
  reference?: string | null;
  accountLabel?: string | null;
  locationRaw?: string | null;
};

export type TransactionMutationInput = {
  amount: number;
  categoryUuid?: string | null;
  subcategoryUuid?: string | null;
  type: TransactionType;
  remarks?: string | null;
  timestamp: string;
  reference?: string | null;
  accountLabel?: string | null;
  locationRaw?: string | null;
};

export type UpdateTransactionInput = TransactionMutationInput & {
  transactionUuid: string;
};

export type UpdateTransactionCategoryInput = {
  transactionUuid: string;
  categoryUuid?: string | null;
  subcategoryUuid?: string | null;
};

export type TransactionDetailFormValues = {
  amount: string;
  categoryUuid: string;
  subcategoryUuid: string;
  type: TransactionType;
  timestamp: string;
  reference: string;
  accountLabel: string;
  remarks: string;
  locationRaw: string;
};

