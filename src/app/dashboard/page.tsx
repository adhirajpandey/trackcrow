import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { transactionRead } from "@/common/schemas";
import { numberToINR } from "@/common/utils";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { Transaction } from "@/common/schemas";
import { z } from "zod";
import { RecentTransactions } from "@/components/recent-transactions";
import { MonthlySpendingChart } from "@/components/monthly-spending-chart";
import {
  CategoricalSpends,
  CategoricalSpend,
} from "@/components/categorical-spends";
import { Summary } from "@/components/summary";
import { DashboardClient } from "@/components/dashboard-client";

// Function to transform transactions into categorical spends
function transformToCategoricalSpends(
  transactions: Transaction[]
): CategoricalSpend[] {
  const categoryMap = new Map<string, { total: number; count: number }>();
  transactions.forEach((transaction) => {
    const category = transaction.category?.trim();
    if (!category) return;
    const current = categoryMap.get(category) || { total: 0, count: 0 };
    categoryMap.set(category, {
      total: current.total + transaction.amount,
      count: current.count + 1,
    });
  });
  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: data.total,
      count: data.count,
    }))
    .sort((a, b) => b.total - a.total);
}

// Main dashboard page component
export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Please sign in to view this page</p>
        </div>
      </div>
    );
  }
  let transactions: Transaction[] = [];
  try {
    const txns = await prisma.transaction.findMany({
      where: { user_uuid: session.user.uuid },
      orderBy: { timestamp: "desc" },
    });
    // Convert Date fields to ISO string for zod validation
    const serialized = txns.map((t) => ({
      ...t,
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      ist_datetime: t.ist_datetime ? t.ist_datetime.toISOString() : null,
    }));
    const validate = z.array(transactionRead).safeParse(serialized);
    if (validate.success) {
      transactions = validate.data;
    }
  } catch (err) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>Failed to load transactions</p>
        </div>
      </div>
    );
  }
  // (month name moved into MonthlySpendingChart component)

  return (
    <div className="container mx-auto p-6 lg:pl-8">
      <DashboardClient transactions={transactions} />
    </div>
  );
}
