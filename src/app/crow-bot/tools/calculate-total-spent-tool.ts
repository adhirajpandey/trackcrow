import { tool as createTool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";

/* ---------------------- Schema ---------------------- */

export const calculateTotalSpentSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  category: z.string().optional(),
});
export type CalculateTotalSpentInput = z.infer<
  typeof calculateTotalSpentSchema
>;

/* ---------------------- Helper ---------------------- */

function extractDateRangeFields(structured_data: any) {
  if (!structured_data || typeof structured_data !== "object") {
    console.warn("⚠️ Invalid structured_data:", structured_data);
    return { startDate: null, endDate: null };
  }

  const { startDate = null, endDate = null } = structured_data;

  const today = new Date();
  const isoToday = today.toISOString().split("T")[0];
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const isValidISO = (d: string | null) =>
    !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));

  return {
    startDate: isValidISO(startDate) ? startDate : firstOfMonth,
    endDate: isValidISO(endDate) ? endDate : isoToday,
  };
}

/* ---------------------- Core Logic ---------------------- */

export async function runCalculateTotalSpent(input: CalculateTotalSpentInput) {
  const structured =
    "structured_data" in input
      ? extractDateRangeFields(input.structured_data)
      : extractDateRangeFields(input);

  const { startDate, endDate } = structured;
  const category =
    "structured_data" in input
      ? input.structured_data?.category || null
      : input.category || null;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: "Unauthorized. Please log in first." };
  }

  const { userUuid } = sessionResult;

  console.log(
    `📊 Fetching total spend for user ${userUuid} from ${startDate} → ${endDate}`
  );

  const whereClause: any = {
    user_uuid: userUuid,
    timestamp: {
      gte: new Date(`${startDate}T00:00:00Z`),
      lte: new Date(`${endDate}T23:59:59Z`),
    },
  };

  if (category) {
    whereClause.Category = {
      name: { equals: category, mode: "insensitive" },
    };
  }

  const transactions = await prisma.transaction.findMany({
    where: whereClause,
    select: { amount: true },
  });

  const total = transactions.reduce((sum, tx) => sum + Number(tx.amount), 0);

  console.log(
    "✅ Total calculated:",
    total,
    "across",
    transactions.length,
    "transactions"
  );

  return {
    startDate,
    endDate,
    total,
    count: transactions.length,
    message:
      transactions.length === 0
        ? `No transactions found between ${startDate} and ${endDate}.`
        : `💰 Total spent between ${startDate} and ${endDate}: ₹${total.toLocaleString()}`,
  };
}

/* ---------------------- Tool Definition ---------------------- */

export const calculateTotalSpentTool = createTool({
  name: "calculateTotalSpent",
  description:
    "Calculate the total amount spent by the user within a given time range.",
  inputSchema: calculateTotalSpentSchema,
  execute: runCalculateTotalSpent,
});
