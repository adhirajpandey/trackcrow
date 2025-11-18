import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";
import { tool as createTool } from "ai";

/* ----------------------------- ZOD SCHEMA ----------------------------- */
const totalSpendSchema = z.object({
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

/* ----------------------------- TOOL EXECUTION ----------------------------- */
export async function runTotalSpend(input: any) {
  const structured = "structured_data" in input ? input.structured_data : input;
  const parsed = totalSpendSchema.parse(structured);

  const { category, subcategory, remarks, startDate, endDate } = parsed;

  // 🕒 Date handling
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  // ✅ Auth check
  const sessionResult = await validateSession();
  if (!sessionResult.success)
    return { error: sessionResult.error || "User not authenticated." };

  const { userUuid } = sessionResult;

  try {
    const whereClause: any = { user_uuid: userUuid };

    // ⏰ Time range filters
    if (start && end) whereClause.timestamp = { gte: start, lte: end };
    else if (start) whereClause.timestamp = { gte: start };
    else if (end) whereClause.timestamp = { lte: end };

    let categoryRecord = null;
    let subcatRecord = null;

    if (category?.trim()) {
      categoryRecord = await prisma.category.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: category.trim(), mode: "insensitive" },
        },
      });

      if (!categoryRecord) {
        console.warn(
          `⚠️ Category "${category}" not found for user ${userUuid}`
        );
      }
    }

    if (subcategory?.trim()) {
      subcatRecord = await prisma.subcategory.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: subcategory.trim(), mode: "insensitive" },
          ...(categoryRecord && { categoryId: categoryRecord.id }),
        },
      });

      if (!subcatRecord) {
        console.warn(
          `⚠️ Subcategory "${subcategory}" not found for user ${userUuid}`
        );
      }
    }

    if (subcatRecord) {
      categoryRecord = await prisma.category.findFirst({
        where: { id: subcatRecord.categoryId },
      });
    }

    if (!categoryRecord && subcatRecord) {
      categoryRecord = await prisma.category.findFirst({
        where: { id: subcatRecord.categoryId },
      });
    }

    if (categoryRecord) whereClause.categoryId = categoryRecord.id;
    if (subcatRecord) whereClause.subcategoryId = subcatRecord.id;

    if (remarks?.trim()) {
      whereClause.remarks = { contains: remarks.trim(), mode: "insensitive" };
    }

    const total = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: whereClause,
    });

    const totalAmount = Number(total._sum.amount || 0);

    let timeRange = "of all time";
    if (start && end)
      timeRange = `between ${start.toDateString()} and ${end.toDateString()}`;
    else if (start) timeRange = `since ${start.toDateString()}`;
    else if (end) timeRange = `till ${end.toDateString()}`;

    const filters: string[] = [];
    if (categoryRecord) filters.push(`Category: ${categoryRecord.name}`);
    if (subcatRecord) filters.push(`Subcategory: ${subcatRecord.name}`);
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
        category: categoryRecord?.name ?? null,
        subcategory: subcatRecord?.name ?? null,
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
    "Calculates total spending within a timeframe, optionally filtered by category, subcategory or remarks.",
  inputSchema: totalSpendSchema,
  execute: runTotalSpend,
});
