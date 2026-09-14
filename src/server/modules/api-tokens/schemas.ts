import { z } from "zod";

import { ApiTokenScope } from "@/generated/prisma-rewrite";

export const createApiTokenSchema = z
  .object({
    label: z.string().trim().min(1).max(100),
    scopes: z.array(z.nativeEnum(ApiTokenScope)).min(1),
  })
  .strict();

export const apiTokenIdParamsSchema = z.object({ id: z.string().uuid() }).strict();
