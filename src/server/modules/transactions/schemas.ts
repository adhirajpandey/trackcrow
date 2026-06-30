import { z } from "zod";

import { TransactionType } from "@/generated/prisma-rewrite";

const optionalNullableString = z.string().trim().optional().nullable();
const optionalNullablePositiveInt = z.coerce.number().int().positive().optional().nullable();
const IST_OFFSET_MINUTES = 330;

function parseDateOnly(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, monthIndex: month - 1, day };
}

function toIstBoundaryDate(
  value: unknown,
  boundary: "start" | "end"
): Date | undefined | unknown {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  const parsed = parseDateOnly(value);
  if (!parsed) {
    return value;
  }

  const startUtcMs =
    Date.UTC(parsed.year, parsed.monthIndex, parsed.day) -
    IST_OFFSET_MINUTES * 60 * 1000;

  return boundary === "start"
    ? new Date(startUtcMs)
    : new Date(startUtcMs + 24 * 60 * 60 * 1000 - 1);
}

const optionalStartDateParam = z.preprocess(
  (value) => toIstBoundaryDate(value, "start"),
  z.date().optional()
);

const optionalEndDateParam = z.preprocess(
  (value) => toIstBoundaryDate(value, "end"),
  z.date().optional()
);

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
  startDate: optionalStartDateParam,
  endDate: optionalEndDateParam,
  categories: z.array(z.string().trim().min(1)).optional(),
  subcategories: z.array(z.string().trim().min(1)).optional(),
});
