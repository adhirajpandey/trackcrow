import type { ServiceResult } from "@/server/shared/result";
import type { RecipientIdentifierKind } from "@/generated/prisma-rewrite";

export type RecipientAliasType = RecipientIdentifierKind;

export type RecipientDto = {
  uuid: string;
  displayName: string;
  normalizedName: string;
  transactionCount: number;
  totalAmount: number;
  aliases: Array<{
    uuid: string;
    aliasType: string;
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
  aliases: Array<{
    uuid: string;
    aliasType: string;
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

export type RecipientUpdateInput = RecipientLookupInput & {
  displayName: string;
};

export type RecipientCreateInput = {
  userUuid: string;
  displayName: string;
};

export type RecipientCreateDto = {
  uuid: string;
  displayName: string;
  normalizedName: string;
};

export type RecipientAliasWriteInput = RecipientLookupInput & {
  value: string;
  aliasType?: RecipientAliasType | "AUTO";
  transfer?: boolean;
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
  alias: {
    uuid: string;
    aliasType: string;
    value: string;
    normalizedValue: string;
  };
  transactionCount: number;
  totalAmount: number;
};

export type RecipientAliasWriteDto = {
  status: "created" | "already_linked" | "moved";
  alias: {
    uuid: string;
    aliasType: string;
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
export type RecipientCreateResult = ServiceResult<
  RecipientCreateDto,
  "CONFLICT" | "INTERNAL_ERROR"
>;
export type RecipientUpdateResult = ServiceResult<
  RecipientDto,
  "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR"
>;
export type RecipientAliasWriteResult = ServiceResult<
  RecipientAliasWriteDto,
  "NOT_FOUND" | "CONFLICT" | "INTERNAL_ERROR"
>;
