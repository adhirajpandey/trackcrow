"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, SlidersHorizontal, Tag } from "lucide-react";

import { AppPageHeader } from "@/components/product/app-page-header";
import {
  MobileBottomSheet,
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
import { Button } from "@/components/ui/button";
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
  buildApplyFiltersHref,
  buildCategoryOptions,
  buildPageHref,
  buildSearchHref,
  buildSortHref,
  buildSubcategoryOptions,
  formatTransactionAmount,
  formatTransactionDateLabel,
  formatTransactionTimeLabel,
} from "./transactions-view-model";
import { TransactionsFilterControls } from "./transactions-filter-controls";
import { TransactionsTable } from "./transactions-table";
import { TransactionsTimeframePicker } from "./transactions-timeframe-picker";

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
  const categoriesQuery = useCategoriesQuery({
    initialData: initialCategoriesData,
  });
  const categoriesData = categoriesQuery.data ?? initialCategoriesData;
  const state = getTransactionsPageState(toSearchParamsObject(searchParams), {
    categories: categoriesData,
  });
  const transactionsQuery = useTransactionsQuery({
    query: state.query,
    initialQuery: initialTransactionsQuery,
    initialData: initialTransactionsData,
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
    categories: categoriesData,
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
  const subcategoryOptions = buildSubcategoryOptions(data.categories, data.filters);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileDraftFilters, setMobileDraftFilters] = useState(data.filters);
  const searchTimeoutRef = useRef<number | null>(null);
  const mobileFilterItems = [
    data.filters.rangeLabel !== "All time" ? { label: data.filters.rangeLabel } : null,
    data.filters.categories.length > 0
      ? { label: `${data.filters.categories.length} categor${data.filters.categories.length === 1 ? "y" : "ies"}` }
      : null,
    data.filters.subcategories.length > 0
      ? {
          label: `${data.filters.subcategories.length} subcategor${data.filters.subcategories.length === 1 ? "y" : "ies"}`,
        }
      : null,
  ].filter(Boolean) as Array<{ label: string }>;

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (mobileFiltersOpen) {
      setMobileDraftFilters(data.filters);
    }
  }, [data.filters, mobileFiltersOpen]);

  const mobileSubcategoryOptions = buildSubcategoryOptions(
    data.categories,
    mobileDraftFilters
  );

  return (
    <div className="space-y-3.5">
      <MobilePageHeader
        eyebrow="Transaction workspace"
        title="Transactions"
        description="Search, filter, and review all your transactions in one place."
      />
      <div className="lg:hidden">
        <TransactionsTimeframePicker filters={data.filters} />
      </div>
      <div className="hidden lg:block">
        <AppPageHeader
          eyebrow="Transaction workspace"
          title="Transactions"
          description="Search, filter, and review all your transactions in one place."
          actions={<TransactionsTimeframePicker filters={data.filters} />}
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

      <section className={cn(mobileSurfaceClassName, "space-y-3 p-4 lg:hidden")}>
        <MobileSearchBar
          defaultValue={data.filters.q}
          placeholder="Search recipient, remarks, amount..."
          onChange={(nextValue) => {
            if (searchTimeoutRef.current !== null) {
              window.clearTimeout(searchTimeoutRef.current);
            }

            searchTimeoutRef.current = window.setTimeout(() => {
              updateTransactionsUrl(buildSearchHref(data.filters, nextValue), "replace");
            }, 300);
          }}
        />
        <div className="flex items-center justify-between gap-3">
          <MobileFilterChips items={mobileFilterItems} className="min-w-0 flex-1" />
          <MobileBottomSheet
            open={mobileFiltersOpen}
            onOpenChange={(open) => {
              setMobileFiltersOpen(open);
              if (open) {
                setMobileDraftFilters(data.filters);
              }
            }}
            trigger={
              <Button type="button" variant="secondary" size="sm" className="shrink-0">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
            }
            title="Transactions filters"
            description="Refine the transaction feed."
            footer={
              <div className="flex justify-center">
                <Button
                  type="button"
                  className="min-w-40"
                  onClick={() => {
                    updateTransactionsUrl(buildApplyFiltersHref(mobileDraftFilters), "replace");
                    setMobileFiltersOpen(false);
                  }}
                >
                  Apply Filter
                </Button>
              </div>
            }
          >
            <TransactionsFilterControls
              filters={mobileDraftFilters}
              categories={data.categories}
              categoryOptions={categoryOptions}
              subcategoryOptions={mobileSubcategoryOptions}
              mode="draft"
              onFiltersChange={setMobileDraftFilters}
              renderMenusInPortal={false}
            />
          </MobileBottomSheet>
        </div>
      </section>

      <section className="hidden rounded-[8px] border border-border/55 bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))] px-4 py-4 shadow-[0_8px_24px_rgba(0,0,0,0.16)] sm:px-5 lg:block">
        <TransactionsFilterControls
          filters={data.filters}
          categories={data.categories}
          categoryOptions={categoryOptions}
          subcategoryOptions={subcategoryOptions}
        />
      </section>

      <section
        aria-busy={isRefreshing}
        aria-live="polite"
        className={cn("relative transition-opacity", isRefreshing && "opacity-95")}
      >
        {isRefreshing ? <span className="sr-only">Refreshing transactions</span> : null}
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
                    row.isSelected && "ring-1 ring-inset ring-primary/30"
                  )}
                >
                  <div className="flex items-start justify-between gap-3 min-w-0">
                    <div className="min-w-0 flex-1">
                      <p className="overflow-wrap-anywhere break-words text-base font-semibold text-foreground">
                        {row.recipient}
                      </p>
                      <p className="mt-1 text-sm text-secondary-foreground">
                        {formatTransactionDateLabel(row.timestamp)} at{" "}
                        {formatTransactionTimeLabel(row.timestamp)}
                      </p>
                    </div>
                    <span className="shrink-0 text-base font-semibold tabular-nums text-foreground">
                      {formatTransactionAmount(row.amount)}
                    </span>
                  </div>
                  <div className="mt-4 flex items-start justify-between gap-3 min-w-0">
                    <span
                      className={cn(
                        "inline-flex min-h-8 max-w-full min-w-0 items-center rounded-[999px] border px-3 text-sm font-medium",
                        row.category
                          ? "border-primary/20 bg-primary/10 text-primary"
                          : "border-accent/30 bg-[rgba(41,36,18,0.78)] text-accent"
                      )}
                    >
                      <span className="overflow-wrap-anywhere break-words">
                        {row.category ?? "Uncategorized"}
                      </span>
                    </span>
                    <span className="min-w-0 text-right text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground/75">
                      <MobileLongValue value={row.subcategory ?? "No subcategory"} className="text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground/75" />
                    </span>
                  </div>
                </button>
              ))}
            </MobileCardList>

            <div className="hidden lg:block">
              <TransactionsTable
                rows={data.rows}
                columns={["timestamp", "recipient", "amount", "category", "subcategory"]}
                variant="full"
                selectedRowUuid={data.filters.selectedTransactionUuid}
                sort={{
                  sortBy: data.filters.sortBy,
                  sortOrder: data.filters.sortOrder,
                  sortableColumns: ["timestamp", "amount"],
                  onSort: (sortBy) =>
                    updateTransactionsUrl(buildSortHref(data.filters, sortBy), "push"),
                }}
                pagination={{
                  ...data.pagination,
                  buildPageHref: (page) => buildPageHref(data.filters, page),
                  onNavigate: (href) => updateTransactionsUrl(href, "push"),
                }}
                rowHref={(row) => `/transactions/${row.id}`}
                onNavigate={router.push}
                emptyTitle="No transactions matched the current filters."
              />
            </div>
          </>
        ) : (
          <TransactionsTable
            rows={[] as TransactionsPageRow[]}
            columns={["timestamp", "recipient", "amount", "category", "subcategory"]}
            variant="full"
            rowHref={(row) => `/transactions/${row.id}`}
            onNavigate={router.push}
            emptyTitle="No transactions matched the current filters."
          />
        )}
      </section>

      <div className="lg:hidden">
        <MobilePagination
          page={data.pagination.page}
          totalPages={data.pagination.totalPages}
          hasPrev={data.pagination.hasPrev}
          hasNext={data.pagination.hasNext}
          onPrev={() => updateTransactionsUrl(buildPageHref(data.filters, data.pagination.page - 1), "push")}
          onNext={() => updateTransactionsUrl(buildPageHref(data.filters, data.pagination.page + 1), "push")}
        />
      </div>

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
                icon={<Tag className="h-4 w-4" />}
                label="Subcategory"
                value={drawerRow.subcategory ?? "-"}
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
