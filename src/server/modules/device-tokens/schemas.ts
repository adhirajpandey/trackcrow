import { z } from "zod";

export const createDeviceTokenSchema = z.object({
  label: z.string().trim().min(1).max(100).optional(),
});

export const deviceTokenIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});
