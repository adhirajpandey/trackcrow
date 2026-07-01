"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { BadgeCheck, Hash, Users } from "lucide-react";

import { AppPageHeader } from "@/components/product/app-page-header";
import { DataTableEmpty } from "@/components/product/data-table-empty";
import { DataTablePagination } from "@/components/product/data-table-pagination";
import { DataTableShell } from "@/components/product/data-table-shell";
import {
  MobileCardList,
  MobileFilterChips,
  MobileLongValue,
  MobilePageHeader,
  MobilePagination,
  MobileSearchBar,
  mobileCardClassName,
  mobileSurfaceClassName,
} from "@/components/product/mobile/mobile-primitives";
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
import {
  getRecipientsPageState,
  isSameRecipientsQuery,
  type RecipientsSearchParams,
} from "@/features/recipients/query-state";
import { useRecipientsQuery } from "@/features/recipients/queries";
import type {
  RecipientIdentifierChip,
  RecipientsPageInitialData,
  RecipientsPageRow,
} from "@/features/recipients/types";
import { getApiClientErrorMessage } from "@/lib/api/client";
import {
  handleLinkRowClick,
  handleLinkRowKeyDown,
} from "@/lib/row-link-navigation";
import { numberToINR } from "@/common/utils";
import { cn } from "@/lib/utils";
import { updateTransactionsUrl } from "@/features/transactions/url-state";

import {
  buildFooterSummary,
  buildPageHref,
  buildPaginationItems,
  buildRecipientsPageData,
  buildSearchHref,
  buildSortHref,
  getSortDirection,
} from "./recipients-view-model";
import { RecipientsFilterControls } from "./recipients-filter-controls";

type ColumnMeta = {
  align?: "left" | "right";
  sortable?: "displayName" | "transactionCount" | "totalAmount";
  widthClassName?: string;
};

function getIdentifierChipClassName(tone: RecipientIdentifierChip["tone"]) {
  switch (tone) {
    case "upi":
      return "border-emerald-500/25 bg-emerald-500/12 text-emerald-300";
    case "card":
      return "border-sky-500/25 bg-sky-500/12 text-sky-300";
    case "text":
      return "border-slate-400/20 bg-slate-400/10 text-slate-300";
    default:
      return "border-border/45 bg-background/12 text-secondary-foreground";
  }
}

const columns: ColumnDef<RecipientsPageRow>[] = [
  {
    accessorKey: "displayName",
    meta: {
      sortable: "displayName",
      widthClassName: "w-[28%]",
    } satisfies ColumnMeta,
    header: "Recipient",
    cell: ({ row }) => (
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground transition-colors group-hover:text-primary">
          {row.original.displayName}
        </p>
        <p className="mt-1 text-xs text-secondary-foreground/85">
          {row.original.secondaryLabel}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "identifierChips",
    meta: { widthClassName: "w-[40%]" } satisfies ColumnMeta,
    header: "Identifiers",
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {row.original.identifierChips.map((identifier) => (
          <span
            key={identifier.id}
            className={cn(
              "inline-flex min-h-11 max-w-full items-center rounded-[999px] border px-3 text-xs font-medium",
              getIdentifierChipClassName(identifier.tone)
            )}
            title={identifier.value}
          >
            <span className="truncate">{identifier.value}</span>
          </span>
        ))}
        {row.original.overflowIdentifierCount > 0 ? (
          <span className="inline-flex min-h-11 items-center rounded-[999px] border border-border/45 bg-background/12 px-3 text-xs font-medium text-secondary-foreground">
            +{row.original.overflowIdentifierCount} more
          </span>
        ) : null}
      </div>
    ),
  },
  {
    accessorKey: "transactionCount",
    meta: {
      sortable: "transactionCount",
      align: "right",
      widthClassName: "w-[14%]",
    } satisfies ColumnMeta,
    header: "Transactions",
    cell: ({ row }) => (
      <div className="text-right font-semibold tabular-nums text-foreground">
        {row.original.transactionCount}
      </div>
    ),
  },
  {
    accessorKey: "totalAmount",
    meta: {
      sortable: "totalAmount",
      align: "right",
      widthClassName: "w-[18%]",
    } satisfies ColumnMeta,
    header: "Total sent",
    cell: ({ row }) => (
      <div className="text-right font-semibold tabular-nums text-foreground">
        {numberToINR(row.original.totalAmount)}
      </div>
    ),
  },
];

function toSearchParamsObject(searchParams: Pick<URLSearchParams, "keys" | "getAll">) {
  const result: RecipientsSearchParams = {};

  for (const key of searchParams.keys()) {
    const values = searchParams.getAll(key);
    result[key] = values.length > 1 ? values : (values[0] ?? undefined);
  }

  return result;
}

