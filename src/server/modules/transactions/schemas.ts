import { z } from "zod";

import { TransactionType } from "@/generated/prisma-rewrite";

const optionalNullableString = z.string().trim().optional().nullable();
const optionalNullablePositiveInt = z.coerce.number().int().positive().optional().nullable();
const optionalDateParam = z.preprocess((value) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  return value;
}, z.coerce.date().optional());

export const createTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  recipientRaw: z.string().trim().min(1),
  recipientName: z.string().trim().min(1).optional().nullable(),
  categoryId: optionalNullablePositiveInt,
  subcategoryId: optionalNullablePositiveInt,
  type: z.nativeEnum(TransactionType),
  remarks: optionalNullableString,
  timestamp: z.coerce.date(),
  reference: optionalNullableString,
  accountLabel: optionalNullableString,
  locationRaw: optionalNullableString,
});

export const updateTransactionSchema = createTransactionSchema;

export const updateTransactionCategorySchema = z.object({
  categoryId: optionalNullablePositiveInt,
  subcategoryId: optionalNullablePositiveInt,
});

export const transactionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  size: z.coerce.number().int().positive().optional(),
  q: z.string().trim().optional(),
  sortBy: z.enum(["amount", "timestamp"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
  startDate: optionalDateParam,
  endDate: optionalDateParam,
  categories: z.array(z.string().trim().min(1)).optional(),
  subcategories: z.array(z.string().trim().min(1)).optional(),
});
