"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "next-auth/react";
import { transactionRead } from "@/common/schemas";
import { numberToINR } from "@/common/utils";
import { z } from "zod";

type Transaction = z.infer<typeof transactionRead>;
interface CategoricalSpend {
  category: string;
  total: number;
  count: number;
}

function CategoricalSpendsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

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

// Main categorical spends component
function CategoricalSpends({ transactions }: { transactions: Transaction[] }) {
  const categoricalSpends = useMemo(
    () => transformToCategoricalSpends(transactions),
    [transactions]
  );

  if (categoricalSpends.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <p className="text-muted-foreground">No transaction data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {categoricalSpends.map((spend) => (
        <Card
          key={spend.category}
          className="hover:shadow-lg transition-shadow"
        >
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {spend.category}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberToINR(spend.total)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {spend.count} transaction{spend.count !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Main dashboard page component
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/transactions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        throw new Error(`Failed to fetch transactions: ${response.statusText}`);
      }
      const data = await response.json();
      setTransactions(
        Array.isArray(data.transactions) ? data.transactions : []
      );
    } catch (err) {
      setError("Failed to load transactions");
      if (process.env.NODE_ENV !== "production") {
        console.error("Error fetching transactions:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setError("Please sign in to view this page");
      setIsLoading(false);
      return;
    }
    if (session?.user?.uuid) {
      fetchTransactions();
    }
  }, [status, session, fetchTransactions]);

  if (status === "loading") {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your spending patterns and financial insights
          </p>
        </div>
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-semibold mb-4">Categorical Spends</h2>
            <CategoricalSpendsSkeleton />
          </div>
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || error) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="text-center text-red-500 p-4">
          <p>{error || "Please sign in to view this page"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your spending patterns and financial insights
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-4">Categorical Spends</h2>
          {isLoading ? (
            <CategoricalSpendsSkeleton />
          ) : (
            <CategoricalSpends transactions={transactions} />
          )}
        </div>
      </div>
    </div>
  );
}
