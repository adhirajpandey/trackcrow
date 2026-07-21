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
  MobileBottomSheet,
  MobileCardList,
  MobileLongValue,
  MobilePageHeader,
  MobilePagination,
  MobileSearchBar,
  mobileCardClassName,
} from "@/components/product/mobile/mobile-primitives";
import {
  FilterSection,
  FilterSheetFooter,
  NumericRangeFields,
} from "@/components/product/list-filter-controls";
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
import { Select } from "@/components/ui/select";
import {
  getRecipientsPageState,
  isSameRecipientsQuery,
  type RecipientsSearchParams,
} from "@/features/recipients/query-state";
import { useRecipientsQuery } from "@/features/recipients/queries";
import type {
  RecipientAliasChip,
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
  buildApplyFiltersHref,
  buildPageHref,
  buildPaginationItems,
  buildRecipientsPageData,
  buildSearchHref,
  buildResetFiltersState,
  buildSortHref,
  getRecipientRangeError,
  getSortDirection,
} from "./recipients-view-model";
import { RecipientsFilterControls } from "./recipients-filter-controls";

type ColumnMeta = {
  align?: "left" | "right";
  sortable?: "displayName" | "transactionCount" | "totalAmount";
  widthClassName?: string;
};

const recipientSortOptions = [
  { value: "transactionCount:desc", label: "Most transactions" },
  { value: "transactionCount:asc", label: "Fewest transactions" },
  { value: "totalAmount:desc", label: "Highest total sent" },
  { value: "totalAmount:asc", label: "Lowest total sent" },
  { value: "displayName:asc", label: "Name A–Z" },
  { value: "displayName:desc", label: "Name Z–A" },
];

function parseOptionalRangeValue(value: string, integer: boolean) {
  if (value.trim() === "") return { value: null, error: null };
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || (integer && !Number.isInteger(parsed))) {
    return {
      value: null,
      error: integer ? "Enter a non-negative whole number." : "Enter a non-negative amount.",
    };
  }
  return { value: parsed, error: null };
}

