import { z } from "zod";

import { ClassificationSource, TransactionType } from "@/generated/prisma-rewrite";

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine((value) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}, "Invalid calendar date");
const page = z.number().int().min(1).default(1);
const limit = z.number().int().min(1).max(100).default(20);
const query = z.string().trim().max(200);
const names = z.array(z.string().trim().min(1).max(200)).max(50);
const nullableUuid = z.string().uuid().nullable();
const optionalText = z.string().trim().max(1000).nullable().optional();

function istRange(value: { startDate?: string; endDate?: string }, ctx: z.RefinementCtx) {
  if (value.startDate && value.endDate && value.startDate > value.endDate) {
    ctx.addIssue({ code: "custom", path: ["endDate"], message: "End date must not precede start date" });
  }
}

export function toIstDateRange(startDate: string, endDate: string) {
  return {
    startDate: new Date(`${startDate}T00:00:00+05:30`),
    endDate: new Date(`${endDate}T23:59:59.999+05:30`),
  };
}

const transactionOutput = z.object({
  uuid: z.string().uuid(),
  amount: z.number(),
  currency: z.string(),
  type: z.nativeEnum(TransactionType),
  source: z.enum(["SMS", "MANUAL"]),
  recipientUuid: z.string().uuid(),
  recipientDisplayName: z.string(),
  reference: z.string().nullable(),
  accountLabel: z.string().nullable(),
  remarks: z.string().nullable(),
  locationRaw: z.string().nullable(),
  timestamp: z.string(),
  category: z.string().nullable(),
  subcategory: z.string().nullable(),
  categoryUuid: nullableUuid,
  subcategoryUuid: nullableUuid,
  classificationSource: z.nativeEnum(ClassificationSource).nullable(),
}).strict();

export const searchTransactionsInput = z.object({
  query: query.optional(),
  startDate: dateOnly.optional(),
  endDate: dateOnly.optional(),
  categories: names.optional(),
  subcategories: names.optional(),
  classificationSources: z.array(z.nativeEnum(ClassificationSource)).max(50).optional(),
  uncategorized: z.boolean().optional(),
  page,
  limit,
  sortBy: z.enum(["amount", "timestamp"]).default("timestamp"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
}).strict().superRefine((value, ctx) => {
  istRange(value, ctx);
  if (value.uncategorized && value.categories?.length) {
    ctx.addIssue({ code: "custom", path: ["categories"], message: "Category filters cannot be combined with uncategorized" });
  }
});

export const searchTransactionsOutput = z.object({
  transactions: z.array(transactionOutput),
  pagination: z.object({
    page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number(), hasNext: z.boolean(), hasPrev: z.boolean(),
  }).strict(),
}).strict();

export const spendingSummaryInput = z.object({
  startDate: dateOnly,
  endDate: dateOnly,
  grouping: z.enum(["none", "category", "period"]).default("none"),
  periodGranularity: z.enum(["day", "week", "month", "year"]).default("month"),
}).strict().superRefine(istRange);

export const spendingSummaryOutput = z.object({
  summary: z.object({
    totalSpend: z.number(), transactionCount: z.number(), categorizedCount: z.number(), uncategorizedCount: z.number(), averageSpend: z.number(),
  }).strict(),
  grouping: z.enum(["none", "category", "period"]),
  breakdown: z.array(z.union([
    z.object({ category: z.string(), totalSpend: z.number(), transactionCount: z.number(), topSubcategory: z.object({ name: z.string(), totalSpend: z.number(), transactionCount: z.number() }).strict().nullable() }).strict(),
    z.object({ period: z.string(), totalSpend: z.number(), transactionCount: z.number() }).strict(),
  ])),
}).strict();

export const listCategoriesInput = z.object({}).strict();
export const listCategoriesOutput = z.object({ categories: z.array(z.object({
  uuid: z.string().uuid(), name: z.string(), subcategories: z.array(z.object({ uuid: z.string().uuid(), name: z.string() }).strict()),
}).strict()) }).strict();

export const searchRecipientsInput = z.object({
  query: query.optional(), page, limit,
}).strict();
export const searchRecipientsOutput = z.object({
  recipients: z.array(z.object({
    uuid: z.string().uuid(), name: z.string(), aliases: z.array(z.object({ uuid: z.string().uuid(), type: z.string(), value: z.string() }).strict()), transactionCount: z.number(), totalAmount: z.number(),
  }).strict()),
  pagination: z.object({ page: z.number(), limit: z.number(), total: z.number(), totalPages: z.number(), hasNext: z.boolean(), hasPrev: z.boolean() }).strict(),
}).strict();

export const createTransactionInput = z.object({
  amount: z.number().positive().finite(),
  recipientUuid: z.string().uuid(),
  type: z.nativeEnum(TransactionType),
  timestamp: z.string().datetime({ offset: true }),
  categoryUuid: nullableUuid.optional(),
  subcategoryUuid: nullableUuid.optional(),
  remarks: optionalText,
  reference: optionalText,
  accountLabel: optionalText,
  locationRaw: optionalText,
}).strict();
export const createTransactionOutput = z.object({ uuid: z.string().uuid() }).strict();

export const categorizeTransactionInput = z.object({
  transactionUuid: z.string().uuid(),
  categoryUuid: nullableUuid,
  subcategoryUuid: nullableUuid.optional(),
}).strict();
export const categorizeTransactionOutput = z.object({
  uuid: z.string().uuid(), categoryUuid: nullableUuid, category: z.string().nullable(), subcategoryUuid: nullableUuid, subcategory: z.string().nullable(), classificationSource: z.literal("MANUAL"),
}).strict();
