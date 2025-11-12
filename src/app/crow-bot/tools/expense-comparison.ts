import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";
import { tool as createTool } from "ai";

/* ----------------------------- ZOD SCHEMA ----------------------------- */
const expenseComparisonSchema = z.object({
  category: z.array(z.string()).nonempty(), // can contain category/subcategory/remark
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

/* ----------------------------- TOOL EXECUTION ----------------------------- */
export async function runExpenseComparison(input: any) {
  const structured = "structured_data" in input ? input.structured_data : input;
  const parsed = expenseComparisonSchema.parse(structured);
  const { category, startDate, endDate } = parsed;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: sessionResult.error || "User not authenticated." };
  }

  const { userUuid } = sessionResult;

  // Handle optional time range
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  try {
    /* 🧠 STEP 1: Identify what type(s) of items these names refer to */
    const [categoryRecords, subcategoryRecords, remarkMatches] =
      await Promise.all([
        prisma.category.findMany({
          where: {
            user_uuid: userUuid,
            name: { in: category, mode: "insensitive" },
          },
          select: { id: true, name: true },
        }),
        prisma.subcategory.findMany({
          where: {
            user_uuid: userUuid,
            name: { in: category, mode: "insensitive" },
          },
          select: { id: true, name: true },
        }),
        prisma.transaction.findMany({
          where: {
            user_uuid: userUuid,
            remarks: { in: category, mode: "insensitive" },
          },
          select: { remarks: true },
          distinct: ["remarks"],
        }),
      ]);

    // detect type combinations
    const hasCategories = categoryRecords.length > 0;
    const hasSubcategories = subcategoryRecords.length > 0;
    const hasRemarks = remarkMatches.length > 0;

    let comparisonType = "unknown";
    if (hasCategories && hasSubcategories)
      comparisonType = "category vs subcategory";
    else if (hasCategories && hasRemarks) comparisonType = "category vs remark";
    else if (hasSubcategories && hasRemarks)
      comparisonType = "subcategory vs remark";
    else if (hasCategories) comparisonType = "category vs category";
    else if (hasSubcategories) comparisonType = "subcategory vs subcategory";
    else if (hasRemarks) comparisonType = "remark vs remark";

    if (comparisonType === "unknown") {
      return {
        message: `❌ None of [${category.join(", ")}] were found as categories, subcategories, or remarks.`,
      };
    }

    /* 🗂 STEP 2: Build where clause for transactions */
    const whereClause: any = { user_uuid: userUuid };
    if (start && end) whereClause.timestamp = { gte: start, lte: end };
    else if (start) whereClause.timestamp = { gte: start };
    else if (end) whereClause.timestamp = { lte: end };

    // category / subcategory / remark filters combined
    whereClause.OR = [
      { categoryId: { in: categoryRecords.map((c) => c.id) } },
      { subcategoryId: { in: subcategoryRecords.map((s) => s.id) } },
      { remarks: { in: category, mode: "insensitive" } },
    ];

    /* 💰 STEP 3: Query summed expenses */
    const expenseData = await prisma.transaction.findMany({
      where: whereClause,
      select: {
        amount: true,
        Category: { select: { name: true } },
        Subcategory: { select: { name: true } },
        remarks: true,
      },
    });

    if (expenseData.length === 0) {
      return {
        message: `⚠️ No matching transactions found for ${category.join(", ")}.`,
      };
    }

    /* 📊 STEP 4: Aggregate totals by label */
    const totals: Record<string, number> = {};
    for (const t of expenseData) {
      const label =
        t.Category?.name ||
        t.Subcategory?.name ||
        (t.remarks ? t.remarks.trim() : "Unlabeled");
      totals[label] = (totals[label] || 0) + Number(t.amount);
    }

    const results = Object.entries(totals)
      .map(([label, totalSpent]) => ({
        label,
        totalSpent,
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent);

    /* 🧾 STEP 5: Friendly summary message */
    let timeRangeText = "of all time";
    if (start && end)
      timeRangeText = `between ${start.toDateString()} and ${end.toDateString()}`;
    else if (start) timeRangeText = `since ${start.toDateString()}`;
    else if (end) timeRangeText = `till ${end.toDateString()}`;

    const message = `📊 ${comparisonType} expense comparison ${timeRangeText}.`;

    /* ✅ STEP 6: Return pie chart data */
    return {
      message,
      comparisonType,
      timeRange: { start: start ?? null, end: end ?? null },
      chartType: "pie",
      results, // usable directly in frontend chart (label + totalSpent)
    };
  } catch (error) {
    console.error("❌ Failed to fetch expense comparison:", error);
    return { error: "Failed to calculate expense comparison." };
  }
}

/* ----------------------------- EXPORT TOOL ----------------------------- */
export const expenseComparisonTool = createTool({
  name: "expenseComparison",
  description:
    "Compares total spending between categories, subcategories, or remarks, and returns a pie chart dataset for the specified timeframe (or all time).",
  inputSchema: expenseComparisonSchema,
  execute: runExpenseComparison,
});
