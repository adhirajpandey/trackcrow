import { z } from "zod";

export const transactionRead = z.object({
  uuid: z.string(),
  id: z.number(),
  type: z.string(),
  user_uuid: z.string(),
  timestamp: z.number(),
  amount: z.number(),
  recipient: z.string(),
  input_mode: z.string(),
  recipient_name: z.string().nullable().optional(),
  categoryId: z.number().nullable().optional(),
  subcategoryId: z.number().nullable().optional(),
  reference: z.string().nullable().optional(),
  account: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  ist_datetime: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Transaction = z.infer<typeof transactionRead>;

export const transactionReadArray = z.array(transactionRead);