function getAliasChipClassName(tone: RecipientAliasChip["tone"]) {
  switch (tone) {
    case "upi":
      return "border-border bg-[var(--paper-mint)] text-foreground";
    case "card":
      return "border-border bg-[var(--paper-lilac)] text-foreground";
    case "text":
      return "border-border bg-[var(--paper-blush)] text-foreground";
    default:
      return "border-border bg-card text-secondary-foreground";
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
        <p className="truncate font-semibold text-foreground transition-colors group-hover:text-foreground">
          {row.original.displayName}
        </p>
        <p className="mt-1 text-xs text-secondary-foreground/85">
          {row.original.secondaryLabel}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "aliasChips",
    meta: { widthClassName: "w-[40%]" } satisfies ColumnMeta,
    header: "Aliases",
    cell: ({ row }) => (
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        {row.original.aliasChips.map((alias) => (
          <span
            key={alias.id}
            className={cn(
              "inline-flex min-h-11 max-w-full items-center rounded-[999px] border-2 px-3 text-xs font-semibold",
              getAliasChipClassName(alias.tone)
            )}
            title={alias.value}
          >
            <span className="truncate">{alias.value}</span>
          </span>
        ))}
        {row.original.overflowAliasCount > 0 ? (
          <span className="inline-flex min-h-11 items-center rounded-[999px] border-2 border-border bg-card px-3 text-xs font-semibold text-secondary-foreground">
            +{row.original.overflowAliasCount} more
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
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDraftFilters, setMobileDraftFilters] = useState(data.filters);
  const [mobileRangeDrafts, setMobileRangeDrafts] = useState({
    minTransactionCount: data.filters.minTransactionCount?.toString() ?? "",
    maxTransactionCount: data.filters.maxTransactionCount?.toString() ?? "",
    minTotalAmount: data.filters.minTotalAmount?.toString() ?? "",
    maxTotalAmount: data.filters.maxTotalAmount?.toString() ?? "",
  });
  const searchTimeoutRef = useRef<number | null>(null);
  const parsedMinimumCount = parseOptionalRangeValue(mobileRangeDrafts.minTransactionCount, true);
  const parsedMaximumCount = parseOptionalRangeValue(mobileRangeDrafts.maxTransactionCount, true);
  const parsedMinimumAmount = parseOptionalRangeValue(mobileRangeDrafts.minTotalAmount, false);
  const parsedMaximumAmount = parseOptionalRangeValue(mobileRangeDrafts.maxTotalAmount, false);
  const countRangeError =
    parsedMinimumCount.error ??
    parsedMaximumCount.error ??
    getRecipientRangeError(parsedMinimumCount.value, parsedMaximumCount.value, "Transaction count");
  const amountRangeError =
    parsedMinimumAmount.error ??
    parsedMaximumAmount.error ??
    getRecipientRangeError(parsedMinimumAmount.value, parsedMaximumAmount.value, "Total sent");
  const mobileApplyDisabled = Boolean(countRangeError || amountRangeError);
  const mobileActiveFilterCount =
    (data.filters.minTransactionCount !== null || data.filters.maxTransactionCount !== null ? 1 : 0) +
    (data.filters.minTotalAmount !== null || data.filters.maxTotalAmount !== null ? 1 : 0) +
    (data.filters.sortBy !== "transactionCount" || data.filters.sortOrder !== "desc" ? 1 : 0);
  const mobileFilterLabel =
    mobileActiveFilterCount > 0
      ? `Filters · ${mobileActiveFilterCount} active`
      : "Filters · Most transactions";
  const mobileResultLabel = `${data.pagination.total.toLocaleString("en-IN")} recipient${
    data.pagination.total === 1 ? "" : "s"
  }`;

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
        description="Review resolved payees, aliases, linked counts, and spend concentration."
      />
      <div className="hidden lg:block">
        <AppPageHeader
          eyebrow="Recipient workspace"
          title="Recipients"
          description="Review resolved payees, aliases, linked counts, and spend concentration."
        />
      </div>

      {message ? (
        <section
          className={cn(
            "rounded-[8px] border-2 px-4 py-3 text-sm",
            status === "error"
              ? "border-destructive/45 bg-destructive/10 text-foreground"
              : "border-border bg-card text-secondary-foreground"
          )}
        >
          {message}
        </section>
      ) : null}

      <section className="space-y-3 lg:hidden">
        <MobileSearchBar
          value={data.filters.q}
          placeholder="Search recipient, normalized name, alias..."
          onChange={(nextValue) => {
            if (searchTimeoutRef.current !== null) {
              window.clearTimeout(searchTimeoutRef.current);
            }

            searchTimeoutRef.current = window.setTimeout(() => {
              updateTransactionsUrl(buildSearchHref(data.filters, nextValue), "replace");
            }, 300);
          }}
        />
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <MobileBottomSheet
              open={mobileFiltersOpen}
              onOpenChange={(open) => {
                setMobileFiltersOpen(open);
                if (open) {
                  setMobileDraftFilters(data.filters);
                  setMobileRangeDrafts({
                    minTransactionCount: data.filters.minTransactionCount?.toString() ?? "",
                    maxTransactionCount: data.filters.maxTransactionCount?.toString() ?? "",
                    minTotalAmount: data.filters.minTotalAmount?.toString() ?? "",
                    maxTotalAmount: data.filters.maxTotalAmount?.toString() ?? "",
                  });
                }
              }}
              triggerLabel={mobileFilterLabel}
              title="Recipient filters"
              description="Refine and order the recipient list."
              footer={
                <FilterSheetFooter
                  applyDisabled={mobileApplyDisabled}
                  onReset={() => {
                    setMobileDraftFilters(buildResetFiltersState(mobileDraftFilters));
                    setMobileRangeDrafts({
                      minTransactionCount: "",
                      maxTransactionCount: "",
                      minTotalAmount: "",
                      maxTotalAmount: "",
                    });
                  }}
                  onApply={() => {
                    if (mobileApplyDisabled) return;
                    updateTransactionsUrl(
                      buildApplyFiltersHref({
                        ...mobileDraftFilters,
                        minTransactionCount: parsedMinimumCount.value,
                        maxTransactionCount: parsedMaximumCount.value,
                        minTotalAmount: parsedMinimumAmount.value,
                        maxTotalAmount: parsedMaximumAmount.value,
                      }),
                      "replace"
                    );
                    setMobileFiltersOpen(false);
                  }}
                />
              }
            >
              <div className="space-y-5">
                <FilterSection number="1" title="Transaction count">
                  <NumericRangeFields
                    legend="Transaction count"
                    minValue={mobileRangeDrafts.minTransactionCount}
                    maxValue={mobileRangeDrafts.maxTransactionCount}
                    step="1"
                    integer
                    error={countRangeError}
                    onMinChange={(value) =>
                      setMobileRangeDrafts((current) => ({ ...current, minTransactionCount: value }))
                    }
                    onMaxChange={(value) =>
                      setMobileRangeDrafts((current) => ({ ...current, maxTransactionCount: value }))
                    }
                  />
                </FilterSection>
                <FilterSection number="2" title="Total sent">
                  <NumericRangeFields
                    legend="Total sent"
                    minValue={mobileRangeDrafts.minTotalAmount}
                    maxValue={mobileRangeDrafts.maxTotalAmount}
                    step="0.01"
                    error={amountRangeError}
                    onMinChange={(value) =>
                      setMobileRangeDrafts((current) => ({ ...current, minTotalAmount: value }))
                    }
                    onMaxChange={(value) =>
                      setMobileRangeDrafts((current) => ({ ...current, maxTotalAmount: value }))
                    }
                  />
                </FilterSection>
                <FilterSection number="3" title="Sort by">
                  <Select
                    ariaLabel="Sort recipients"
                    presentation="inline"
                    value={`${mobileDraftFilters.sortBy}:${mobileDraftFilters.sortOrder}`}
                    onValueChange={(value) => {
                      const [sortBy, sortOrder] = value.split(":") as [
                        typeof mobileDraftFilters.sortBy,
                        typeof mobileDraftFilters.sortOrder,
                      ];
                      setMobileDraftFilters((current) => ({ ...current, sortBy, sortOrder, page: 1 }));
                    }}
                    options={recipientSortOptions}
                  />
                </FilterSection>
              </div>
            </MobileBottomSheet>
          </div>
          <p className="whitespace-nowrap text-sm text-secondary-foreground">{mobileResultLabel}</p>
        </div>
      </section>

      <section className="hidden lg:block">
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
                    "p-4 text-left transition-colors hover:bg-[var(--paper-mint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    drawerRow?.uuid === row.uuid &&
                      "bg-primary/35 ring-2 ring-inset ring-border"
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
                    <span className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-[999px] border-2 border-border bg-[var(--paper-mint)] px-3 text-sm font-semibold text-foreground">
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
                  </div>
                </button>
              ))}
            </MobileCardList>

            <div className="hidden lg:block">
              <Table className="min-w-[920px] table-fixed">
                <TableHeader className="border-b-2 border-border bg-secondary/55">
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
                          `/recipients/${row.original.uuid}`,
                          router.push
                        );
                      }}
                      onKeyDown={(event) => {
                        handleLinkRowKeyDown(
                          event,
                          `/recipients/${row.original.uuid}`,
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
                                href={`/recipients/${row.original.uuid}`}
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
        primaryHref={drawerRow ? `/recipients/${drawerRow.uuid}` : "/recipients"}
        primaryLabel="Open Recipient"
        secondaryHref={drawerRow ? `/recipients/${drawerRow.uuid}#transactions` : undefined}
        secondaryLabel="View Transactions"
      >
        {drawerRow ? (
          <div className="space-y-3 pb-2">
            <div className="rounded-[8px] border-2 border-border bg-[var(--paper-mint)] px-4 py-3.5">
              <p className="text-xs font-semibold text-secondary-foreground">
                Total sent
              </p>
              <p className="mt-2 text-[1.65rem] font-semibold leading-none tabular-nums text-foreground">
                {numberToINR(drawerRow.totalAmount)}
              </p>
            </div>
            <div className="grid gap-3 rounded-[8px] border-2 border-border bg-card px-4 py-3.5">
              <DetailMetric
                icon={<Hash className="h-4 w-4" />}
                label="Aliases"
                value={drawerRow.secondaryLabel}
              />
              <DetailMetric
                icon={<BadgeCheck className="h-4 w-4" />}
                label="Linked transactions"
                value={String(drawerRow.transactionCount)}
              />
            </div>
            {drawerRow.aliasChips.length > 0 ? (
              <div className="grid gap-2 rounded-[8px] border-2 border-border bg-[var(--paper-lilac)] px-4 py-3.5">
                {drawerRow.aliasChips.slice(0, 2).map((alias, index) => (
                  <div
                    key={alias.id}
                    className="flex items-start justify-between gap-3"
                  >
                    <span className="shrink-0 text-sm text-secondary-foreground">
                      Alias {index + 1}
                    </span>
                    <MobileLongValue value={alias.value} className="text-right" />
                  </div>
                ))}
                {drawerRow.overflowAliasCount > 0 ? (
                  <p className="text-sm font-medium text-secondary-foreground">
                    +{drawerRow.overflowAliasCount} more
                  </p>
                ) : null}
              </div>
            ) : null}
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
        <span className="text-foreground">{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}
