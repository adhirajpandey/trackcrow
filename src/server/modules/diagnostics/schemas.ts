import { z } from "zod";

export const diagnosticReportSchema = z
  .object({
    kind: z.enum(["report", "bank_request"]).default("report"),
    appVersion: z.string().trim().min(1).max(64),
    versionCode: z.number().int().nonnegative().max(2147483647),
    device: z.record(z.string(), z.json()),
    note: z.string().trim().max(4000).nullable().optional(),
    entries: z.array(z.record(z.string(), z.json())).max(500).default([]),
  })
  .strict();

export type DiagnosticReportInput = z.infer<typeof diagnosticReportSchema>;
