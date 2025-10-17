"use client";
import { useSearchParams } from "next/navigation";
import React, { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Eye, Edit, MapPin, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DataTable from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import Link from "next/link";
import { numberToINR } from "@/common/utils";

type Transaction = {
  id: number;
  amount: number | string;
  category: string;
  subcategory?: string | null;
  date: string;
  type?: string;
  recipient?: string;
  remarks?: string;
  location?: string;
};

function ActionsCell({ transaction }: { transaction: Transaction }) {
  const [open, setOpen] = useState(false);

  return (
    <div
      className="relative z-20"
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="h-8 w-8 p-0 cursor-pointer"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          onPointerDown={(e) => e.stopPropagation()}
        >
          {transaction.location && (
            <DropdownMenuItem
              className="cursor-pointer"
              onClick={() =>
                window.open(
                  `https://www.google.com/maps/search/${encodeURIComponent(
                    transaction.location || ""
                  )}`,
                  "_blank"
                )
              }
            >
              <MapPin className="h-4 w-4 mr-2" /> View Location
            </DropdownMenuItem>
          )}

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link href={`/transactions/${transaction.id}`} target="_blank">
              <Eye className="h-4 w-4 mr-2" /> View Transaction
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem asChild className="cursor-pointer">
            <Link
              href={`/transactions/${transaction.id}?edit=true`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Edit className="h-4 w-4 mr-2" /> Edit Transaction
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export default function TransactionsReportPage() {
  const searchParams = useSearchParams();
  const dataParam = searchParams.get("data");

  const transactions: Transaction[] = useMemo(() => {
    if (!dataParam) return [];
    try {
      const parsed = JSON.parse(decodeURIComponent(dataParam));
      return parsed.map((t: any) => ({
        ...t,
        amount:
          typeof t.amount === "string" ? parseFloat(t.amount) || 0 : t.amount,
      }));
    } catch (err) {
      console.error("Invalid dataParam JSON:", err);
      return [];
    }
  }, [dataParam]);

  const [sorting, setSorting] = useState<any>([]);

  const totalAmount = useMemo(
    () => transactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0),
    [transactions]
  );

  const averageAmount = useMemo(
    () => (transactions.length ? totalAmount / transactions.length : 0),
    [transactions, totalAmount]
  );

  const topCategory = useMemo(() => {
    const categoryTotals: Record<string, number> = {};
    for (const t of transactions) {
      const amt = Number(t.amount) || 0;
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + amt;
    }
    const sorted = Object.entries(categoryTotals).sort((a, b) => b[1] - a[1]);
    return sorted.length > 0 ? sorted[0][0] : "N/A";
  }, [transactions]);

  const latestDate = useMemo(() => {
    if (transactions.length === 0) return null;
    const sorted = [...transactions].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    return new Date(sorted[0].date).toLocaleDateString("en-GB");
  }, [transactions]);

  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        header: "Date",
        accessorFn: (row) => new Date(row.date).toLocaleDateString("en-GB"),
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.date).toLocaleDateString("en-GB")}
          </div>
        ),
      },
      {
        header: "Amount",
        accessorFn: (row) => row.amount,
        cell: ({ row }) => (
          <div className="font-semibold text-white">
            {numberToINR(Math.abs(Number(row.original.amount) || 0))}
          </div>
        ),
      },
      {
        header: "Category",
        accessorFn: (row) =>
          `${row.category ?? "Uncategorized"}${row.subcategory ? ` · ${row.subcategory}` : ""}`,
        cell: ({ row }) => {
          const t = row.original as Transaction;
          return (
            <div className="text-sm text-muted-foreground truncate">
              {t.category || "Uncategorized"}
              {t.subcategory ? ` · ${t.subcategory}` : ""}
            </div>
          );
        },
      },
      {
        header: "Remarks",
        accessorFn: (row) => row.remarks || "-",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground truncate">
            {row.original.remarks || "-"}
          </div>
        ),
      },
      {
        header: "Type",
        accessorFn: (row) => row.type || "-",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground capitalize">
            {row.original.type || "-"}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => <ActionsCell transaction={row.original} />,
      },
    ],
    []
  );

  return (
    <div className="max-w-5xl mx-auto p-6 text-gray-200 space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">
            Transaction Report
          </h1>
          <p className="text-muted-foreground">
            Generated from your recent chat request
          </p>
        </div>
      </div>

      {transactions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="border-border">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Total Amount</p>
              <p className="text-lg font-semibold text-white mt-1">
                {numberToINR(totalAmount)}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">
                Average Transaction
              </p>
              <p className="text-lg font-semibold text-white mt-1">
                {numberToINR(Number(averageAmount.toFixed(2)))}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Top Category</p>
              <p className="text-lg font-semibold text-white mt-1">
                {topCategory}
              </p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="pt-4">
              <p className="text-sm text-muted-foreground">Last Transaction</p>
              <p className="text-lg font-semibold text-white mt-1">
                {latestDate || "-"}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card className="mt-4">
        <CardHeader className="px-2 pt-2 sm:px-4">
          <CardTitle className="text-base font-semibold">
            Transactions ({transactions.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="px-2 pb-4 sm:px-4">
          {transactions.length === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">
              No transactions found.
            </p>
          ) : (
            <DataTable
              columns={columns}
              data={transactions}
              sorting={sorting}
              onSortingChange={setSorting}
              headerClassName="font-semibold"
              rowHref={(row) => `/transactions/${(row as Transaction).id}`}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
