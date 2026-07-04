export const TRANSACTION_TYPES = [
  "UPI",
  "CARD",
  "CASH",
  "NETBANKING",
  "OTHER",
] as const;

export type TransactionType = (typeof TRANSACTION_TYPES)[number];

export const TRANSACTION_SOURCES = ["SMS", "MANUAL"] as const;

export type TransactionSource = (typeof TRANSACTION_SOURCES)[number];

export type CategoryOption = {
  uuid: string;
  name: string;
  subcategories: Array<{
    uuid: string;
    name: string;
    categoryUuid: string;
  }>;
};

export type UserCategorySummary = {
  name: string;
  subcategories: string[];
};

export function toUserCategorySummary(category: CategoryOption): UserCategorySummary {
  return {
    name: category.name,
    subcategories: category.subcategories.map((subcategory) => subcategory.name),
  };
}

export type TransactionRecord = {
  uuid: string;
  userUuid: string;
  amount: number;
  currency: string;
  type: TransactionType;
  source: TransactionSource;
  recipientUuid: string;
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
  categoryUuid: string | null;
  subcategoryUuid: string | null;
};

export type TransactionListResponse = {
  transactions: TransactionRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  firstTxnDate: string | null;
  lastTxnDate: string | null;
};

export type DeviceTokenRecord = {
  uuid: string;
  label: string | null;
  tokenPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};
