import { tool as createTool } from "ai";
import { z } from "zod";

export const showTransactionsSchema = z.object({
  limit: z.number().optional().describe("How many transactions to show"),
});
export type ShowTransactionsInput = z.infer<typeof showTransactionsSchema>;

export async function runShowTransactions(input: ShowTransactionsInput) {
  // Mocked example
  return {
    transactions: [
      { amount: 50, category: "Food", date: "2025-10-01" },
      { amount: 120, category: "Transport", date: "2025-10-02" },
    ].slice(0, input.limit ?? 10),
  };
}
export const showTransactionsTool = createTool({
  name: "show_transactions",
  description: "Show a list of recent transactions",
  inputSchema: showTransactionsSchema,
  execute: runShowTransactions,
});
