import { z } from "zod";

const ruleNameSchema = z.string().trim().min(1).max(100);

export const ruleConditionsSchema = z
  .object({
    recipient: z.object({ equals: z.string().uuid() }).strict(),
  })
  .strict();

export const ruleActionSchema = z
  .object({
    categoryUuid: z.string().uuid(),
    subcategoryUuid: z.string().uuid().nullable(),
  })
  .strict();

export const createRuleSchema = z
  .object({
    name: ruleNameSchema,
    isEnabled: z.boolean(),
    conditions: ruleConditionsSchema,
    action: ruleActionSchema,
  })
  .strict();

export const updateRuleSchema = z
  .object({
    name: ruleNameSchema.optional(),
    isEnabled: z.boolean().optional(),
    conditions: ruleConditionsSchema.optional(),
    action: ruleActionSchema.optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export const ruleUuidParamsSchema = z.object({ ruleUuid: z.string().uuid() }).strict();

export const listRulesQuerySchema = z
  .object({
    page: z.coerce.number().int().positive().optional(),
    size: z.coerce.number().int().positive().max(100).optional(),
    q: z.string().trim().optional(),
    status: z.enum(["enabled", "disabled", "needsRepair"]).optional(),
  })
  .strict();

export type CreateRuleBody = z.infer<typeof createRuleSchema>;
export type UpdateRuleBody = z.infer<typeof updateRuleSchema>;
