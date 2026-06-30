import { TransactionSource, TransactionType } from "@/generated/prisma-rewrite";
import type { ServiceResult } from "@/server/shared/result";

export type TransactionDto = {
  id: number;
  uuid: string;
  userUuid: string;
  amount: number;
  currency: string;
  type: TransactionType;
  source: TransactionSource;
  recipientId: number;
  recipientRaw: string;
  recipientName: string | null;
  recipientDisplayName: string;
  reference: string | null;
  accountLabel: string | null;
  remarks: string | null;
  locationRaw: string | null;
  timestamp: string;
  createdAt: string;
  updatedAt: string;
  category: string | null;
  subcategory: string | null;
  categoryId: number | null;
  subcategoryId: number | null;
};

export type TransactionListDto = {
  transactions: TransactionDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  firstTxnDate: string | null;
  lastTxnDate: string | null;
};

export type ListTransactionsInput = {
  userUuid: string;
  page?: number;
  size?: number;
  q?: string;
  sortBy?: "amount" | "timestamp";
  sortOrder?: "asc" | "desc";
  startDate?: Date;
  endDate?: Date;
  categories?: string[];
};

export type TransactionListRangeInput = {
  userUuid: string;
  startDate?: Date;
  endDate?: Date;
};

export type TransactionWriteInput = {
  userUuid: string;
  amount: number;
  recipientRaw: string;
  recipientName?: string | null;
  categoryId?: number | null;
  subcategoryId?: number | null;
  type: TransactionType;
  remarks?: string | null;
  timestamp: Date;
  reference?: string | null;
  accountLabel?: string | null;
  locationRaw?: string | null;
  source: TransactionSource;
};

export type TransactionUpdateInput = TransactionWriteInput & {
  transactionId: number;
};

export type TransactionCategoryUpdateInput = {
  userUuid: string;
  transactionId: number;
  categoryId: number | null;
  subcategoryId?: number | null;
};

export type TransactionLookupInput = {
  userUuid: string;
  transactionId: number;
};

export type SuggestTransactionCategoryDto = {
  suggestedCategory: string | null;
  suggestedSubCategory: string | null;
};

export type TransactionListResult = ServiceResult<TransactionListDto, "INTERNAL_ERROR">;
export type TransactionGetResult = ServiceResult<
  TransactionDto,
  "NOT_FOUND" | "INTERNAL_ERROR"
>;
export type TransactionCreateResult = ServiceResult<
  { id: number; uuid: string },
  "VALIDATION_ERROR" | "INTERNAL_ERROR"
>;
export type TransactionUpdateResult = ServiceResult<
  { id: number },
  "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR"
>;
export type TransactionCategoryUpdateResult = ServiceResult<
  {
    id: number;
    categoryId: number | null;
    category: string | null;
    subcategoryId: number | null;
    subcategory: string | null;
  },
  "NOT_FOUND" | "VALIDATION_ERROR" | "INTERNAL_ERROR"
>;
export type TransactionDeleteResult = ServiceResult<
  { id: number },
  "NOT_FOUND" | "INTERNAL_ERROR"
>;
export type TransactionSuggestResult = ServiceResult<
  SuggestTransactionCategoryDto,
  "NOT_FOUND" | "INTERNAL_ERROR"
>;
