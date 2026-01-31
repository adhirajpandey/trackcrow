import { z } from "zod";
import { validateSession } from "@/common/server";
import { tool as createTool } from "ai";

/* ----------------------------- ZOD SCHEMA ----------------------------- */

/* ----------------------------- ZOD SCHEMA ----------------------------- */

const dashboardSummarySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

/* ----------------------------- TOOL EXECUTION ----------------------------- */

export async function runDashboardSummary(
  input: z.infer<typeof dashboardSummarySchema>
) {
  const { startDate, endDate } = input;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: sessionResult.error || "User not authenticated." };
  }

  return {
    message: "Ready to analyze? Your dashboard has the latest summary view.",
    startDate: startDate?.toISOString(),
    endDate: endDate?.toISOString(),
  };
}

/* ----------------------------- EXPORT TOOL ----------------------------- */

export const dashboardSummaryTool = createTool({
  description:
    "Used when the user asks for an overview, summary, or dashboard of their finances",
  parameters: dashboardSummarySchema,
  execute: runDashboardSummary as any,
} as any);