export function RecipientsPageView({
  initialRecipientsQuery,
  initialRecipientsData,
}: RecipientsPageInitialData) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [drawerRow, setDrawerRow] = useState<RecipientsPageRow | null>(null);
  const state = getRecipientsPageState(toSearchParamsObject(searchParams));
  const initialData = isSameRecipientsQuery(state.query, initialRecipientsQuery)
    ? initialRecipientsData
    : undefined;
  const recipientsQuery = useRecipientsQuery({
    query: state.query,
    initialQuery: initialRecipientsQuery,
    initialData: initialData ?? initialRecipientsData,
  });
  const result = recipientsQuery.data ?? initialData ?? initialRecipientsData;
  const data = buildRecipientsPageData({
    filters: state.query,
    result,
  });
  const message = recipientsQuery.error
    ? getApiClientErrorMessage(
        recipientsQuery.error,
        "Recipients are temporarily unavailable. Try again in a moment."
      )
    : data.message;
  const status = recipientsQuery.error ? "error" : data.status;
  const isRefreshing = recipientsQuery.isFetching && !recipientsQuery.isPending;
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
      sorting: data.filters.sortBy
        ? [
            {
              id: data.filters.sortBy,
              desc: data.filters.sortOrder === "desc",
            },
          ]
        : [],
    },
  });
  const paginationItems = buildPaginationItems(data.pagination.page, data.pagination.totalPages);
  const mobileFilterItems = data.filters.q
    ? [{ label: `Search: ${data.filters.q}` }]
    : [];
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-3.5">
      <MobilePageHeader
        eyebrow="Recipient workspace"
        title="Recipients"
        description="Review resolved payees, identifiers, linked counts, and spend concentration."
      />
      <div className="hidden lg:block">
        <AppPageHeader
          eyebrow="Recipient workspace"
          title="Recipients"
          description="Review resolved payees, identifiers, linked counts, and spend concentration."
        />
      </div>

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

      <section className={cn(mobileSurfaceClassName, "p-4 lg:hidden")}>
        <MobileSearchBar
          defaultValue={data.filters.q}
          placeholder="Search recipient, normalized name, identifier..."
          onChange={(nextValue) => {
            if (searchTimeoutRef.current !== null) {
              window.clearTimeout(searchTimeoutRef.current);
            }

            searchTimeoutRef.current = window.setTimeout(() => {
              updateTransactionsUrl(buildSearchHref(data.filters, nextValue), "replace");
            }, 300);
          }}
        />
        <MobileFilterChips items={mobileFilterItems} className="mt-3" />
      </section>

      <section className="hidden rounded-[8px] border border-border/55 bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))] px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)] sm:px-5 lg:block">
        <RecipientsFilterControls filters={data.filters} />
      </section>

      <DataTableShell
        aria-busy={isRefreshing}
        aria-live="polite"
        className={cn("relative transition-opacity", isRefreshing && "opacity-95")}
      >
        {isRefreshing ? (
          <>
            <span className="sr-only">Refreshing recipients</span>
            <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-1 overflow-hidden bg-primary/10">
              <Skeleton className="h-full w-1/3 rounded-none bg-primary/45" />
            </div>
          </>
        ) : null}
        {data.rows.length > 0 ? (
          <>
            <MobileCardList className="p-4">
              {data.rows.map((row) => (
                <button
                  key={row.uuid}
                  type="button"
                  onClick={() => setDrawerRow(row)}
                  className={cn(
                    mobileCardClassName,
                    "p-4 text-left transition-colors hover:bg-background/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    drawerRow?.uuid === row.uuid &&
                      "border-primary/55 bg-primary/[0.07] ring-1 ring-inset ring-primary/35"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="overflow-wrap-anywhere break-words text-base font-semibold text-foreground">
                        {row.displayName}
                      </p>
                      <p className="mt-1 text-sm text-secondary-foreground">
                        {row.secondaryLabel}
                      </p>
                    </div>
                    <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[999px] border border-primary/20 bg-primary/10 px-3 text-sm font-medium text-primary">
                      <BadgeCheck className="h-3.5 w-3.5" />
                      <span>{row.transactionCount}</span>
                    </span>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-start justify-between gap-3 min-w-0">
                      <span className="text-sm font-medium text-secondary-foreground">
                        Total sent
                      </span>
                      <span className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                        {numberToINR(row.totalAmount)}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {row.identifierChips.slice(0, 2).map((identifier) => (
                        <span
                          key={identifier.id}
                          className={cn(
                            "inline-flex min-h-11 max-w-full items-center rounded-[999px] border px-3 text-xs font-medium",
                            getIdentifierChipClassName(identifier.tone)
                          )}
                          title={identifier.value}
                        >
                          <span className="overflow-wrap-anywhere break-words">
                            {identifier.value}
                          </span>
                        </span>
                      ))}
                      {row.overflowIdentifierCount > 0 ? (
                        <span className="inline-flex min-h-11 items-center rounded-[999px] border border-border/45 bg-background/12 px-3 text-xs font-medium text-secondary-foreground">
                          +{row.overflowIdentifierCount} more
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              ))}
            </MobileCardList>

            <div className="hidden lg:block">
              <Table className="min-w-[920px] table-fixed">
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
                      className="group cursor-pointer"
                      onClick={(event) => {
                        handleLinkRowClick(
                          event,
                          `/recipients/${row.original.id}`,
                          router.push
                        );
                      }}
                      onKeyDown={(event) => {
                        handleLinkRowKeyDown(
                          event,
                          `/recipients/${row.original.id}`,
                          router.push
                        );
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
                            {cell.column.id === "displayName" ? (
                              <Link
                                href={`/recipients/${row.original.id}`}
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
        ) : data.emptyState === "none" ? (
          <div className="px-5 py-8 text-sm text-secondary-foreground">
            Recipient data is unavailable right now.
          </div>
        ) : (
          <DataTableEmpty
            icon={<Users className="h-5 w-5" />}
            title={
              data.emptyState === "empty"
                ? "No recipients found yet."
                : "No recipients matched the current filters."
            }
            helper={
              data.emptyState === "empty"
                ? "Recipients are created when transactions are added or imported."
                : undefined
            }
          />
        )}

        <div className="flex flex-col gap-4 border-t border-border/45 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-secondary-foreground">{buildFooterSummary(data.pagination)}</p>
          <MobilePagination
            page={data.pagination.page}
            totalPages={data.pagination.totalPages}
            hasPrev={data.pagination.hasPrev}
            hasNext={data.pagination.hasNext}
            onPrev={() => updateTransactionsUrl(buildPageHref(data.filters, data.pagination.page - 1), "push")}
            onNext={() => updateTransactionsUrl(buildPageHref(data.filters, data.pagination.page + 1), "push")}
          />
          {data.pagination.totalPages > 1 ? (
            <div className="hidden lg:block">
              <DataTablePagination
                page={data.pagination.page}
                totalPages={data.pagination.totalPages}
                hasPrev={data.pagination.hasPrev}
                hasNext={data.pagination.hasNext}
                items={paginationItems}
                buildPageHref={(page) => buildPageHref(data.filters, page)}
                onNavigate={(href) => updateTransactionsUrl(href, "push")}
              />
            </div>
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
        title={drawerRow?.displayName ?? ""}
        description={
          drawerRow
            ? `${drawerRow.transactionCount} transactions linked`
            : undefined
        }
        href={drawerRow ? `/recipients/${drawerRow.id}` : "/recipients"}
        hrefLabel="Open recipient detail"
      >
        {drawerRow ? (
          <div className="space-y-4 pb-3">
            <div className="rounded-[8px] border border-border/45 bg-background/12 p-4">
              <p className="text-xs font-semibold text-secondary-foreground">
                Total sent
              </p>
              <p className="mt-2 text-[1.65rem] font-semibold leading-none tabular-nums text-foreground">
                {numberToINR(drawerRow.totalAmount)}
              </p>
            </div>
            <div className="grid gap-3 rounded-[8px] border border-border/45 bg-background/8 p-4">
              <DetailMetric
                icon={<Hash className="h-4 w-4" />}
                label="Identifiers"
                value={drawerRow.secondaryLabel}
              />
              <DetailMetric
                icon={<BadgeCheck className="h-4 w-4" />}
                label="Linked transactions"
                value={String(drawerRow.transactionCount)}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {drawerRow.identifierChips.map((identifier) => (
                <span
                  key={identifier.id}
                  className={cn(
                    "inline-flex min-h-11 max-w-full items-center rounded-[999px] border px-3 text-xs font-medium",
                    getIdentifierChipClassName(identifier.tone)
                  )}
                  title={identifier.value}
                >
                  <MobileLongValue value={identifier.value} />
                </span>
              ))}
              {drawerRow.overflowIdentifierCount > 0 ? (
                <span className="inline-flex min-h-11 items-center rounded-[999px] border border-border/45 bg-background/12 px-3 text-xs font-medium text-secondary-foreground">
                  +{drawerRow.overflowIdentifierCount} more
                </span>
              ) : null}
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
