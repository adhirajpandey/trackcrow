import type { ServiceResult } from "@/server/shared/result";

export type RecipientDto = {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  identifiers: Array<{
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  }>;
};

export type RecipientListDto = {
  recipients: RecipientDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type RecipientDetailTransactionDto = {
  id: number;
  uuid: string;
  amount: number;
  currency: string;
  type: string;
  source: string;
  timestamp: string;
  category: string | null;
  subcategory: string | null;
  categoryId: number | null;
  subcategoryId: number | null;
};

export type RecipientDetailDto = {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
  identifiers: Array<{
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  }>;
  linkedTransactions: RecipientDetailTransactionDto[];
};

export type ResolveRecipientInput = {
  userUuid: string;
  recipientRaw: string;
  recipientName?: string | null;
};

export type RecipientLookupInput = {
  userUuid: string;
  recipientId: number;
};

export type RecipientListInput = {
  userUuid: string;
  page?: number;
  size?: number;
  q?: string;
  sortBy?: "displayName" | "transactionCount";
  sortOrder?: "asc" | "desc";
};

export type RecipientListResult = ServiceResult<RecipientListDto, "INTERNAL_ERROR">;
