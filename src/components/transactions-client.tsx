"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import type { Transaction } from "@/common/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { numberToINR, formatISTDate, formatISTTime } from "@/common/utils";
import DataTable from "@/components/ui/data-table";
import type { ColumnDef } from "@tanstack/react-table";

type MonthKey = string; // e.g., "2025-09"

function toMonthKey(date: Date): MonthKey {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}

// Interface for transaction with optional timestamp and date fields
interface TransactionWithTimestamp {
  timestamp?: number;
  ist_datetime?: string | null | undefined;
  createdAt?: string | null | undefined;
  [key: string]: unknown;
}

function parseTxnDate(txn: TransactionWithTimestamp): Date {
  if (typeof txn.timestamp === "number") {
    const ts = txn.timestamp;
    return new Date(ts > 1e12 ? ts : ts * 1000);
  }
  const iso = txn.ist_datetime || txn.createdAt;
  return new Date(iso ?? "");
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
export function TransactionsClient({
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
  const ITEMS_PER_PAGE = 20;
  const [page, setPage] = useState<number>(1);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    const q = searchParams?.get("month");
    if (!q) return;
    if (q === "all") {
      setSelected("all");
    } else if (/^\d{4}-\d{2}$/.test(q)) {
      setSelected(q as MonthKey);
    }
    // initialize page from query param as well
    const p = parseInt(searchParams?.get("page") || "1", 10);
    setPage(Number.isNaN(p) || p < 1 ? 1 : p);
    // initialize search query from URL
    const qq = searchParams?.get("q") || "";
    setQuery(qq);
  }, [searchParams, router]);

  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    params.set("month", selected === "all" ? "all" : selected);
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  }, [selected, page, router, searchParams]);

  // Keep URL in sync when query changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (query && query.length > 0) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    params.set("month", selected === "all" ? "all" : selected);
    params.set("page", String(page));
    router.replace(`?${params.toString()}`);
  }, [query, selected, page, router, searchParams]);

  const filtered = useMemo(() => {
    const base =
      selected === "all"
        ? transactions
        : transactions.filter((t) => toMonthKey(parseTxnDate(t)) === selected);

    const q = (query || "").trim().toLowerCase();
    if (!q) return base;

    // digits-only string for amount matching
    const qDigits = q.replace(/[^0-9.-]/g, "");

    return base.filter((t) => {
      // check amount (both raw and formatted)
      const amt = Math.abs(t.amount ?? 0);
      const amtStr = String(amt);
      const formatted = numberToINR(amt).toLowerCase();
      if (qDigits && amtStr.includes(qDigits)) return true;
      if (formatted.includes(q)) return true;

      // only search these text fields per request
      const fields = [t.recipient, t.recipient_name, t.remarks];
      for (const f of fields) {
        if (f && String(f).toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [transactions, selected, query]);

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / ITEMS_PER_PAGE));
  // Ensure current page is within bounds
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages, page]);

  const start = (page - 1) * ITEMS_PER_PAGE;
  const end = Math.min(start + ITEMS_PER_PAGE, totalCount);
  const paginated = filtered.slice(start, end);

  const columns = useMemo<ColumnDef<Transaction, unknown>[]>(
    () => [
      {
        header: "Recipient",
        accessorFn: (row) => row.recipient_name || row.recipient,
        cell: ({ row }) => {
          const txn = row.original as Transaction;
          const initial = (
            txn.recipient_name?.[0] || txn.recipient[0]
          )?.toUpperCase();
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 text-xs">
                <AvatarFallback className="text-xs">{initial}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">
                  {txn.recipient_name || txn.recipient}
                </div>
                <div className="text-xs text-muted-foreground truncate flex items-center gap-2">
                  <span className="truncate">{txn.remarks || ""}</span>
                </div>
              </div>
            </div>
          );
        },
      },
      {
        header: "Category",
        accessorFn: (row) => row.category || "Uncategorized",
        cell: ({ row }) => {
          const txn = row.original as Transaction;
          return (
            <div className="text-sm">
              <div className="font-medium">
                {txn.category || "Uncategorized"}
              </div>
              {txn.subcategory ? (
                <div className="text-xs text-muted-foreground">
                  {txn.subcategory}
                </div>
              ) : null}
            </div>
          );
        },
      },
      {
        header: "Type",
        accessorKey: "type",
        cell: ({ getValue }) =>
          getValue() ? (
            <span className="inline-block shrink-0 rounded px-2 py-0.5 bg-muted text-muted-foreground text-[10px]">
              {String(getValue())}
            </span>
          ) : null,
      },
      {
        header: "Time",
        accessorFn: (row) => parseTxnDate(row),
        meta: {
          thClassName: "w-36 text-right py-2 px-4 font-medium text-sm",
          tdClassName: "py-3 px-4 align-top text-right",
        },
        cell: ({ row }) => {
          const d = parseTxnDate(row.original as Transaction);
          return (
            <div className="text-sm text-muted-foreground">
              <div className="text-right">{formatISTDate(d)}</div>
              <div className="text-xs text-muted-foreground text-right">
                {formatISTTime(d)}
              </div>
            </div>
          );
        },
      },
      {
        header: "Amount",
        accessorFn: (row) => row.amount,
        meta: {
          thClassName: "w-36 text-right py-2 px-4 font-medium text-sm",
          tdClassName: "py-3 px-4 align-top text-right",
        },
        cell: ({ row }) => (
          <div className="text-right">
            <div className="font-semibold text-sm">
              {numberToINR(Math.abs((row.original as Transaction).amount))}
            </div>
          </div>
        ),
      },
    ],
    [
      /* stable */
    ],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start sm:items-center justify-between gap-3">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground leading-snug">
            All transactions — Search or filter to focus on a specific period.
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="ml-3 shrink-0 font-bold w-[140px] sm:w-auto sm:ml-auto justify-center"
            >
              {selected === "all" ? "All time" : monthLabelFromKey(selected)}
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

      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        <Card>
          <CardHeader className="px-2 pt-4 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">
                Transactions
              </CardTitle>

              <div className="flex w-full sm:w-auto flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search"
                  className="w-full sm:w-60 min-w-0 rounded-md border px-3 py-2 text-sm bg-background text-foreground"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border px-2 pb-4 sm:px-4 max-h-[60vh] overflow-auto no-scrollbar">
            <div className="py-2">
              <DataTable columns={columns} data={paginated} />
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between text-sm text-muted-foreground px-2 sm:px-4">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">{start + 1}</span> -{" "}
            <span className="font-medium text-foreground">{end}</span> of{" "}
            <span className="font-medium text-foreground">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="px-3"
            >
              Prev
            </Button>
            <div className="px-2">Page</div>
            <div className="font-semibold">{page}</div>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="px-3"
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
