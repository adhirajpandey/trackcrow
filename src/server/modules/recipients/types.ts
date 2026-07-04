import type { ServiceResult } from "@/server/shared/result";
import type { RecipientIdentifierKind } from "@/generated/prisma-rewrite";

export type RecipientDto = {
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  totalAmount: number;
  identifiers: Array<{
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
  categoryUuid: string | null;
  subcategoryUuid: string | null;
};

export type RecipientDetailDto = {
  uuid: string;
  displayName: string;
  normalizedName: string;
  createdAt: string;
  updatedAt: string;
  transactionCount: number;
  identifiers: Array<{
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
  recipientUuid: string;
};

export type RecipientIdentifierWriteInput = RecipientLookupInput & {
  value: string;
  kind?: RecipientIdentifierKind | "AUTO";
  transfer?: boolean;
};

export type RecipientIdentifierTransferImpact = {
  sourceRecipient: {
    uuid: string;
    displayName: string;
  };
  targetRecipient: {
    uuid: string;
    displayName: string;
  };
  identifier: {
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
    uuid: string;
    kind: string;
    value: string;
    normalizedValue: string;
  };
  movedTransactionCount: number;
  movedTransactionTotalAmount: number;
  deletedSourceRecipient: boolean;
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
