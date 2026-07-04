import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const categoryIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const subcategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  categoryUuid: z.string().uuid(),
});
