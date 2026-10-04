import {
  getJson,
  postJson,
  patchJson,
  deleteJson,
  queryString,
  type Credentials,
  type Page,
  type UuidResult,
} from './client';

export type TransactionType = 'UPI' | 'CARD' | 'CASH' | 'NETBANKING' | 'OTHER';
export type ClassificationSource = 'MANUAL' | 'SUGGESTION' | 'RULE';
export type Transaction = {
  uuid: string;
  userUuid: string;
  recipientUuid: string;
  amount: number;
  currency: string;
  type: TransactionType;
  source: 'MANUAL' | 'SMS';
  recipientDisplayName: string;
  reference: string | null;
  accountUuid: string | null;
  accountName: string | null;
  remarks: string | null;
  locationRaw: string | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  category: string | null;
  subcategory: string | null;
  categoryUuid: string | null;
  subcategoryUuid: string | null;
  classificationSource: ClassificationSource | null;
  classificationChangedAt: string | null;
};
export type TransactionDetail = Transaction & {
  recipientRaw: string;
  recipientName: string | null;
  classificationRule: { uuid: string; name: string; isDeleted: boolean } | null;
};
export type TransactionList = Page & {
  transactions: Transaction[];
  firstTxnDate: string | null;
  lastTxnDate: string | null;
};
export type TransactionFilters = {
  recipientUuid?: string;
  page?: number;
  size?: number;
  q?: string;
  sortBy?: 'amount' | 'timestamp';
  sortOrder?: 'asc' | 'desc';
  startDate?: string;
  endDate?: string;
  category?: string[];
  subcategory?: string[];
  classificationSource?: ClassificationSource[];
};
export type TransactionInput = {
  amount: number;
  recipientUuid: string;
  type: TransactionType;
  timestamp: string;
  categoryUuid?: string | null;
  subcategoryUuid?: string | null;
  accountUuid?: string | null;
  remarks?: string | null;
  reference?: string | null;
  locationRaw?: string | null;
};
export type CategoryInput = {
  categoryUuid: string | null;
  subcategoryUuid?: string | null;
  classificationIntent?: 'SUGGESTION';
};
export type CategoryResult = {
  uuid: string;
  categoryUuid: string | null;
  subcategoryUuid: string | null;
  category: string | null;
  subcategory: string | null;
  classificationSource: ClassificationSource | null;
};
export type CategorySuggestion = {
  suggestedCategory: string | null;
  suggestedSubCategory: string | null;
  suggestedCategoryUuid: string | null;
  suggestedSubcategoryUuid: string | null;
};
export const fetchTransactions = (c: Credentials, filters: TransactionFilters = {}, signal?: AbortSignal) =>
  getJson<TransactionList>(c, `/api/transactions${queryString(filters)}`, signal);
export const fetchTransaction = (c: Credentials, id: string, signal?: AbortSignal) =>
  getJson<TransactionDetail>(c, `/api/transactions/${encodeURIComponent(id)}`, signal);
export const createTransaction = (c: Credentials, input: TransactionInput) =>
  postJson<UuidResult>(c, '/api/transactions', input);
export const updateTransaction = (
  c: Credentials,
  id: string,
  input: Omit<TransactionInput, 'recipientUuid'> & { recipientUuid?: string; classificationIntent?: 'SUGGESTION' },
) => patchJson<UuidResult>(c, `/api/transactions/${encodeURIComponent(id)}`, input);
export const categorizeTransaction = (c: Credentials, id: string, input: CategoryInput) =>
  patchJson<CategoryResult>(c, `/api/transactions/${encodeURIComponent(id)}/category`, input);
export const deleteTransaction = (c: Credentials, id: string) =>
  deleteJson<UuidResult>(c, `/api/transactions/${encodeURIComponent(id)}`);
export const fetchCategorySuggestion = (c: Credentials, id: string, signal?: AbortSignal) =>
  getJson<CategorySuggestion>(c, `/api/transactions/${encodeURIComponent(id)}/suggest`, signal);
export async function fetchRecentTransactions(credentials: Credentials, size: number, signal?: AbortSignal) {
  return (await fetchTransactions(credentials, { page: 1, size, sortBy: 'timestamp', sortOrder: 'desc' }, signal))
    .transactions;
}
