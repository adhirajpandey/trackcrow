"use client";
import { useEffect, useMemo, useState, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { Transaction } from "@/common/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, ArrowUpDown, MoreHorizontal, MapPin, Eye, Edit, Trash } from "lucide-react";
import {
  numberToINR,
  formatDateTime,
  toDate,
} from "@/common/utils";
import DataTable from "@/components/ui/data-table";
import { ColumnDef, SortingState } from "@tanstack/react-table";
import { Skeleton } from "@/components/ui/skeleton";
import { TimeframeSelector } from "@/app/transactions/components/timeframe-selector";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ErrorMessage } from "@/components/error-message";

type TransactionsResponse = {
  transactions: Transaction[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
  firstTxnDate: string | null;
  lastTxnDate: string | null;
};

type MonthKey = string; // e.g., "2025-09"

function toMonthKey(date: Date): MonthKey {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`;
}



export function TransactionsClient({
  userCategories,
}: {
  userCategories: { name: string; subcategories: string[] }[];
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isInitialRenderRef = useRef(true);

  

  const DEFAULT_PAGE_SIZE = 20;
  const pageParam = searchParams?.get("page");
  const initialPage = Number.isFinite(Number(pageParam)) ? Math.max(1, Math.floor(Number(pageParam))) : 1;
  const [page, setPage] = useState<number>(initialPage);
  const [pageSize] = useState<number>(DEFAULT_PAGE_SIZE);
  const initialQuery = searchParams?.get("q") || "";
  const [query, setQuery] = useState<string>(initialQuery);
  const initialCategories = Array.from(new Set([
    ...(searchParams?.getAll("category") ?? []),
    ...((searchParams?.get("categories") || "").split(",").map(s => s.trim()).filter(Boolean))
  ]));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialCategories);
  const initialSortBy = searchParams?.get("sortBy");
  const initialSortOrder = searchParams?.get("sortOrder");
  const initialSorting: SortingState = initialSortBy ? [{ id: initialSortBy, desc: initialSortOrder === "desc" }] : [{ id: "timestamp", desc: true }];
  const [sorting, setSorting] = useState<SortingState>(initialSorting);

  const [debouncedQuery, setDebouncedQuery] = useState<string>(initialQuery);

  // Debounce query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500); // 500ms debounce

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  

  const initialMonthParam = searchParams?.get("month") ?? "all";
  const initialTimeframe = (initialMonthParam === "all" || /^\d{4}-\d{2}$/.test(initialMonthParam)) ? (initialMonthParam as MonthKey | "all") : "all";
  const [selectedTimeframe, setSelectedTimeframe] = useState<MonthKey | "all">(initialTimeframe);

  

  const [data, setData] = useState<TransactionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Keep URL in sync with page and query
  useEffect(() => {
    if (isInitialRenderRef.current) {
      return;
    }
    const params = new URLSearchParams();
    params.set("page", String(page));
    if (query && query.length > 0) params.set("q", query);
    else params.delete("q");
    // replace category params with current selection
    params.delete("category");
    params.delete("categories");
    for (const c of selectedCategories) params.append("category", c);

    if (sorting.length > 0) {
      params.set("sortBy", sorting[0].id);
      params.set("sortOrder", sorting[0].desc ? "desc" : "asc");
    }

    params.set("month", selectedTimeframe === "all" ? "all" : selectedTimeframe);

    const newUrl = `?${params.toString()}`;
    const currentUrl = window.location.search;

    if (newUrl !== currentUrl) {
      router.replace(newUrl, { scroll: false });
    }
  }, [page, query, selectedCategories, sorting, selectedTimeframe, router]);

  // Fetch from API whenever page/size/query/categories/timeframe change
  useEffect(() => {
    let active = true;
    async function run() {
      setLoading(true);
      setError(null);
      try {
        const q = encodeURIComponent(debouncedQuery || "");
        const cats = selectedCategories
          .map((c) => `category=${encodeURIComponent(c)}`)
          .join("&");
        const sortParams =
          sorting.length > 0
            ? `&sortBy=${sorting[0].id}&sortOrder=${sorting[0].desc ? "desc" : "asc"}`
            : "";

        let dateParams = "";
        if (selectedTimeframe !== "all") {
          const [year, month] = selectedTimeframe.split("-").map(Number);
          const startDate = new Date(year, month - 1, 1);
          const endDate = new Date(year, month, 0, 23, 59, 59, 999);
          dateParams = `&startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}`;
        }

        const res = await fetch(
          `/api/transactions?page=${page}&size=${pageSize}${q ? `&q=${q}` : ""}${cats ? `&${cats}` : ""}${sortParams}${dateParams}`
        );
        if (!res.ok) {
          const text = await res.text();
          throw new Error(text || `Request failed with ${res.status}`);
        }
        const json = (await res.json()) as TransactionsResponse;
        if (active) {
          setData(json);
          // Populate monthKeysDescending based on firstTxnDate and lastTxnDate
          if (json.firstTxnDate && json.lastTxnDate) {
            const start = toDate(json.firstTxnDate);
            const end = toDate(json.lastTxnDate);
            const months: MonthKey[] = [];
            const current = new Date(start.getFullYear(), start.getMonth(), 1);
            while (current <= end) {
              months.unshift(toMonthKey(current)); // Add to the beginning to keep it descending
              current.setMonth(current.getMonth() + 1);
            }
            } else {
          }
        }
      } catch (e: any) {
        if (active) setError(e?.message || "Failed to load transactions");
      } finally {
        if (active) setLoading(false);
      }
    }
    run();
    return () => {
      active = false;
    };
  }, [page, pageSize, query, selectedCategories, sorting, selectedTimeframe, debouncedQuery]);

  const rows = useMemo(() => data?.transactions ?? [], [data]);
  const totalCount = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const startIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = totalCount === 0 ? 0 : (page - 1) * pageSize + rows.length;

  // Category dropdown options: union of user categories and categories present in current rows
  const availableCategories = useMemo(() => {
    const userCatNames = userCategories.map((c) => c.name);
    const fromRows = Array.from(
      new Set(
        (rows.map((r) => r.category).filter(Boolean) as string[]).concat([
          "Uncategorized",
        ])
      )
    );
    return Array.from(new Set([...userCatNames, ...fromRows]));
  }, [rows, userCategories]);

  const toggleCategory = (name: string) => {
    setPage(1);
    setSelectedCategories((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    );
  };

  const columns: ColumnDef<Transaction>[] = useMemo(
    () => [
      {
        accessorKey: "timestamp",
        header: ({ column }) => {
          const toggle = (e: React.SyntheticEvent) => {
            e.preventDefault();
            column.toggleSorting(column.getIsSorted() === "asc");
          };
          return (
            <div className="flex items-center">
              <span className="select-none cursor-default">Date</span>
              <button
                type="button"
                data-sort-toggle
                className="ml-2 p-1 rounded-md hover:bg-muted"
                onClick={toggle}
                aria-label="Toggle date sorting"
                aria-pressed={!!column.getIsSorted()}
              >
                <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        },
        cell: ({ row }) => {
          const t = row.original as Transaction;
          const ts = t.timestamp as string | Date;
          return <div>{formatDateTime(ts)}</div>;
        },
      },
      {
        accessorKey: "amount",
        header: ({ column }) => {
          const toggle = (e: React.SyntheticEvent) => {
            e.preventDefault();
            column.toggleSorting(column.getIsSorted() === "asc");
          };
          return (
            <div className="flex items-center">
              <span className="select-none cursor-default">Amount</span>
              <button
                type="button"
                data-sort-toggle
                className="ml-2 p-1 rounded-md hover:bg-muted"
                onClick={toggle}
                aria-label="Toggle amount sorting"
                aria-pressed={!!column.getIsSorted()}
              >
                <ArrowUpDown className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          );
        },
        cell: ({ row }) => (
          <div>
            {numberToINR(Math.abs((row.original as Transaction).amount))}
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
        header: "Recipient",
        accessorFn: (row) => row.recipient_name || row.recipient,
        cell: ({ row }) => {
          const t = row.original as Transaction;
          const primary = t.recipient_name || t.recipient;
          return (
            <div className="min-w-0">
              <div className="font-medium text-sm truncate">{primary}</div>
            </div>
          );
        },
      },
      {
        header: "Remarks",
        accessorKey: "remarks",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground truncate">
            {(row.original as Transaction).remarks ?? "-"}
          </div>
        ),
      },
      {
        header: "Type",
        accessorFn: (row) => (row as any).type ?? "",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {(row.original as any).type ?? ""}
          </div>
        ),
      },
      {
        id: "actions",
        cell: ({ row }) => {
          const transaction = row.original;

          return (
            // Block all events in this cell from bubbling to the row
            <div
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => e.stopPropagation()}
            >
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="h-8 w-8 p-0 cursor-pointer"
                    // keeping this is fine, but the wrapper above already handles it
                    onClick={(e) => e.stopPropagation()}
                  >
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>

                <DropdownMenuContent
                  align="end"
                  // extra safety: block inside the portal too
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={(e) => e.stopPropagation()}
                >

                  {transaction.location && (
                    <DropdownMenuItem
                      className="cursor-pointer"
                      // Radix fires onSelect for menu items; prevent + stop here as well
                      onSelect={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        window.open(
                          `https://www.google.com/maps/search/${encodeURIComponent(
                            transaction.location || ''
                          )}`,
                          "_blank"
                        );
                      }}
                    >
                      <MapPin className="h-4 w-4 mr-2" /> View Location
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuItem
                    className="cursor-pointer"
                    asChild
                    onSelect={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Link
                      href={`/transactions/${transaction.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Eye className="h-4 w-4 mr-2" /> View Transaction
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer"
                    asChild
                    onSelect={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
                    <Link
                      href={`/transactions/${transaction.id}?edit=true`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className="h-4 w-4 mr-2" /> Edit Transaction
                    </Link>
                  </DropdownMenuItem>

                  <DropdownMenuItem
                    className="cursor-pointer text-red-500"
                    onSelect={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log("Delete transaction", transaction.id);
                    }}
                  >
                    <Trash className="h-4 w-4 mr-2" /> Delete Transaction
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div className="space-y-2 flex-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground leading-snug">
            Filter, Sort and play around your all transactions at one place
          </p>
        </div>

        <div className="flex gap-2 self-start md:self-auto">
          <Link href="/transactions/add" className="shrink-0">
            <Button size="sm" className="font-bold whitespace-nowrap">
              <Plus className="h-4 w-4 mr-2" /> Add Transaction
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-1">
        <Card className="mt-8">
          <CardHeader className="px-2 pt-2 sm:px-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle className="text-base font-semibold">
                Transactions
              </CardTitle>
              <div className="flex w-full flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 sm:justify-end">
                <input
                  value={query}
                  onChange={(e) => {
                    setPage(1);
                    setQuery(e.target.value);
                  }}
                  placeholder="Search recipient, remarks, amount"
                  className="w-full rounded-md border px-3 py-2 text-sm bg-background text-foreground mb-2 sm:mb-0 sm:w-60 min-w-0"
                />
                <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                  <TimeframeSelector
                    initialMonthParam={selectedTimeframe}
                    onSelectTimeframe={(month) => {
                      setSelectedTimeframe(month);
                    }}
                  />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="shrink-0 font-bold justify-center whitespace-nowrap"
                      >
                        {selectedCategories.length > 0
                          ? `${selectedCategories.length} selected`
                          : "All categories"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="mx-2 max-w-xs">
                      <DropdownMenuLabel>Filter by category</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {availableCategories.map((name) => (
                          <DropdownMenuCheckboxItem
                            className="cursor-pointer"
                            key={name}
                            checked={selectedCategories.includes(name)}
                            onCheckedChange={() => toggleCategory(name)}
                          >
                            {name}
                          </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="divide-y divide-border px-2 pb-2 sm:px-4">
            {loading ? (
              <div className="space-y-2 py-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : error ? (
              <ErrorMessage message={error} />
            ) : (
              <div className="py-2">
                <DataTable
                  columns={columns}
                  data={rows}
                  sorting={sorting}
                  onSortingChange={setSorting}
                  manualSorting
                  headerClassName="font-semibold"
                  onRowClick={(row) => {
                    const t = row as Transaction;
                    if (t && typeof t.id === "number") {
                      router.push(`/transactions/${t.id}`);
                    }
                  }}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground px-2 sm:px-4">
          <div>
            Showing{" "}
            <span className="font-medium text-foreground">{startIndex}</span> -{" "}
            <span className="font-medium text-foreground">{endIndex}</span> of{" "}
            <span className="font-medium text-foreground">{totalCount}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1 || loading}
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
              disabled={page >= totalPages || loading}
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

export default TransactionsClient;