import { z } from "zod";

import { RecipientIdentifierKind } from "@/generated/prisma-rewrite";

export const recipientIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listRecipientsQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  size: z.coerce.number().int().positive().optional(),
  q: z.string().trim().optional(),
  sortBy: z.enum(["displayName", "transactionCount", "totalAmount"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

export const updateRecipientSchema = z.object({
  displayName: z.string().trim().min(1).max(200),
});

export const createRecipientSchema = updateRecipientSchema;

export const aliasTypeSchema = z.union([
  z.enum([
    RecipientIdentifierKind.UPI_ID,
    RecipientIdentifierKind.CARD_MERCHANT,
    RecipientIdentifierKind.TEXT,
  ]),
  z.literal("AUTO"),
]);

export const addRecipientAliasSchema = z.object({
  value: z.string().trim().min(1),
  aliasType: aliasTypeSchema.optional(),
  transfer: z.boolean().optional(),
});
