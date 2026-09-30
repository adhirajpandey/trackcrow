import { z } from "zod";

export const importSmsRequestSchema = z.object({
  data: z.object({
    message: z.string().min(1, "message is required").max(4000),
    timestamp: z.iso.datetime({ offset: true }).optional(),
    sender: z.string().trim().min(1).max(64).optional(),
    idempotencyKey: z.uuid().optional(),
  }),
  metadata: z.object({
    location: z.string().nullable().optional(),
    storeMessageBody: z.boolean().optional(),
  }),
});
