import type { ServiceResult } from "@/server/shared/result";
import type { RecipientIdentifierKind } from "@/generated/prisma-rewrite";

export type RecipientDto = {
  id: number;
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  totalAmount: number;
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
  recipientRaw: string;
  recipientName: string | null;
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

export type RecipientIdentifierWriteInput = RecipientLookupInput & {
  value: string;
  kind?: RecipientIdentifierKind | "AUTO";
  transfer?: boolean;
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
  identifier: {
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  };
  transactionCount: number;
  totalAmount: number;
};

export type RecipientIdentifierWriteDto = {
  status: "created" | "already_linked" | "moved";
  identifier: {
    id: number;
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  };
  movedTransactionCount: number;
  movedTransactionTotalAmount: number;
};

export type RecipientListInput = {
  userUuid: string;
  page?: number;
  size?: number;
  q?: string;
  sortBy?: "displayName" | "transactionCount" | "totalAmount";
  sortOrder?: "asc" | "desc";
};

export type RecipientListResult = ServiceResult<RecipientListDto, "INTERNAL_ERROR">;
export type RecipientIdentifierWriteResult = ServiceResult<
  RecipientIdentifierWriteDto,
  "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR"
>;
