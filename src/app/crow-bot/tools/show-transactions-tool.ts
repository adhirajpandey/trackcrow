import { tool as createTool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";

export const showTransactionsSchema = z.object({
  limit: z.number().optional().describe("How many transactions to show"),
});
export type ShowTransactionsInput = z.infer<typeof showTransactionsSchema>;

export async function runShowTransactions(input: ShowTransactionsInput) {
  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: "Unauthorized. Please log in first." };
  }

  const { userUuid } = sessionResult;
  const limit = input.limit ?? 5;

  const transactions = await prisma.transaction.findMany({
    where: { user_uuid: userUuid },
    orderBy: { timestamp: "desc" },
    take: limit,
    include: {
      Category: { select: { name: true } },
      Subcategory: { select: { name: true } },
    },
  });

  console.log("Fetched transactions:", transactions);

  if (!transactions.length) {
    return { message: "No recent transactions found." };
  }

  const formatted = transactions.map((tx) => ({
    amount: tx.amount,
    category: tx.Category?.name || "Uncategorized",
    subcategory: tx.Subcategory?.name || null,
    recipient: tx.recipient,
    type: tx.type,
    remarks: tx.remarks,
    date: tx.timestamp.toISOString().split("T")[0],
  }));

  return {
    message: `🧾 Showing your ${formatted.length} most recent transactions.`,
    count: formatted.length,
    transactions: formatted,
  };
}

export const showTransactionsTool = createTool({
  name: "showTransactions",
  description: "Show a list of recent transactions for the current user.",
  inputSchema: showTransactionsSchema,
  execute: runShowTransactions,
});
