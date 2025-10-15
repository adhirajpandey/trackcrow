import { tool as createTool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession, getUserCategories } from "@/common/server";

/* ----------------------------- ZOD SCHEMAS ----------------------------- */

export const biggestCategorySchema = z.object({}).passthrough();

/* ---------------------- Helper ---------------------- */

function getDateRange(startDate?: string, endDate?: string) {
  const today = new Date();
  const isoToday = today.toISOString().split("T")[0];
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const clean = (s?: string | null) => (s || "").trim().replace(/^"|"$/g, "");

  const isValidISO = (d: string | null | undefined) =>
    !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));

  const toUTC = (dateStr: string, endOfDay = false) => {
    const local = new Date(dateStr);
    if (endOfDay) {
      local.setHours(23, 59, 59, 999);
    } else {
      local.setHours(0, 0, 0, 0);
    }
    return new Date(local.toISOString());
  };

  const startStr = clean(startDate);
  const endStr = clean(endDate);

  const start = isValidISO(startStr) ? toUTC(startStr) : toUTC(firstOfMonth);
  const end = isValidISO(endStr) ? toUTC(endStr, true) : toUTC(isoToday, true);

  return { start, end };
}

/* ---------------------- Core Logic ---------------------- */
export async function runBiggestExpenseCategory(input: any) {
  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return { error: "Unauthorized. Please log in first." };
  }

  console.log("this is how input looks like", input);

  const { userUuid } = sessionResult;
  const { startDate, endDate } = input.structured_data;

  const { start, end } = getDateRange(startDate, endDate);

  const userCategories = await getUserCategories(userUuid);
  const validCategoryNames = userCategories.map((c: any) =>
    c.name.toLowerCase()
  );

  const transactions = await prisma.transaction.findMany({
    where: {
      user_uuid: userUuid,
      timestamp: { gte: start, lte: end },
      amount: { gt: 0 },
    },
    include: {
      Category: { select: { name: true } },
      Subcategory: { select: { name: true } },
    },
  });

  if (!transactions.length) {
    return {
      message: "No transactions found in this time period.",
      total: 0,
      categoriesConsidered: validCategoryNames,
    };
  }

  const extractBaseCategory = (name: string | null | undefined) => {
    if (!name) return "Uncategorized";
    return name.split("·")[0].trim();
  };

  const categorySums: Record<string, number> = {};
  const subcategoryBreakdown: Record<string, Record<string, number>> = {};

  for (const tx of transactions) {
    const rawCat = tx.Category?.name ?? "Uncategorized";
    const baseCategory = extractBaseCategory(rawCat);
    const subcatName = tx.Subcategory?.name ?? rawCat;

    const catLower = baseCategory.toLowerCase();
    if (!validCategoryNames.includes(catLower)) continue;

    const normalizedCat =
      userCategories.find((c: any) => c.name.toLowerCase() === catLower)
        ?.name ?? baseCategory;

    categorySums[normalizedCat] =
      (categorySums[normalizedCat] || 0) + Number(tx.amount);

    if (!subcategoryBreakdown[normalizedCat])
      subcategoryBreakdown[normalizedCat] = {};
    subcategoryBreakdown[normalizedCat][subcatName] =
      (subcategoryBreakdown[normalizedCat][subcatName] || 0) +
      Number(tx.amount);
  }

  const entries = Object.entries(categorySums);
  if (!entries.length) {
    return {
      message: "No categorized expenses found within your valid categories.",
      total: 0,
      categoriesConsidered: validCategoryNames,
    };
  }

  const [biggestCategory, biggestAmount] = entries.reduce(
    (a, b) => (b[1] > a[1] ? b : a),
    entries[0]
  );

  const total = Object.values(categorySums).reduce((a, b) => a + b, 0);
  const percent =
    total > 0 ? ((biggestAmount / total) * 100).toFixed(1) : "0.0";

  const sortedBreakdown = Object.fromEntries(
    entries.sort((a, b) => b[1] - a[1])
  );

  const timeRange = `${startDate ?? start.toISOString().split("T")[0]} → ${
    endDate ?? end.toISOString().split("T")[0]
  }`;

  console.log(
    "✅ Computed biggest expense category:",
    biggestCategory,
    "→",
    biggestAmount,
    "out of total",
    total
  );

  return {
    message: `🏆 Biggest expense category: ${biggestCategory} — ₹${biggestAmount.toLocaleString()} (${percent}%).`,
    biggestCategory,
    biggestAmount,
    percent: +percent,
    total,
    breakdown: sortedBreakdown,
    subcategoryBreakdown,
    timeRange,
    categoriesConsidered: validCategoryNames,
  };
}

/* ---------------------- Tool Definition ---------------------- */
export const biggestExpenseCategoryTool = createTool({
  name: "biggestExpenseCategory",
  description:
    "Find the category with the highest total spend (summing across all its subcategories) in the given period.",
  inputSchema: biggestCategorySchema,
  execute: runBiggestExpenseCategory,
});
