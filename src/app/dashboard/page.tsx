import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import type { TransactionRecord, UserCategorySummary } from "@/common/types";
import { DashboardTimeframeSelector } from "@/app/dashboard/components/timeframe-selector";
import { Summary } from "@/app/dashboard/components/summary";
import { CategoricalSpends } from "@/app/dashboard/components/categorical-spends";
import { UntrackedTransactions } from "@/app/dashboard/components/untracked-transactions";
import { MonthlySpendingChart } from "@/app/dashboard/components/monthly-spending-chart";
import { TrackedTransactions } from "@/app/dashboard/components/tracked-transactions";
import { ErrorMessage } from "@/components/error-message";
import {
  parseMonthParam,
  getCurrentMonthYYYYMM,
  getCategoricalSpends,
} from "@/common/utils";
import { unwrapOrResponse } from "@/server/api/responses";
import { toUserCategorySummary } from "@/server/modules/categories/helpers";
import { listCategoriesForUser } from "@/server/modules/categories/service";
import { listTransactionsForRange } from "@/server/modules/transactions/service";

interface DashboardSearchParams {
  month?: string;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<DashboardSearchParams>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return (
      <ErrorMessage message="Please sign in to view this page" />
    );
  }
  let transactions: TransactionRecord[] = [];
  let userCategories: UserCategorySummary[] = [];

  const { month } = await searchParams;
  const { startDate, endDate, selectedMonth } = parseMonthParam(month || "");

  try {
    const [transactionsResult, categoriesResult] = await Promise.all([
      listTransactionsForRange(session.user.uuid, { startDate, endDate }),
      listCategoriesForUser(session.user.uuid),
    ]);
    const transactionData = unwrapOrResponse(transactionsResult);
    const categoryData = unwrapOrResponse(categoriesResult);
    if (transactionData instanceof Response || categoryData instanceof Response) {
      throw new Error("Failed to load dashboard data");
    }
    transactions = transactionData;
    userCategories = categoryData.map(toUserCategorySummary);
  } catch {
    return (
      <ErrorMessage message="Failed to load transactions or user categories" />
    );
  }

  const categorizedTransactions = transactions.filter((txn) => txn.category);
  const untrackedTransactions = transactions.filter((txn) => !txn.category);

  const categoricalSpends = getCategoricalSpends(transactions);

  return (
    <div className="container mx-auto p-6 lg:pl-8">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground leading-snug">
              Overview of your spending patterns and financial insights
            </p>
          </div>

          <div className="flex gap-2 self-start md:self-auto">
            <DashboardTimeframeSelector
              initialMonthParam={month || getCurrentMonthYYYYMM()}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div>
            <Summary
              transactions={transactions}
              selectedTimeframe={month || getCurrentMonthYYYYMM()}
              userCategories={userCategories}
            />
          </div>
          <div>
            <CategoricalSpends spends={categoricalSpends} selectedTimeframe={month || getCurrentMonthYYYYMM()} />
          </div>
          <div>
            <UntrackedTransactions
              txns={untrackedTransactions.slice(0, 5)}
              selectedTimeframe={month || getCurrentMonthYYYYMM()}
            />
          </div>
          <div>
            <MonthlySpendingChart
              transactions={transactions}
              selectedMonth={selectedMonth}
            />
          </div>
          <div className="lg:col-span-2">
            <TrackedTransactions
              txns={categorizedTransactions.slice(0, 10)}
              selectedTimeframe={month || getCurrentMonthYYYYMM()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
