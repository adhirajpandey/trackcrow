"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { CalendarDays, ReceiptText, Tag } from "lucide-react";

import { AppPageHeader } from "@/components/product/app-page-header";
import { DataTableEmpty } from "@/components/product/data-table-empty";
import { DataTablePagination } from "@/components/product/data-table-pagination";
import { DataTableShell } from "@/components/product/data-table-shell";
import { MobileRowDetailDrawer } from "@/components/product/mobile-row-detail-drawer";
import { SortableTableHead } from "@/components/product/sortable-table-head";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { useCategoriesQuery } from "@/features/categories/queries";
import {
  buildTransactionsPageData,
  getTransactionsPageState,
  isSameTransactionsQuery,
  type TransactionsSearchParams,
} from "@/features/transactions/query-state";
import { useTransactionsQuery } from "@/features/transactions/queries";
import type {
  TransactionsPageInitialData,
  TransactionsPageRow,
} from "@/features/transactions/types";
import { updateTransactionsUrl } from "@/features/transactions/url-state";
import { getApiClientErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";

import {
  buildCategoryOptions,
  buildFooterSummary,
  buildPageHref,
  buildPaginationItems,
  buildSortHref,
  formatTransactionAmount,
  formatTransactionDateLabel,
  formatTransactionTimeLabel,
  getSortDirection,
} from "./transactions-view-model";
import { TransactionsFilterControls } from "./transactions-filter-controls";

type ColumnMeta = {
  align?: "left" | "right";
  sortable?: "timestamp" | "amount";
  widthClassName?: string;
};

const columns: ColumnDef<TransactionsPageRow>[] = [
  {
    accessorKey: "timestamp",
    meta: {
      sortable: "timestamp",
      widthClassName: "w-[20%]",
    } satisfies ColumnMeta,
    header: "Date & time",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="font-medium text-foreground">
          {formatTransactionDateLabel(row.original.timestamp)}
        </p>
        <p className="mt-1 text-xs text-secondary-foreground/85">
          {formatTransactionTimeLabel(row.original.timestamp)}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "recipient",
    meta: { widthClassName: "w-[30%]" } satisfies ColumnMeta,
    header: "Recipient",
    cell: ({ row }) => (
      <div className="truncate font-medium text-foreground">{row.original.recipient}</div>
    ),
  },
  {
    accessorKey: "amount",
    meta: {
      sortable: "amount",
      align: "right",
      widthClassName: "w-[16%]",
    } satisfies ColumnMeta,
    header: "Amount",
    cell: ({ row }) => (
      <div className="text-right font-semibold tabular-nums text-foreground">
        {formatTransactionAmount(row.original.amount)}
      </div>
    ),
  },
  {
    accessorKey: "category",
    meta: { widthClassName: "w-[22%]" } satisfies ColumnMeta,
    header: "Category",
    cell: ({ row }) => (
      <div className="min-w-0">
        <span
          className={cn(
            "inline-flex min-h-8 max-w-full items-center rounded-[999px] border px-3 text-sm font-medium",
            row.original.category
              ? "border-primary/20 bg-primary/10 text-primary"
              : "border-accent/30 bg-[rgba(41,36,18,0.78)] text-accent"
          )}
        >
          <span className="truncate">{row.original.category ?? "Uncategorized"}</span>
        </span>
      </div>
    ),
  },
  {
    accessorKey: "source",
    meta: { widthClassName: "w-[12%]" } satisfies ColumnMeta,
    header: "Source",
    cell: ({ row }) => (
      <div className="font-medium uppercase tracking-[0.08em] text-secondary-foreground">
        {row.original.source}
      </div>
    ),
  },
];

function toSearchParamsObject(searchParams: Pick<URLSearchParams, "keys" | "getAll">) {
  const result: TransactionsSearchParams = {};

  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    result[key] = values.length > 1 ? values : (values[0] ?? undefined);
  }

  return result;
}

