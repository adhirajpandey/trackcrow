import prisma from "@/lib/prisma-rewrite";
import { PostgresRateLimiter } from "@/server/rate-limit/postgres";
import type { DiagnosticReportInput } from "./schemas";

const limiter = new PostgresRateLimiter();

export async function saveDiagnosticReport(
  userUuid: string,
  input: DiagnosticReportInput,
) {
  // All tokens and report kinds for a user share one atomic 24-hour bucket.
  const limit = await limiter.consume(`diagnostics:${userUuid}`, 10, 86400);
  if (!limit.allowed)
    return { status: "limited" as const, resetAt: limit.resetAt };
  const report = await prisma.diagnosticReport.create({
    data: { ...input, userUuid, note: input.note ?? null },
    select: { uuid: true },
  });
  return { status: "created" as const, uuid: report.uuid };
}
