import { z } from "zod";

import { RecipientIdentifierKind } from "@/generated/prisma-rewrite";

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

export const addRecipientIdentifierSchema = z.object({
  value: z.string().trim().min(1),
  kind: z.union([z.nativeEnum(RecipientIdentifierKind), z.literal("AUTO")]).optional(),
  transfer: z.boolean().optional(),
});
