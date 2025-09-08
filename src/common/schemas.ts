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
  recipient_name: z.string().nullable(),
  category: z.string().nullable(),
  subcategory: z.string().nullable(),
  remarks: z.string().nullable(),
});
