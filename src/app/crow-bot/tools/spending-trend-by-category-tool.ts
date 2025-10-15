import { tool as createTool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";

/* ----------------------------- ZOD SCHEMAS ----------------------------- */

export const spendingTrendByCategorySchema = z.object({}).passthrough();

export type SpendingTrendByCategoryInput = {
  userUuid?: string;
  startDate?: string;
  endDate?: string;
  category?: string;
  limit?: number;
};

/* ---------------------- Helper ---------------------- */

function toNumber(v: any) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

function getDateRange(startDate?: string, endDate?: string) {
  const today = new Date();
  const isoToday = today.toISOString().split("T")[0];
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const clean = (s?: string | null) => (s || "").trim().replace(/^"|"$/g, "");
  const isValidISO = (d?: string | null) =>
    !!d && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));

  const toUTC = (dateStr: string, endOfDay = false) => {
    const local = new Date(dateStr);
    if (endOfDay) local.setHours(23, 59, 59, 999);
    else local.setHours(0, 0, 0, 0);
    return new Date(local.toISOString());
  };

  const startStr = clean(startDate);
  const endStr = clean(endDate);

  const start = isValidISO(startStr) ? toUTC(startStr) : toUTC(firstOfMonth);
  const end = isValidISO(endStr) ? toUTC(endStr, true) : toUTC(isoToday, true);

  return { start, end };
}

/* ---------------------- Core Logic ---------------------- */

export async function runSpendingTrendByCategory(rawInput: any) {
  const sessionResult = await validateSession();
  if (!sessionResult.success) return { error: "Unauthorized." };

  const input = rawInput?.structured_data ?? rawInput ?? {};
  const { category, startDate, endDate } = input;
  const userUuid = input.userUuid || sessionResult.userUuid;
  if (!userUuid)
    return { message: "❌ Missing user ID — cannot fetch expenses." };

  const { start, end } = getDateRange(startDate, endDate);

  // const userCategories = await getUserCategories(userUuid);
  // const validCategories = userCategories.map((c: any) => c.name.toLowerCase());

  const transactions = await prisma.transaction.findMany({
    where: {
      user_uuid: userUuid,
      timestamp: { gte: start, lte: end },
      amount: { gt: 0 },
      ...(category
        ? { Category: { name: { equals: category, mode: "insensitive" } } }
        : {}),
    },
    include: { Category: { select: { name: true } } },
    orderBy: { timestamp: "asc" },
  });

  if (!transactions.length) {
    return { message: "No expenses found for the given range.", trendData: [] };
  }

  const grouped: Record<string, Record<string, number>> = {};

  for (const tx of transactions) {
    const dateStr = new Date(tx.timestamp).toISOString().split("T")[0]; // YYYY-MM-DD
    const cat = tx.Category?.name ?? "Uncategorized";

    if (!grouped[dateStr]) grouped[dateStr] = {};
    if (!grouped[dateStr][cat]) grouped[dateStr][cat] = 0;
    grouped[dateStr][cat] += toNumber(tx.amount);
  }

  // Convert to trendData usable by Recharts
  const trendData = Object.entries(grouped).map(([date, cats]) => ({
    date,
    ...cats,
  }));

  const totals: Record<string, number> = {};
  for (const row of trendData) {
    for (const [cat, val] of Object.entries(row)) {
      if (cat === "date") continue;
      totals[cat] = (totals[cat] || 0) + Number(val);
    }
  }

  const totalOverall = Object.values(totals).reduce((a, b) => a + b, 0);

  console.log("📈 trendData:", trendData);
  return {
    message: "📊 Spending trend generated successfully.",
    trendData, // for Recharts
    totals,
    totalOverall,
    range: `${start.toISOString().split("T")[0]} → ${end.toISOString().split("T")[0]}`,
    categoryFilter: category ?? "All",
  };
}

/* ---------------------- Tool Definition ---------------------- */
export const spendingTrendByCategoryTool = createTool({
  name: "SpendingTrendByCategory",
  description:
    "Generates a daily spending trend grouped by category and date. Accepts filters and date range.",
  inputSchema: spendingTrendByCategorySchema,
  execute: runSpendingTrendByCategory,
});
