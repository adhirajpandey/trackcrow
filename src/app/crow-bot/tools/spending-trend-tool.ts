import { tool as createTool } from "ai";
import { z } from "zod";

export const spendingTrendSchema = z.object({
  period: z
    .string()
    .describe("The period for the trend (e.g., week, month, year)"),
});
export type SpendingTrendInput = z.infer<typeof spendingTrendSchema>;

export async function runSpendingTrend(input: SpendingTrendInput) {
  // Mocked trend data
  return {
    period: input.period,
    trend: [
      { date: "2025-09-25", total: 200 },
      { date: "2025-09-26", total: 150 },
    ],
  };
}
export const spendingTrendTool = createTool({
  name: "spending_trend",
  description: "Show spending trend over a given period",
  inputSchema: spendingTrendSchema,
  execute: runSpendingTrend,
});
