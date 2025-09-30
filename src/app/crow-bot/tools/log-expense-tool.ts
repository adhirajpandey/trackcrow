import { tool as createTool } from "ai";
import { z } from "zod";

export const logExpenseSchema = z.object({
  amount: z.number().describe("The amount of money spent"),
  category: z.string().describe("The category of the expense"),
  subcategory: z.string().describe("The subcategory of the expense"),
  date: z
    .string()
    .describe("The date of the expense in ISO format (YYYY-MM-DD)"),
  description: z
    .string()
    .optional()
    .describe("Optional description of the expense"),
});

export type LogExpenseInput = z.infer<typeof logExpenseSchema>;

export async function runLogExpense(input: LogExpenseInput) {
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return {
    ...input,
    description: input.description ?? "",
  };
}

export const logExpenseTool = createTool({
  description: "Log a new expense and display it as a card",
  inputSchema: logExpenseSchema,
  execute: runLogExpense,
});
