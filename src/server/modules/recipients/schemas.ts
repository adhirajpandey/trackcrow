import { z } from "zod";

export const recipientIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const listRecipientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  size: z.coerce.number().int().positive().optional(),
  q: z.string().trim().optional(),
  sortBy: z.enum(["displayName", "transactionCount", "totalAmount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
