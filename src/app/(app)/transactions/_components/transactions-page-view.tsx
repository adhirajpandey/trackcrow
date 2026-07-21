"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarDays,
  LoaderCircle,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";

import { formatNumber } from "@/app/(app)/dashboard/_components/dashboard-view-model";
import { AppPageHeader } from "@/components/product/app-page-header";
import {
  FilterSheetFooter,
} from "@/components/product/list-filter-controls";
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
import { toast } from "@/components/ui/sonner";
import { useCategoriesQuery } from "@/features/categories/queries";
import { dashboardRangeCookieName } from "@/features/dashboard/query-state";
import { useDeleteTransactionMutation } from "@/features/transactions/mutations";
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
import { TransactionDeleteDialog } from "./transaction-delete-dialog";

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
  const deleteMutation = useDeleteTransactionMutation();
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
    (data.filters.subcategories.length > 0 ? 1 : 0) +
    (data.filters.classificationSources.length > 0 ? 1 : 0);
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
    (!mobileDraftFilters.startDate ||
      !mobileDraftFilters.endDate ||
      mobileDraftFilters.startDate > mobileDraftFilters.endDate);

  function persistRange(range: typeof mobileDraftFilters.range) {
    document.cookie = `${dashboardRangeCookieName}=${range}; path=/; max-age=31536000; samesite=lax`;
  }

  async function handleDrawerDelete() {
    if (!drawerRow) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ transactionUuid: drawerRow.uuid });
      setDrawerRow(null);
      await transactionsQuery.refetch();
      toast({
        tone: "success",
        title: "Transaction deleted",
        description: "The transaction was removed from the ledger.",
        durationMs: 3200,
      });
    } catch (error) {
      toast({
        tone: "warning",
        title: "Delete unavailable",
        description: getApiClientErrorMessage(
          error,
          "Unable to delete this transaction right now."
        ),
        durationMs: 4200,
      });
    }
  }

  return (
    <div className="space-y-3.5">
      <MobilePageHeader
        eyebrow="Transaction workspace"
        title="Transactions"
        description="Search, filter, and review transactions."
        actions={
          <Button asChild className="w-full">
            <Link href="/transactions/new">
              <Plus className="h-4 w-4" /> Add Transaction
            </Link>
          </Button>
        }
      />
      <div className="hidden lg:block">
        <AppPageHeader
          eyebrow="Transaction workspace"
          title="Transactions"
          description="Search, filter, and review transactions."
          actions={
            <div className="flex flex-wrap items-center justify-end gap-2">
              <TransactionsTimeframePicker filters={data.filters} />
              <Button asChild>
                <Link href="/transactions/new">
                  <Plus className="h-4 w-4" /> Add Transaction
                </Link>
              </Button>
            </div>
          }
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
          value={data.filters.q}
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
              triggerLabel={mobileFilterTriggerLabel}
              title="Transactions filters"
              description="Refine the transaction feed."
              footer={
                <FilterSheetFooter
                  applyDisabled={mobileApplyDisabled}
                  onReset={() =>
                    setMobileDraftFilters(buildResetFilterState(mobileDraftFilters))
                  }
                  onApply={() => {
                    persistRange(mobileDraftFilters.range);
                    updateTransactionsUrl(buildApplyFiltersHref(mobileDraftFilters), "replace");
                    setMobileFiltersOpen(false);
                  }}
                />
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

      <section className="hidden lg:block">
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
                    "px-4 py-3.5 text-left transition-colors hover:bg-[var(--paper-mint)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    (row.isSelected || drawerRow?.uuid === row.uuid) &&
                      "bg-primary/35 ring-2 ring-inset ring-border"
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
                        "inline-flex min-h-11 max-w-full min-w-0 items-center rounded-[999px] border-2 border-border px-3 text-sm font-semibold",
                        row.category
                          ? "bg-primary/35 text-foreground"
                          : "bg-[#fff1bd] text-foreground"
                      )}
                    >
                      <span className="overflow-wrap-anywhere break-words">
                        {row.category ?? "Uncategorized"}
                      </span>
                    </span>
                    <span className="min-w-0 text-right">
                      <MobileLongValue
                        value={row.subcategory ?? "No subcategory"}
                        className="text-sm font-medium text-secondary-foreground"
                      />
                    </span>
                  </div>
                </button>
              ))}
            </MobileCardList>

            <div className="hidden lg:block">
              <TransactionsTable
                rows={data.rows}
                columns={["timestamp", "recipient", "amount", "category", "assignment", "subcategory"]}
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
                rowHref={(row) => `/transactions/${row.uuid}`}
                onNavigate={router.push}
                emptyTitle="No transactions matched the current filters."
              />
            </div>
          </>
        ) : (
          <TransactionsTable
            rows={[] as TransactionsPageRow[]}
            columns={["timestamp", "recipient", "amount", "category", "assignment", "subcategory"]}
            variant="full"
            rowHref={(row) => `/transactions/${row.uuid}`}
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
        primaryHref={drawerRow ? `/transactions/${drawerRow.uuid}` : "/transactions"}
        primaryLabel="Open Transaction"
        secondaryHref={drawerRow ? `/recipients/${drawerRow.recipientUuid}` : undefined}
        secondaryLabel="Open Recipient"
        headerAction={
          drawerRow ? (
            <TransactionDeleteDialog
              transactionUuid={drawerRow.uuid}
              isDeleting={deleteMutation.isPending}
              onDelete={handleDrawerDelete}
              trigger={
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  aria-label="Delete transaction"
                  title="Delete transaction"
                  disabled={deleteMutation.isPending}
                  className="border-destructive/55 bg-destructive/10 text-destructive hover:bg-destructive/18"
                >
                  {deleteMutation.isPending ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              }
            />
          ) : null
        }
      >
        {drawerRow ? (
          <div className="space-y-3 pb-2">
            <div className="rounded-[8px] border-2 border-border bg-[var(--paper-mint)] px-4 py-3.5">
              <p className="text-xs font-semibold text-secondary-foreground">
                Amount
              </p>
              <p className="mt-2 text-[1.65rem] font-semibold leading-none tabular-nums text-foreground">
                {formatTransactionAmount(drawerRow.amount)}
              </p>
              {!drawerRow.category ? (
                <p className="mt-3 text-sm font-semibold text-foreground">Needs category</p>
              ) : null}
            </div>
            <div className="grid gap-3 rounded-[8px] border-2 border-border bg-card px-4 py-3.5">
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
