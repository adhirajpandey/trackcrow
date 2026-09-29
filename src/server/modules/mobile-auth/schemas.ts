import { z } from "zod";

export const googleSignInSchema = z
  .object({
    idToken: z.string().trim().min(1).max(4096),
  })
  .strict();
