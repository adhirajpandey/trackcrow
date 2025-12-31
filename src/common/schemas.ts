import { z } from "zod";

// Core transaction coming from DB after serialization
export const transactionCore = z.object({
  uuid: z.string(),
  id: z.number(),
  type: z.string(),
  user_uuid: z.string(),
  // ISO string from server for timestamp
  timestamp: z.string(),
  amount: z.coerce.number(),
  recipient: z.string(),
  input_mode: z.string(),
  recipient_name: z.string().nullable().optional(),
  reference: z.string().nullable().optional(),
  account: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// For consumers that also need populated names
export const transactionWithNames = transactionCore.extend({
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
});

export const transactionReadArray = z.array(transactionWithNames);

export type Transaction = z.infer<typeof transactionWithNames>;

// Minimal transaction shape used for aggregated stats or charts
export const transactionStats = z.object({
  id: z.number(),
  amount: z.coerce.number(),
  // If consumers filter by category id
  categoryId: z.number().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type TransactionStats = z.infer<typeof transactionStats>;

export const transactionReadSchema = z.object({
  user_uuid: z.string(),
  id: z.number(),
  timestamp: z.date(),
  recipient: z.string(),
  amount: z.number().positive(),
  type: z.string(),
  location: z.string().nullable(),
  recipient_name: z.string().nullable(),
  category: z.string().nullable(),
  subcategory: z.string().nullable(),
  remarks: z.string().nullable(),
});

const categorySchema = z.object({
  name: z.string(),
  subcategories: z.array(z.string()),
});

export const userReadSchema = z.object({
  uuid: z.string(),
  id: z.number(),
  categories: z.array(categorySchema),
});

const iso8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

export const baseFields = {
  amount: z.number().nullable().optional(),
  recipient: z.string().nullable().optional(),
  recipient_name: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  type: z
    .enum(["UPI", "CARD", "CASH", "NETBANKING", "OTHER"])
    .nullable()
    .optional(),
  remarks: z.string().nullable().optional(),
  timestamp: z
    .string()
    .regex(iso8601Regex, "Timestamp must be in ISO 8601 format")
    .nullable()
    .optional(),
  startDate: z
    .string()
    .regex(iso8601Regex, "startDate must be in ISO 8601 format")
    .nullable()
    .optional(),
  endDate: z
    .string()
    .regex(iso8601Regex, "endDate must be in ISO 8601 format")
    .nullable()
    .optional(),
};

function makeStructuredDataShape(fields: Record<string, z.ZodTypeAny>) {
  return z.object(fields).partial();
}

const recordExpenseSchema = z.object({
  intent: z.literal("recordExpense"),
  relevance: z.number().min(0).max(5),
  structured_data: makeStructuredDataShape({
    amount: z.number().nullable(),
    category: z.string().nullable(),
    timestamp: z.string().nullable(),
    recipient: baseFields.recipient,
    subcategory: baseFields.subcategory,
    type: baseFields.type,
    remarks: baseFields.remarks,
  }),
  missing_fields: z.array(z.string()),
});

const expenseComparisonSchema = z.object({
  intent: z.literal("expenseComparison"),
  relevance: z.number().min(0).max(5),
  structured_data: makeStructuredDataShape({
    comparisonKeyword1: z
      .string()
      .min(1, "First comparison keyword is required"),
    comparisonKeyword2: z
      .string()
      .min(1, "Second comparison keyword is required"),
    startDate: baseFields.startDate,
    endDate: baseFields.endDate,
  }),
  missing_fields: z.array(z.string()).default([]),
});

const transactionSearchSchema = z.object({
  intent: z.literal("transactionSearch"),
  relevance: z.number().min(0).max(5),
  structured_data: makeStructuredDataShape({
    recipient: baseFields.recipient,
    category: baseFields.category,
    keyword: z.string().nullable().optional(),
    startDate: baseFields.startDate,
    endDate: baseFields.endDate,
  }),
  missing_fields: z.array(z.string()),
});

const topExpenseSchema = z.object({
  intent: z.literal("topExpense"),
  relevance: z.number().min(0).max(5),
  structured_data: makeStructuredDataShape({
    category: baseFields.category,
    startDate: baseFields.startDate,
    endDate: baseFields.endDate,
  }),
  missing_fields: z.array(z.string()),
});

const dashboardSummarySchema = z.object({
  intent: z.literal("dashboardSummary"),
  relevance: z.number().min(0).max(5),
  structured_data: makeStructuredDataShape({
    startDate: baseFields.startDate,
    endDate: baseFields.endDate,
  }),
  missing_fields: z.array(z.string()),
});

const totalSpendSchema = z.object({
  intent: z.literal("totalSpend"),
  relevance: z.number().min(0).max(5),
  structured_data: makeStructuredDataShape({
    category: baseFields.category,
    subcategory: baseFields.subcategory,
    remarks: baseFields.remarks,
    startDate: baseFields.startDate,
    endDate: baseFields.endDate,
  }),
  missing_fields: z.array(z.string()),
});

const otherSchema = z.object({
  intent: z.literal("other"),
  relevance: z.number().min(0).max(0),
  structured_data: z.object({}).optional(),
  missing_fields: z.array(z.string()).default([]),
});

// ------------------------
// Combined schema
// ------------------------

export const toolSchema = z.discriminatedUnion("intent", [
  otherSchema,
  recordExpenseSchema,
  expenseComparisonSchema,
  transactionSearchSchema,
  topExpenseSchema,
  dashboardSummarySchema,
  totalSpendSchema,
]);

export type ToolOutput = z.infer<typeof toolSchema>;
