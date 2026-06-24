"use client";

import type { ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  Users,
} from "lucide-react";

import { AppPageHeader } from "@/components/product/app-page-header";
import {
  getRecipientsPageState,
  isSameRecipientsQuery,
  type RecipientsSearchParams,
} from "@/features/recipients/query-state";
import { useRecipientsQuery } from "@/features/recipients/queries";
import type {
  RecipientsPageData,
  RecipientsPageInitialData,
} from "@/features/recipients/types";
import { getApiClientErrorMessage } from "@/lib/api/client";
import { cn } from "@/lib/utils";
import {
  dashboardInnerTableClassName,
  dashboardPanelClassName,
  dashboardTableHeaderClassName,
  dashboardTableRowClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";
import { updateTransactionsUrl } from "@/features/transactions/url-state";

import {
  buildFooterSummary,
  buildPageHref,
  buildPaginationItems,
  buildRecipientsPageData,
  buildSortHref,
  getSortDirection,
} from "./recipients-view-model";
import { RecipientsFilterControls } from "./recipients-filter-controls";

const tableTemplate =
  "minmax(220px,1.45fr) minmax(220px,1.5fr) 140px minmax(180px,1fr) 136px";

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
  const searchParams = useSearchParams();
  const state = getRecipientsPageState(toSearchParamsObject(searchParams));
  const initialData = isSameRecipientsQuery(state.query, initialRecipientsQuery)
    ? initialRecipientsData
    : undefined;
  const recipientsQuery = useRecipientsQuery({
    query: state.query,
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

  return (
    <div className="space-y-3.5">
      <AppPageHeader
        eyebrow="Recipient workspace"
        title="Recipients"
        description="Review resolved payees, identifiers, and linked transaction counts."
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
        <RecipientsFilterControls filters={data.filters} />
      </section>

      <section className={cn(dashboardPanelClassName, "overflow-hidden")}>
        <div className="overflow-x-auto">
          <div className={cn(dashboardInnerTableClassName, "min-w-[980px]")}>
            <div
              className={dashboardTableHeaderClassName}
              style={{ gridTemplateColumns: tableTemplate }}
            >
              <SortHeader
                label="Recipient"
                href={buildSortHref(data.filters, "displayName")}
                direction={getSortDirection(data.filters, "displayName")}
              />
              <span>Identifiers</span>
              <SortHeader
                label="Transactions"
                href={buildSortHref(data.filters, "transactionCount")}
                direction={getSortDirection(data.filters, "transactionCount")}
                align="right"
              />
              <span>Normalized name</span>
              <span>Status</span>
            </div>

            <div className="flex-1">
              {data.rows.length > 0 ? (
                data.rows.map((row, index) => (
                  <div
                    key={row.uuid}
                    className={cn(
                      dashboardTableRowClassName,
                      "items-center",
                      index > 0 && "border-t border-border/40"
                    )}
                    style={{ gridTemplateColumns: tableTemplate }}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{row.displayName}</p>
                      <p className="mt-1 text-xs text-secondary-foreground/85">
                        {row.secondaryLabel}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      {row.identifierChips.map((identifier) => (
                        <span
                          key={identifier.id}
                          className="inline-flex max-w-full items-center gap-2 rounded-[999px] border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                          title={identifier.value}
                        >
                          <span className="shrink-0">{identifier.label}</span>
                          <span className="truncate text-primary/90">{identifier.value}</span>
                        </span>
                      ))}
                      {row.overflowIdentifierCount > 0 ? (
                        <span className="inline-flex items-center rounded-[999px] border border-border/45 bg-background/12 px-3 py-1 text-xs font-medium text-secondary-foreground">
                          +{row.overflowIdentifierCount} more
                        </span>
                      ) : null}
                    </div>
                    <div className="text-right font-semibold tabular-nums text-foreground">
                      {row.transactionCount}
                    </div>
                    <div className="truncate text-sm text-secondary-foreground">
                      {row.normalizedName}
                    </div>
                    <div>
                      <span
                        className={cn(
                          "inline-flex min-h-8 items-center gap-2 rounded-[999px] border px-3 text-sm font-medium",
                          row.status === "active"
                            ? "border-primary/20 bg-primary/10 text-primary"
                            : "border-border/45 bg-background/12 text-secondary-foreground"
                        )}
                      >
                        {row.status === "active" ? <BadgeCheck className="h-3.5 w-3.5" /> : null}
                        <span>{row.status === "active" ? "Active" : "No transactions"}</span>
                      </span>
                    </div>
                  </div>
                ))
              ) : data.emptyState !== "none" ? (
                <EmptyState emptyState={data.emptyState} />
              ) : (
                <div className="px-5 py-8 text-sm text-secondary-foreground">
                  Recipient data is unavailable right now.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4 border-t border-border/45 px-4 py-4 sm:px-5 lg:flex-row lg:items-center lg:justify-between">
          <p className="text-sm text-secondary-foreground">
            {buildFooterSummary(data.pagination)}
          </p>
          {data.pagination.totalPages > 1 ? <Pagination data={data} /> : null}
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

function Pagination({ data }: { data: RecipientsPageData }) {
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

function EmptyState({ emptyState }: { emptyState: RecipientsPageData["emptyState"] }) {
  if (emptyState === "empty") {
    return (
      <div className="flex min-h-[220px] flex-col items-center justify-center px-5 py-8 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full border border-border/45 bg-background/12 text-secondary-foreground">
          <Users className="h-5 w-5" />
        </div>
        <p className="mt-4 text-sm font-medium text-foreground">No recipients found yet.</p>
        <p className="mt-2 max-w-md text-sm text-secondary-foreground">
          Recipients are created when transactions are added or imported.
        </p>
      </div>
    );
  }

  return (
    <div className="px-5 py-8 text-sm text-secondary-foreground">
      No recipients matched the current filters.
    </div>
  );
}
