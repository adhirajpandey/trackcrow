import { z } from "zod";

export const recipientIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
