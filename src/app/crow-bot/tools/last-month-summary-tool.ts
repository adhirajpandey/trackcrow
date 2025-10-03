import { tool as createTool } from "ai";
import { z } from "zod";

export const lastMonthSummarySchema = z.object({});
export type LastMonthSummaryInput = z.infer<typeof lastMonthSummarySchema>;

export async function runLastMonthSummary(input: LastMonthSummaryInput) {
  // Mocked summary
  console.log("Running last month summary with input:", input);
  return {
    month: "September 2025",
    totalSpent: 2450,
    topCategories: ["Food", "Rent", "Transport"],
  };
}
export const lastMonthSummaryTool = createTool({
  name: "last_month_summary",
  description: "Get a summary of last month's spending",
  inputSchema: lastMonthSummarySchema,
  execute: runLastMonthSummary,
});
