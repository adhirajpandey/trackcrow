import { z } from "zod";

export const importSmsRequestSchema = z.object({
  data: z.object({
    message: z.string().min(1, "message is required"),
    timestamp: z.iso.datetime({ offset: true }).optional(),
  }),
  metadata: z.object({
    location: z.string().nullable().optional(),
  }),
});
