import { tool as createTool } from "ai";
import { z } from "zod";

export const calculateTotalSpentSchema = z.object({
  startDate: z.string().optional().describe("Start date in ISO format"),
  endDate: z.string().optional().describe("End date in ISO format"),
});
export type CalculateTotalSpentInput = z.infer<
  typeof calculateTotalSpentSchema
>;

export async function runCalculateTotalSpent(input: CalculateTotalSpentInput) {
  // Mocked calculation
  return { total: 1234, ...input };
}
export const calculateTotalSpentTool = createTool({
  name: "calculate_total_spent",
  description: "Calculate the total amount spent in a given period",
  inputSchema: calculateTotalSpentSchema,
  execute: runCalculateTotalSpent,
});
