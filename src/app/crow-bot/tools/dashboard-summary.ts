import { z } from "zod";
import { validateSession } from "@/common/server";
import { tool as createTool } from "ai";

/* ----------------------------- ZOD SCHEMA ----------------------------- */

const dashboardSummarySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .passthrough();

/* ----------------------------- HELPER ----------------------------- */

function extractDashboardDates(structured_data: any) {
  if (!structured_data || typeof structured_data !== "object") {
    console.warn("⚠️ Invalid structured_data passed to dashboardSummaryTool");
    return {};
  }

  const { startDate = null, endDate = null } = structured_data;

  const parsedStartDate = startDate
    ? new Date(startDate).toISOString()
    : new Date(new Date().setDate(1)).toISOString();

  const parsedEndDate = endDate
    ? new Date(endDate).toISOString()
    : new Date().toISOString(); // now

  return { startDate: parsedStartDate, endDate: parsedEndDate };
}

/* ----------------------------- EXECUTION ----------------------------- */

export async function runDashboardSummary(input: any) {
  const structured =
    "structured_data" in input
      ? extractDashboardDates(input.structured_data)
      : extractDashboardDates(input);

  const { startDate, endDate } = structured;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: sessionResult.error || "User not authenticated." };
  }

  return {
    message: "Ready to analyze? Your dashboard has the latest summary view.",
    startDate,
    endDate,
  };
}

/* ----------------------------- EXPORT TOOL ----------------------------- */

export const dashboardSummaryTool = createTool({
  name: "dashboardSummary",
  description:
    "Used when the user asks for an overview, summary, or dashboard of their finances",
  inputSchema: dashboardSummarySchema,
  execute: runDashboardSummary,
});
