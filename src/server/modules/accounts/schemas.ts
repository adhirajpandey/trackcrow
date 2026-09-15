import { z } from "zod";

export const accountSchema = z.object({
  name: z.string().trim().min(1).max(100),
}).strict();

export const accountIdParamsSchema = z.object({
  accountUuid: z.string().uuid(),
});
