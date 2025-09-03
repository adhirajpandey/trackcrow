"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Transaction } from "@/common/schemas";
import { Summary } from "@/components/summary";
import { CategoricalSpends } from "@/components/categorical-spends";
import { RecentTransactions } from "@/components/recent-transactions";
import { MonthlySpendingChart } from "@/components/monthly-spending-chart";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type MonthKey = string; // e.g., "2025-09"

function toMonthKey(date: Date): MonthKey {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

function parseTxnDate(txn: Transaction): Date {
  if (typeof txn.timestamp === "number") {
    const ts = txn.timestamp;
    return new Date(ts > 1e12 ? ts : ts * 1000);
  }
  const iso = txn.ist_datetime || txn.createdAt;
  return new Date(iso);
}

function monthLabelFromKey(key: MonthKey): string {
  const [y, m] = key.split("-").map((v) => parseInt(v, 10));
  const d = new Date(y, m - 1, 1);
  return d.toLocaleString("en-GB", {
    timeZone: "Asia/Kolkata",
    month: "long",
    year: "numeric",
  });
}

export function DashboardClient({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const monthKeysDescending = useMemo(() => {
    const set = new Set<MonthKey>();
    for (const t of transactions) {
      const d = parseTxnDate(t);
      set.add(toMonthKey(d));
    }
    return Array.from(set).sort((a, b) => (a < b ? 1 : a > b ? -1 : 0));
  }, [transactions]);

  const [selected, setSelected] = useState<MonthKey | "all">("all");

  // Initialize from query param
  useEffect(() => {
    const q = searchParams?.get("month");
    if (!q) return;
    if (q === "all") {
      setSelected("all");
    } else if (/^\d{4}-\d{2}$/.test(q)) {
      setSelected(q as MonthKey);
    }
  }, [searchParams]);

  // Push to query param on change
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("month", selected === "all" ? "all" : selected);
    router.replace(`?${params.toString()}`);
  }, [selected, router, searchParams]);

  const filtered = useMemo(() => {
    if (selected === "all") return transactions;
    return transactions.filter((t) => toMonthKey(parseTxnDate(t)) === selected);
  }, [transactions, selected]);

  const selectedLabel =
    selected === "all" ? "All time" : monthLabelFromKey(selected);
  const selectedMonth =
    selected === "all"
      ? null
      : (() => {
          const [y, m] = selected.split("-").map((v) => parseInt(v, 10));
          return { year: y, month: m - 1 } as { year: number; month: number };
        })();

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground leading-snug">
            Overview of your spending patterns and financial insights
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-3 shrink-0 font-bold w-[140px] sm:w-auto sm:ml-auto justify-center"
            >
              {selectedLabel}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Timeframe</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setSelected("all")}>
              All time
            </DropdownMenuItem>
            {monthKeysDescending.map((key) => (
              <DropdownMenuItem key={key} onClick={() => setSelected(key)}>
                {monthLabelFromKey(key)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <Summary transactions={filtered} />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <CategoricalSpends
            categoricalSpends={(() => {
              const categoryMap = new Map<
                string,
                { total: number; count: number }
              >();
              filtered.forEach((transaction) => {
                const category = transaction.category?.trim();
                if (!category) return;
                const current = categoryMap.get(category) || {
                  total: 0,
                  count: 0,
                };
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
            })()}
          />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <RecentTransactions txns={filtered.slice(0, 5)} />
        </div>
        <div className="col-span-1 md:col-span-2 lg:col-span-1">
          <MonthlySpendingChart
            transactions={filtered}
            selectedMonth={selectedMonth}
          />
        </div>
      </div>
    </div>
  );
}
