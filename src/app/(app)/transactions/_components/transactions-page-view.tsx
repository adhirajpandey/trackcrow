"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ChevronDown, SlidersHorizontal, Tag } from "lucide-react";

import { formatNumber } from "@/app/(app)/dashboard/_components/dashboard-view-model";
import { AppPageHeader } from "@/components/product/app-page-header";
import {
  MobileBottomSheet,
  MobileCardList,
  MobileLongValue,
  MobilePageHeader,
  MobilePagination,
  MobileSearchBar,
  mobileCardClassName,
} from "@/components/product/mobile/mobile-primitives";
import { MobileRowDetailDrawer } from "@/components/product/mobile-row-detail-drawer";
import { Button } from "@/components/ui/button";
import { useCategoriesQuery } from "@/features/categories/queries";
import { dashboardRangeCookieName } from "@/features/dashboard/query-state";
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
  buildResetFilterState,
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
  const mobileActiveFilterCount =
    (data.filters.categories.length > 0 ? 1 : 0) +
    (data.filters.subcategories.length > 0 ? 1 : 0);
  const mobileTransactionCountLabel = `${formatNumber(data.pagination.total)} transaction${
    data.pagination.total === 1 ? "" : "s"
  }`;
  const mobileFilterTriggerLabel =
    mobileActiveFilterCount > 0
      ? `${data.filters.rangeLabel} \u00b7 ${mobileActiveFilterCount} active`
      : `Filters \u00b7 ${data.filters.rangeLabel}`;

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const mobileSubcategoryOptions = buildSubcategoryOptions(
    data.categories,
    mobileDraftFilters
  );
  const mobileApplyDisabled =
    mobileDraftFilters.range === "custom" &&
    (!mobileDraftFilters.startDate || !mobileDraftFilters.endDate);

  function persistRange(range: typeof mobileDraftFilters.range) {
    document.cookie = `${dashboardRangeCookieName}=${range}; path=/; max-age=31536000; samesite=lax`;
  }

  return (
    <div className="space-y-3.5">
      <MobilePageHeader
        eyebrow="Transaction workspace"
        title="Transactions"
        description="Search, filter, and review all your transactions in one place."
      />
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

      <section className="space-y-3 lg:hidden">
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
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <MobileBottomSheet
            open={mobileFiltersOpen}
            onOpenChange={(open) => {
              setMobileFiltersOpen(open);
              if (open) {
                setMobileDraftFilters(data.filters);
              }
            }}
            trigger={
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="h-9 max-w-full min-w-0 gap-2 rounded-[8px] border-border/55 bg-background/14 px-3 text-sm font-medium"
              >
                <span className="flex min-w-0 items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4 shrink-0" />
                  <span className="truncate text-left">{mobileFilterTriggerLabel}</span>
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-secondary-foreground/80" />
              </Button>
            }
            title="Transactions filters"
            description="Refine the transaction feed."
            footer={
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setMobileDraftFilters(buildResetFilterState(mobileDraftFilters))}
                >
                  Clear all
                </Button>
                <Button
                  type="button"
                  disabled={mobileApplyDisabled}
                  onClick={() => {
                    persistRange(mobileDraftFilters.range);
                    updateTransactionsUrl(buildApplyFiltersHref(mobileDraftFilters), "replace");
                    setMobileFiltersOpen(false);
                  }}
                >
                  Apply filters
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
              variant="mobile-sheet"
              onFiltersChange={setMobileDraftFilters}
              renderMenusInPortal={false}
              menuPortalZIndex={120}
            />
            </MobileBottomSheet>
          </div>
          <p className="whitespace-nowrap text-sm text-secondary-foreground">
            {mobileTransactionCountLabel}
          </p>
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
            <MobileCardList>
              {data.rows.map((row) => (
                <button
                  key={row.uuid}
                  type="button"
                  onClick={() => setDrawerRow(row)}
                  className={cn(
                    mobileCardClassName,
                    "px-4 py-3.5 text-left transition-colors hover:bg-background/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                  <div className="mt-3 flex items-start justify-between gap-3 min-w-0">
                    <span
                      className={cn(
                        "inline-flex min-h-7 max-w-full min-w-0 items-center rounded-[999px] border px-3 text-sm font-medium",
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
