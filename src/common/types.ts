import type { TransactionSource, TransactionType } from "@/generated/prisma-rewrite";

export type CategoryOption = {
  id: number;
  uuid: string;
  name: string;
  subcategories: Array<{
    id: number;
    uuid: string;
    name: string;
    categoryId: number;
  }>;
};

export type UserCategorySummary = {
  name: string;
  subcategories: string[];
};

export type TransactionRecord = {
  id: number;
  uuid: string;
  userUuid: string;
  amount: number;
  currency: string;
  type: TransactionType;
  source: TransactionSource;
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
