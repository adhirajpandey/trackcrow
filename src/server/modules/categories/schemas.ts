import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const categoryIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const subcategorySchema = z.object({
  name: z.string().trim().min(1).max(100),
  categoryId: z.coerce.number().int().positive(),
});
