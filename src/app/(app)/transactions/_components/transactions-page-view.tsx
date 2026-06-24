"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import { AppPageHeader } from "@/components/product/app-page-header";
import { useCategoriesQuery } from "@/features/categories/queries";
import {
  buildTransactionsPageData,
  getTransactionsPageState,
  isSameTransactionsQuery,
  type TransactionsSearchParams,
} from "@/features/transactions/query-state";
import { useTransactionsQuery } from "@/features/transactions/queries";
import type {
  TransactionsPageData,
  TransactionsPageInitialData,
} from "@/features/transactions/types";
import { updateTransactionsUrl } from "@/features/transactions/url-state";
import { getApiClientErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  dashboardInnerTableClassName,
  dashboardPanelClassName,
  dashboardTableHeaderClassName,
  dashboardTableRowClassName,
  dashboardTableTallRowClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";

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

const tableTemplate =
  "minmax(160px,1.05fr) minmax(220px,1.4fr) 128px 180px 88px";

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
  const searchParams = useSearchParams();
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
  const categoryOptions = buildCategoryOptions(data.categories);

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

      <section className={cn(dashboardPanelClassName, "px-4 py-4 sm:px-5")}>
        <TransactionsFilterControls
          filters={data.filters}
          categoryOptions={categoryOptions}
        />
      </section>

      {data.drilldownLabel ? (
        <section className="rounded-[8px] border border-border/50 bg-background/12 px-4 py-3 text-sm text-secondary-foreground">
          {data.drilldownLabel}
        </section>
      ) : null}

      <section className={cn(dashboardPanelClassName, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <div className={cn(dashboardInnerTableClassName, "min-w-[860px]")}>
            <div
              className={dashboardTableHeaderClassName}
              style={{ gridTemplateColumns: tableTemplate }}
            >
              <SortHeader
                label="Date & time"
                href={buildSortHref(data.filters, "timestamp")}
                direction={getSortDirection(data.filters, "timestamp")}
              />
              <span>Recipient</span>
              <SortHeader
                label="Amount"
                href={buildSortHref(data.filters, "amount")}
                direction={getSortDirection(data.filters, "amount")}
                align="right"
              />
              <span>Category</span>
              <span>Source</span>
            </div>

            <div className="flex-1">
              {data.rows.length > 0 ? (
                data.rows.map((row, index) => (
                  <div
                    key={row.uuid}
                    className={cn(
                      dashboardTableTallRowClassName,
                      dashboardTableRowClassName,
                      "items-center",
                      index > 0 && "border-t border-border/40",
                      row.isSelected &&
                        "bg-primary/10 ring-1 ring-inset ring-primary/30"
                    )}
                    style={{ gridTemplateColumns: tableTemplate }}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">
                        {formatTransactionDateLabel(row.timestamp)}
                      </p>
                      <p className="mt-1 text-xs text-secondary-foreground/85">
                        {formatTransactionTimeLabel(row.timestamp)}
                      </p>
                    </div>
                    <div className="truncate font-medium text-foreground">{row.recipient}</div>
                    <div className="text-right font-semibold tabular-nums text-foreground">
                      {formatTransactionAmount(row.amount)}
                    </div>
                    <div className="min-w-0">
                      <span
                        className={cn(
                          "inline-flex min-h-8 max-w-full items-center rounded-[999px] border px-3 text-sm font-medium",
                          row.category
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-accent/30 bg-[rgba(41,36,18,0.78)] text-accent"
                        )}
                      >
                        <span className="truncate">{row.category ?? "Uncategorized"}</span>
                      </span>
                    </div>
                    <div className="font-medium uppercase tracking-[0.08em] text-secondary-foreground">
                      {row.source}
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/45 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-secondary-foreground">
            {buildFooterSummary(data.pagination)}
          </p>
          {data.pagination.totalPages > 1 ? (
            <Pagination data={data} />
          ) : null}
        </div>
      </section>
    </div>
  );
}

function SortHeader({
  label,
  href,
  direction,
  align = "left",
}: {
  label: string;
  href: string;
  direction: "asc" | "desc" | null;
  align?: "left" | "right";
}) {
  return (
    <button
      type="button"
      onClick={() => updateTransactionsUrl(href, "push")}
      className={cn(
        "inline-flex items-center gap-2 transition-colors hover:text-foreground",
        align === "right" && "justify-end text-right"
      )}
    >
      <span>{label}</span>
      {direction === "asc" ? <ArrowUp className="h-3.5 w-3.5" /> : null}
      {direction === "desc" ? <ArrowDown className="h-3.5 w-3.5" /> : null}
      {direction === null ? (
        <ArrowUpDown className="h-3.5 w-3.5 text-secondary-foreground/55" />
      ) : null}
    </button>
  );
}

function Pagination({ data }: { data: TransactionsPageData }) {
  const items = buildPaginationItems(data.pagination.page, data.pagination.totalPages);

  return (
    <nav className="flex items-center gap-2 self-end" aria-label="Pagination">
      <PageControl
        href={buildPageHref(data.filters, Math.max(1, data.pagination.page - 1))}
        disabled={!data.pagination.hasPrev}
        ariaLabel="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageControl>

      {items.map((item, index) =>
        item === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="inline-flex min-h-9 min-w-9 items-center justify-center text-sm text-secondary-foreground"
          >
            ...
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => updateTransactionsUrl(buildPageHref(data.filters, item), "push")}
            aria-current={item === data.pagination.page ? "page" : undefined}
            className={cn(
              "inline-flex min-h-9 min-w-9 items-center justify-center rounded-[8px] border px-3 text-sm font-medium transition-colors",
              item === data.pagination.page
                ? "border-primary/35 bg-primary/14 text-primary"
                : "border-border/45 bg-background/10 text-foreground hover:border-border/70 hover:bg-background/16"
            )}
          >
            {item}
          </button>
        )
      )}

      <PageControl
        href={buildPageHref(
          data.filters,
          Math.min(data.pagination.totalPages, data.pagination.page + 1)
        )}
        disabled={!data.pagination.hasNext}
        ariaLabel="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </PageControl>
    </nav>
  );
}

function PageControl({
  href,
  disabled,
  ariaLabel,
  children,
}: {
  href: string;
  disabled: boolean;
  ariaLabel: string;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span
        aria-disabled="true"
        className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-[8px] border border-border/30 bg-background/8 text-secondary-foreground/45"
      >
        {children}
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => updateTransactionsUrl(href, "push")}
      aria-label={ariaLabel}
      className="inline-flex min-h-9 min-w-9 items-center justify-center rounded-[8px] border border-border/45 bg-background/10 text-foreground transition-colors hover:border-border/70 hover:bg-background/16"
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="px-5 py-8 text-sm text-secondary-foreground">
      No transactions matched the current filters.
    </div>
  );
}
