import { z } from "zod";

import { RecipientIdentifierKind } from "@/generated/prisma-rewrite";

export const recipientIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const listRecipientsQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    size: z.coerce.number().int().positive().optional(),
    q: z.string().trim().optional(),
    sortBy: z.enum(["displayName", "transactionCount", "totalAmount"]).optional(),
    sortOrder: z.enum(["asc", "desc"]).optional(),
    minTransactionCount: z.coerce.number().int().nonnegative().optional(),
    maxTransactionCount: z.coerce.number().int().nonnegative().optional(),
    minTotalAmount: z.coerce.number().finite().nonnegative().optional(),
    maxTotalAmount: z.coerce.number().finite().nonnegative().optional(),
  })
  .superRefine((value, context) => {
    if (
      value.minTransactionCount !== undefined &&
      value.maxTransactionCount !== undefined &&
      value.minTransactionCount > value.maxTransactionCount
    ) {
      context.addIssue({
        code: "custom",
        path: ["maxTransactionCount"],
        message: "Maximum transaction count must be at least the minimum",
      });
    }
    if (
      value.minTotalAmount !== undefined &&
      value.maxTotalAmount !== undefined &&
      value.minTotalAmount > value.maxTotalAmount
    ) {
      context.addIssue({
        code: "custom",
        path: ["maxTotalAmount"],
        message: "Maximum total amount must be at least the minimum",
      });
    }
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
