import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";
import { tool as createTool } from "ai";

/* ----------------------------- ZOD SCHEMA ----------------------------- */
const totalSpendSchema = z.object({
  category: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

/* ----------------------------- TOOL EXECUTION ----------------------------- */
export async function runTotalSpend(input: any) {
  const structured = "structured_data" in input ? input.structured_data : input;
  const parsed = totalSpendSchema.parse(structured);
  const { category, remarks, startDate, endDate } = parsed;

  // 🕒 Date handling
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  // ✅ Auth check
  const sessionResult = await validateSession();
  if (!sessionResult.success)
    return { error: sessionResult.error || "User not authenticated." };

  const { userUuid } = sessionResult;

  try {
    /* ------------------ STEP 1: BUILD FILTER ------------------ */
    const whereClause: any = { user_uuid: userUuid };

    // ⏰ Time range filters
    if (start && end) whereClause.timestamp = { gte: start, lte: end };
    else if (start) whereClause.timestamp = { gte: start };
    else if (end) whereClause.timestamp = { lte: end };

    // 🗂 Category filter
    if (category?.trim()) {
      const categoryRecord = await prisma.category.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: category.trim(), mode: "insensitive" },
        },
      });

      if (categoryRecord) {
        whereClause.categoryId = categoryRecord.id;
      } else {
        console.warn(
          `⚠️ Category "${category}" not found for user ${userUuid}`
        );
      }
    }

    // 🏷 Remarks filter
    if (remarks?.trim()) {
      whereClause.remarks = { contains: remarks.trim(), mode: "insensitive" };
    }

    /* ------------------ STEP 2: SUM TRANSACTIONS ------------------ */
    const total = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: whereClause,
    });

    const totalAmount = Number(total._sum.amount || 0);

    /* ------------------ STEP 3: FRIENDLY MESSAGE ------------------ */
    let timeRange = "of all time";
    if (start && end)
      timeRange = `between ${start.toDateString()} and ${end.toDateString()}`;
    else if (start) timeRange = `since ${start.toDateString()}`;
    else if (end) timeRange = `till ${end.toDateString()}`;

    const filters: string[] = [];
    if (category) filters.push(`Category: ${category}`);
    if (remarks) filters.push(`Remarks: "${remarks}"`);
    const filterText = filters.length ? ` (${filters.join(", ")})` : "";

    const message =
      totalAmount > 0
        ? `💵 Total spending ${timeRange}${filterText}: ₹${totalAmount.toLocaleString(
            "en-IN"
          )}`
        : `⚠️ No transactions found ${timeRange}${filterText}.`;

    /* ------------------ STEP 4: RETURN RESULT ------------------ */
    return {
      message,
      result: {
        totalSpent: totalAmount,
        category: category ?? null,
        remarks: remarks ?? null,
        startDate: start?.toISOString() ?? null,
        endDate: end?.toISOString() ?? null,
      },
    };
  } catch (error) {
    console.error("❌ Failed to calculate total spend:", error);
    return { error: "Failed to calculate total spend." };
  }
}

/* ----------------------------- EXPORT TOOL ----------------------------- */
export const totalSpendTool = createTool({
  name: "totalSpend",
  description:
    "Calculates total spending within a timeframe, optionally filtered by category or remarks.",
  inputSchema: totalSpendSchema,
  execute: runTotalSpend,
});
