import { tool as createTool } from "ai";
import { z } from "zod";

export const setBudgetSchema = z.object({
  category: z.string().describe("The category to set a budget for"),
  amount: z.number().describe("The budget amount"),
});
export type SetBudgetInput = z.infer<typeof setBudgetSchema>;

export async function runSetBudget(input: SetBudgetInput) {
  // Mocked budget setting
  return {
    category: input.category,
    budget: input.amount,
    status: "Budget set successfully",
  };
}
export const setBudgetTool = createTool({
  name: "set_budget",
  description: "Set a budget for a specific category",
  inputSchema: setBudgetSchema,
  execute: runSetBudget,
});