export function TransactionsPageView({
  initialTransactionsQuery,
  initialTransactionsData,
  initialCategoriesData,
}: TransactionsPageInitialData) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerRow, setDrawerRow] = useState<TransactionsPageRow | null>(null);
  const state = getTransactionsPageState(toSearchParamsObject(searchParams));
  const transactionsQuery = useTransactionsQuery({
    query: state.query,
    initialQuery: initialTransactionsQuery,
    initialData: initialTransactionsData,
  });
  const categoriesQuery = useCategoriesQuery({
    initialData: initialCategoriesData,
  });
  const isInitialQuery = isSameTransactionsQuery(
    state.query,
    initialTransactionsQuery
  );
  const transactionsData =
    transactionsQuery.data ?? (isInitialQuery ? initialTransactionsData : undefined);
  const data = buildTransactionsPageData({
    query: state.query,
    view: state.view,
    result: transactionsData ?? initialTransactionsData,
    categories: categoriesQuery.data ?? initialCategoriesData,
  });
  const message = transactionsQuery.error
    ? getApiClientErrorMessage(
        transactionsQuery.error,
        "Transactions are temporarily unavailable. Try again in a moment."
      )
    : data.message;
  const status = transactionsQuery.error ? "error" : data.status;
  const isRefreshing = transactionsQuery.isFetching && !transactionsQuery.isPending;
  const categoryOptions = buildCategoryOptions(data.categories);
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: data.rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    pageCount: data.pagination.totalPages,
    state: {
      pagination: {
        pageIndex: Math.max(0, data.pagination.page - 1),
        pageSize: data.pagination.pageSize,
      },
      sorting: [
        {
          id: data.filters.sortBy,
          desc: data.filters.sortOrder === "desc",
        },
      ],
    },
  });
  const paginationItems = buildPaginationItems(data.pagination.page, data.pagination.totalPages);

  return (
    <div className="space-y-3.5">
      <AppPageHeader
        eyebrow="Transaction workspace"
        title="Transactions"
        description="Search, filter, and review all your transactions in one place."
      />

      {message ? (
        <section
          className={cn(
            "rounded-[8px] border px-4 py-3 text-sm",
            status === "error"
              ? "border-destructive/45 bg-destructive/10 text-foreground"
              : "border-border/50 bg-background/16 text-secondary-foreground"
          )}
        >
          {message}
        </section>
      ) : null}

      <section className="rounded-[8px] border border-border/55 bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))] px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)] sm:px-5">
        <TransactionsFilterControls
          filters={data.filters}
          categoryOptions={categoryOptions}
        />
      </section>

      <DataTableShell
        aria-busy={isRefreshing}
        aria-live="polite"
        className={cn("relative transition-opacity", isRefreshing && "opacity-95")}
      >
        {isRefreshing ? (
          <>
            <span className="sr-only">Refreshing transactions</span>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-primary/10">
              <Skeleton className="h-full w-1/3 rounded-none bg-primary/45" />
            </div>
          </>
        ) : null}
        {data.rows.length > 0 ? (
          <>
            <div className="grid gap-3 p-4 md:hidden">
              {data.rows.map((row) => (
                <button
                  key={row.uuid}
                  type="button"
                  onClick={() => setDrawerRow(row)}
                  className={cn(
                    "rounded-[8px] border border-border/45 bg-background/12 p-4 text-left transition-colors hover:bg-background/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    row.isSelected && "ring-1 ring-inset ring-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold text-foreground">
                        {row.recipient}
                      </p>
                      <p className="mt-1 text-sm text-secondary-foreground">
                        {formatTransactionDateLabel(row.timestamp)} at{" "}
                        {formatTransactionTimeLabel(row.timestamp)}
                      </p>
                    </div>
                    <span className="text-base font-semibold tabular-nums text-foreground">
                      {formatTransactionAmount(row.amount)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span
                      className={cn(
                        "inline-flex min-h-8 max-w-[68%] items-center rounded-[999px] border px-3 text-sm font-medium",
                        row.category
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-accent/30 bg-[rgba(41,36,18,0.78)] text-accent"
                      )}
                    >
                      <span className="truncate">{row.category ?? "Uncategorized"}</span>
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground/75">
                      {row.source}
                    </span>
                  </div>
                </button>
              ))}
            </div>

            <div className="hidden md:block">
              <Table className="min-w-[860px] table-fixed">
                <TableHeader className="border-b border-border/40 bg-background/16">
                  {table.getHeaderGroups().map((headerGroup) => (
                    <TableRow key={headerGroup.id} className="hover:bg-transparent">
                      {headerGroup.headers.map((header) => {
                        const meta = header.column.columnDef.meta as ColumnMeta | undefined;
                        const sortable = meta?.sortable;

                        if (!sortable) {
                          return (
                            <TableHead
                              key={header.id}
                              className={cn(
                                meta?.align === "right" && "text-right",
                                meta?.widthClassName
                              )}
                            >
                              {header.isPlaceholder
                                ? null
                                : flexRender(header.column.columnDef.header, header.getContext())}
                            </TableHead>
                          );
                        }

                        return (
                          <SortableTableHead
                            key={header.id}
                            label={String(header.column.columnDef.header)}
                            direction={getSortDirection(data.filters, sortable)}
                            align={meta?.align ?? "left"}
                            className={meta?.widthClassName}
                            onClick={() =>
                              updateTransactionsUrl(buildSortHref(data.filters, sortable), "push")
                            }
                          />
                        );
                      })}
                    </TableRow>
                  ))}
                </TableHeader>
                <TableBody>
                  {table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      tabIndex={0}
                      role="link"
                      className={cn(
                        "group cursor-pointer",
                        row.original.isSelected && "bg-primary/10"
                      )}
                      onClick={(event) => {
                        if (isInteractiveTarget(event.target as HTMLElement)) {
                          return;
                        }
                        router.push(`/transactions/${row.original.id}`);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          router.push(`/transactions/${row.original.id}`);
                        }
                      }}
                    >
                      {row.getVisibleCells().map((cell) => {
                        const meta = cell.column.columnDef.meta as ColumnMeta | undefined;
                        return (
                          <TableCell
                            key={cell.id}
                            className={cn(
                              "py-4",
                              meta?.align === "right" && "text-right",
                              meta?.widthClassName
                            )}
                          >
                            {cell.column.id === "recipient" ? (
                              <Link
                                href={`/transactions/${row.original.id}`}
                                className="block rounded-[6px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={(event) => event.stopPropagation()}
                              >
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </Link>
                            ) : (
                              flexRender(cell.column.columnDef.cell, cell.getContext())
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        ) : (
          <DataTableEmpty title="No transactions matched the current filters." />
        )}

        <div className="flex flex-col gap-4 border-t border-border/45 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-secondary-foreground">{buildFooterSummary(data.pagination)}</p>
          {data.pagination.totalPages > 1 ? (
            <DataTablePagination
              page={data.pagination.page}
              totalPages={data.pagination.totalPages}
              hasPrev={data.pagination.hasPrev}
              hasNext={data.pagination.hasNext}
              items={paginationItems}
              buildPageHref={(page) => buildPageHref(data.filters, page)}
              onNavigate={(href) => updateTransactionsUrl(href, "push")}
            />
          ) : null}
        </div>
      </DataTableShell>

      <MobileRowDetailDrawer
        open={drawerRow !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDrawerRow(null);
          }
        }}
        title={drawerRow?.recipient ?? ""}
        description={
          drawerRow
            ? `${formatTransactionDateLabel(drawerRow.timestamp)} at ${formatTransactionTimeLabel(
                drawerRow.timestamp
              )}`
            : undefined
        }
        href={drawerRow ? `/transactions/${drawerRow.id}` : "/transactions"}
        hrefLabel="Open transaction detail"
      >
        {drawerRow ? (
          <div className="space-y-4 pb-3">
            <div className="rounded-[8px] border border-border/45 bg-background/12 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground/75">
                Amount
              </p>
              <p className="mt-2 text-[1.65rem] font-semibold leading-none tabular-nums text-foreground">
                {formatTransactionAmount(drawerRow.amount)}
              </p>
            </div>
            <div className="grid gap-3 rounded-[8px] border border-border/45 bg-background/8 p-4">
              <DetailMetric
                icon={<CalendarDays className="h-4 w-4" />}
                label="When"
                value={`${formatTransactionDateLabel(drawerRow.timestamp)} ${formatTransactionTimeLabel(
                  drawerRow.timestamp
                )}`}
              />
              <DetailMetric
                icon={<Tag className="h-4 w-4" />}
                label="Category"
                value={drawerRow.category ?? "Uncategorized"}
              />
              <DetailMetric
                icon={<ReceiptText className="h-4 w-4" />}
                label="Source"
                value={drawerRow.source}
              />
            </div>
          </div>
        ) : null}
      </MobileRowDetailDrawer>
    </div>
  );
}

function DetailMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-secondary-foreground">
        <span className="text-primary">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

function isInteractiveTarget(target: HTMLElement) {
  return Boolean(target.closest("a, button, input, select, textarea"));
}
