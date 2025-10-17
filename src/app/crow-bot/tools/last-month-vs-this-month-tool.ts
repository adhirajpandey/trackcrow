import { tool as createTool } from "ai";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { validateSession } from "@/common/server";

/* ----------------------------- ZOD SCHEMAS ----------------------------- */

export const lastMonthVsThisMonthSchema = z.object({}).passthrough();
export type LastMonthVsThisMonthInput = z.infer<
  typeof lastMonthVsThisMonthSchema
>;

/* ----------------------------- HELPERS ----------------------------- */

function getMonthRange(offset = 0) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth() + offset, 1);
  const lastDay = new Date(now.getFullYear(), now.getMonth() + offset + 1, 0);
  return {
    start: new Date(firstDay.setHours(0, 0, 0, 0)),
    end: new Date(lastDay.setHours(23, 59, 59, 999)),
  };
}

function toNumber(v: any) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  const s = String(v).replace(/[^\d.-]/g, "");
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/* ----------------------------- TOOL EXECUTION ----------------------------- */

export async function runlastMonthVsThisMonth() {
  const session = await validateSession();
  if (!session.success) {
    return { error: "Unauthorized. Please log in first." };
  }

  const userUuid = session.userUuid;

  // Infer current and last month
  const current = getMonthRange(0);
  const previous = getMonthRange(-1);

  // Fetch both months’ transactions
  const transactions = await prisma.transaction.findMany({
    where: {
      user_uuid: userUuid,
      timestamp: { gte: previous.start, lte: current.end },
      amount: { gt: 0 },
    },
    select: { amount: true, timestamp: true },
    orderBy: { timestamp: "asc" },
  });

  if (!transactions.length) {
    return { message: "No transactions found for the last two months." };
  }

  // Aggregate by day
  const dailyTotals: Record<string, number> = {};
  for (const tx of transactions) {
    const dateKey = new Date(tx.timestamp).toISOString().split("T")[0];
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + Number(tx.amount);
  }

  // Build trend data
  const trendData = Object.entries(dailyTotals).map(([date, total]) => ({
    date,
    total,
  }));

  // Separate month totals
  let thisMonthTotal = 0;
  let lastMonthTotal = 0;

  for (const tx of transactions) {
    const d = new Date(tx.timestamp);
    if (d >= current.start && d <= current.end)
      thisMonthTotal += toNumber(tx.amount);
    else if (d >= previous.start && d <= previous.end)
      lastMonthTotal += toNumber(tx.amount);
  }

  const diff = thisMonthTotal - lastMonthTotal;
  const percentChange = lastMonthTotal > 0 ? (diff / lastMonthTotal) * 100 : 0;
  const trend = diff > 0 ? "up" : diff < 0 ? "down" : "neutral";

  return {
    message: "📊 Last Month vs This Month Spending Comparison",
    trendData,
    currentMonth: thisMonthTotal,
    lastMonth: lastMonthTotal,
    diff,
    percentChange,
    trend,
  };
}

/* ---------------------- Tool Definition ---------------------- */

export const lastMonthVsThisMonthTool = createTool({
  name: "lastMonthVsThisMonth",
  description: "Compare total spending between last month and this month.",
  inputSchema: lastMonthVsThisMonthSchema,
  execute: runlastMonthVsThisMonth,
});
