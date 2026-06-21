"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
  X,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import {
  type DashboardCategoryFilterValue,
  buildCategoryQuickTagOptions,
  buildRecentTransactionsApiHref,
  dashboardTableLayouts,
  getCategoryTriggerLabel,
  mapTransactionListToDashboardItems,
} from "./dashboard-bottom-section-model";
import {
  dashboardAttentionPanelClassName,
  dashboardFooterLinkClassName,
  dashboardFooterStackClassName,
  dashboardInnerTableClassName,
  dashboardPanelClassName,
  dashboardPrimaryActionClassName,
  dashboardSmallActionClassName,
  dashboardTableHeaderClassName,
  dashboardTableRowClassName,
  dashboardTableTallRowClassName,
} from "./dashboard-style";
import {
  buildFrequentRecipientRows,
  buildRecentTransactionMeta,
  buildRecentTransactionsSummary,
  buildTransactionsHref,
  formatCurrency,
  formatShortDate,
  getCategoryShare,
  getKnownSpendTotal,
  getKnownSpendingCategories,
  getRangeParams,
} from "./dashboard-view-model";

export function DashboardBottomSection({
  data,
  displayRange,
  topCategory,
}: {
  data: DashboardPageData;
  displayRange: string;
  topCategory: string | null;
}) {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] =
    useState<DashboardCategoryFilterValue>("all");
  const [recentTransactions, setRecentTransactions] = useState(
    data.recentTransactions.slice(0, 6)
  );
  const [isLoadingRecentTransactions, setIsLoadingRecentTransactions] = useState(false);
  const [recentTransactionsError, setRecentTransactionsError] = useState<string | null>(null);
  const [pendingTransactionId, setPendingTransactionId] = useState<number | null>(null);
  const [assignmentErrorTransactionId, setAssignmentErrorTransactionId] = useState<
    number | null
  >(null);
  const [openCategoryMenuTransactionId, setOpenCategoryMenuTransactionId] = useState<
    number | null
  >(null);
  const categoryMenuRef = useRef<HTMLDivElement | null>(null);
  const [isRefreshing, startRefreshTransition] = useTransition();
  const quickTagOptions = buildCategoryQuickTagOptions(data.categoryOptions);
  const rangeParams = getRangeParams(data.range);
  const hasActiveRecentFilters = selectedCategory !== "all";
  const knownCategories = getKnownSpendingCategories(data.spendingByCategory);
  const knownSpendTotal = getKnownSpendTotal(data.spendingByCategory);
  const maxKnownCategorySpend = Math.max(
    ...knownCategories.map((item) => item.totalSpend),
    1
  );
  const uncategorizedCategory =
    data.spendingByCategory.find((item) => item.category === "Uncategorized") ?? null;
  const frequentRecipientRows = buildFrequentRecipientRows({
    recipients: data.frequentRecipients,
  });

  useEffect(() => {
    if (!hasActiveRecentFilters) {
      setRecentTransactions(data.recentTransactions.slice(0, 6));
      setRecentTransactionsError(null);
      setIsLoadingRecentTransactions(false);
      return;
    }

    let isCancelled = false;

    async function loadRecentTransactions() {
      setIsLoadingRecentTransactions(true);
      setRecentTransactionsError(null);

      try {
        const response = await fetch(
          buildRecentTransactionsApiHref({
            startDate: data.range.startDate,
            endDate: data.range.endDate,
            query: "",
            category: selectedCategory,
          }),
          { method: "GET", credentials: "same-origin" }
        );

        if (!response.ok) {
          throw new Error("Failed to load recent transactions");
        }

        const payload = await response.json();
        if (!isCancelled) {
          setRecentTransactions(mapTransactionListToDashboardItems(payload));
        }
      } catch {
        if (!isCancelled) {
          setRecentTransactionsError("Recent transactions could not be updated.");
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingRecentTransactions(false);
        }
      }
    }

    void loadRecentTransactions();

    return () => {
      isCancelled = true;
    };
  }, [
    data.range.endDate,
    data.range.startDate,
    data.recentTransactions,
    hasActiveRecentFilters,
    selectedCategory,
  ]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!categoryMenuRef.current?.contains(event.target as Node)) {
        setOpenCategoryMenuTransactionId(null);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpenCategoryMenuTransactionId(null);
      }
    }

    if (openCategoryMenuTransactionId !== null) {
      window.addEventListener("mousedown", handlePointerDown);
      window.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openCategoryMenuTransactionId]);

  async function handleQuickTag(transactionId: number, categoryId: number) {
    const category = data.categoryOptions.find((item) => item.id === categoryId);
    if (!category) {
      return;
    }

    const previousTransactions = recentTransactions;
    const nextCategoryName = category.name;

    setAssignmentErrorTransactionId(null);
    setPendingTransactionId(transactionId);
    setOpenCategoryMenuTransactionId(null);
    setRecentTransactions((current) =>
      current.flatMap((transaction) => {
        if (transaction.id !== transactionId) {
          return [transaction];
        }

        if (selectedCategory === "uncategorized") {
          return [];
        }

        return [{ ...transaction, category: nextCategoryName }];
      })
    );

    try {
      const response = await fetch(`/api/transactions/${transactionId}/category`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "same-origin",
        body: JSON.stringify({ categoryId }),
      });

      if (!response.ok) {
        throw new Error("Failed to update category");
      }

      startRefreshTransition(() => {
        router.refresh();
      });
    } catch {
      setRecentTransactions(previousTransactions);
      setAssignmentErrorTransactionId(transactionId);
    } finally {
      setPendingTransactionId(null);
    }
  }

  const recentSummary = buildRecentTransactionsSummary({
    transactionCount: recentTransactions.length,
    uncategorizedCount: recentTransactions.filter((transaction) => !transaction.category).length,
  });

  const categoryDrilldownHref =
    selectedCategory === "all"
      ? buildTransactionsHref(rangeParams)
      : selectedCategory === "uncategorized"
        ? buildTransactionsHref({ ...rangeParams, status: "uncategorized" })
        : buildTransactionsHref({ ...rangeParams, category: selectedCategory });

  return (
    <section className="space-y-3">
      <section className="grid items-stretch gap-3 xl:grid-cols-3">
        <SpendingByCategoryPanel
          categories={knownCategories}
          categorizedSpendTotal={knownSpendTotal}
          maxCategorySpend={maxKnownCategorySpend}
          topCategory={topCategory}
          sectionStatus={data.sectionStatus.categories}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          drilldownHref={categoryDrilldownHref}
          uncategorizedCategory={uncategorizedCategory}
          uncategorizedHref={buildTransactionsHref({
            ...rangeParams,
            status: "uncategorized",
          })}
        />
        <FrequentRecipientsPanel
          recipients={frequentRecipientRows}
          displayRange={displayRange}
        />
        <LargestTransactionsPanel
          transactions={data.recentLargeTransactions}
          range={data.range}
          displayRange={displayRange}
        />
      </section>

      <section>
        <RecentTransactionsPanel
          transactions={recentTransactions}
          range={data.range}
          transactionStatus={data.sectionStatus.transactions}
          summary={recentSummary}
          isLoading={isLoadingRecentTransactions || isRefreshing}
          errorMessage={recentTransactionsError}
          quickTagOptions={quickTagOptions}
          pendingTransactionId={pendingTransactionId}
          assignmentErrorTransactionId={assignmentErrorTransactionId}
          onQuickTag={handleQuickTag}
          openCategoryMenuTransactionId={openCategoryMenuTransactionId}
          onToggleCategoryMenu={(transactionId) =>
            setOpenCategoryMenuTransactionId((current) =>
              current === transactionId ? null : transactionId
            )
          }
          categoryMenuRef={categoryMenuRef}
          selectedCategory={selectedCategory}
          onClearCategoryFilter={() => setSelectedCategory("all")}
          displayRange={displayRange}
        />
      </section>
    </section>
  );
}

function AlignedPanelHeader({
  title,
  description,
  trailing,
}: {
  title: string;
  description: string;
  trailing?: ReactNode;
}) {
  return (
    <CardHeader className="pb-3">
      <div className="space-y-1.5">
        <CardTitle className="text-[1.1rem] font-semibold normal-case tracking-normal text-foreground">
          {title}
        </CardTitle>
        <p className="min-h-[28px] text-sm leading-5 text-secondary-foreground">{description}</p>
      </div>
      {trailing ? <div className="mt-2">{trailing}</div> : null}
    </CardHeader>
  );
}

function SpendingByCategoryPanel({
  categories,
  categorizedSpendTotal,
  maxCategorySpend,
  topCategory,
  sectionStatus,
  selectedCategory,
  onSelectCategory,
  drilldownHref,
  uncategorizedCategory,
  uncategorizedHref,
}: {
  categories: DashboardPageData["spendingByCategory"];
  categorizedSpendTotal: number;
  maxCategorySpend: number;
  topCategory: string | null;
  sectionStatus: DashboardPageData["sectionStatus"]["categories"];
  selectedCategory: DashboardCategoryFilterValue;
  onSelectCategory: (value: DashboardCategoryFilterValue) => void;
  drilldownHref: string;
  uncategorizedCategory: DashboardPageData["spendingByCategory"][number] | null;
  uncategorizedHref: string;
}) {
  return (
    <Card className={cn(dashboardPanelClassName, "flex min-h-[470px] flex-col")}>
      <AlignedPanelHeader
        title="Where your money went"
        description="Known categories only"
        trailing={
          selectedCategory !== "all" ? (
            <button
              type="button"
              onClick={() => onSelectCategory("all")}
              className={cn(
                dashboardSmallActionClassName,
                "gap-2 border border-border/50 bg-background/18 text-foreground transition-colors hover:bg-secondary/18"
              )}
            >
              Clear filter
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null
        }
      />
      <CardContent className="flex flex-1 flex-col">
        {categories.length === 0 ? (
          <EmptyPanel
            title={
              sectionStatus === "incomplete"
                ? "No known category yet."
                : "No known category yet."
            }
            helper="Categorize transactions to see your top category."
          />
        ) : (
          <div className="space-y-3">
            <div className={dashboardInnerTableClassName}>
              <TableHeader
                layout={dashboardTableLayouts.spendingByCategory}
              />
              <div className="flex-1">
                {categories.slice(0, 5).map((item, index) => {
                  const share = getCategoryShare(item.totalSpend, categorizedSpendTotal);
                  const isTop = item.category === topCategory;
                  const isActive = selectedCategory === item.category;

                  return (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => onSelectCategory(item.category)}
                      className={cn(
                        dashboardTableRowClassName,
                        "w-full items-center text-left",
                        index > 0 && "border-t border-border/40",
                        isActive && "bg-secondary/20"
                      )}
                      style={{
                        gridTemplateColumns: dashboardTableLayouts.spendingByCategory.template,
                      }}
                    >
                      <div className="min-w-0">
                        <div className="flex items-start gap-2">
                          <span
                            className={cn(
                              "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                              isTop ? "bg-primary" : "bg-primary/65"
                            )}
                          />
                          <span className="break-words font-medium leading-5 text-foreground">
                            {item.category}
                          </span>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-secondary/20">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{
                              width: `${Math.max(4, (item.totalSpend / maxCategorySpend) * 100)}%`,
                            }}
                          />
                        </div>
                      </div>
                      <span className="text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(item.totalSpend)}
                      </span>
                      <span className="text-right font-medium text-secondary-foreground">
                        {share}%
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            {uncategorizedCategory ? (
              <div className={cn(dashboardAttentionPanelClassName, "px-4 py-3")}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-accent">Uncategorized</p>
                    <p className="mt-1 text-sm text-secondary-foreground">
                      {formatCurrency(uncategorizedCategory.totalSpend)} across{" "}
                      {uncategorizedCategory.transactionCount} transactions
                    </p>
                  </div>
                  <Link
                    href={uncategorizedHref}
                    className={cn(
                      dashboardPrimaryActionClassName,
                      "border border-accent/35 bg-accent text-accent-foreground transition-colors hover:brightness-105"
                    )}
                  >
                    Review
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}
        <FooterActions>
          <PanelFooterLink
            href={drilldownHref}
            label={
              selectedCategory === "all"
                ? "View all activity"
                : selectedCategory === "uncategorized"
                  ? "Open uncategorized transactions"
                  : "Open filtered transactions"
            }
          />
        </FooterActions>
      </CardContent>
    </Card>
  );
}

function FrequentRecipientsPanel({
  recipients,
  displayRange,
}: {
  recipients: ReturnType<typeof buildFrequentRecipientRows>;
  displayRange: string;
}) {
  return (
    <Card className={cn(dashboardPanelClassName, "flex min-h-[470px] flex-col")}>
      <AlignedPanelHeader
        title="Frequent recipients"
        description={`Most repeated recipients in ${displayRange}.`}
      />
      <CardContent className="flex flex-1 flex-col">
        {recipients.length === 0 ? (
          <EmptyPanel title="No repeated recipients in this period." />
        ) : (
          <div className={dashboardInnerTableClassName}>
            <TableHeader
              layout={dashboardTableLayouts.frequentRecipients}
            />
            <div className="flex-1">
              {recipients.map((recipient, index) => (
                <Link
                  key={recipient.recipient}
                  href={recipient.href}
                  className={cn(
                    dashboardTableRowClassName,
                    "items-center",
                    index > 0 && "border-t border-border/40"
                  )}
                  style={{
                    gridTemplateColumns: dashboardTableLayouts.frequentRecipients.template,
                  }}
                >
                  <span className="truncate font-medium text-foreground">{recipient.recipient}</span>
                  <span className="text-right text-secondary-foreground">
                    {recipient.paymentCount}
                  </span>
                  <span className="text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(recipient.totalAmount)}
                  </span>
                  <span
                    className={cn(
                      "text-right font-semibold",
                      recipient.action === "Create rule" ? "text-primary" : "text-accent"
                    )}
                  >
                    {recipient.action}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <FooterActions>
          <PanelFooterLink href="/recipients" label="View all recipients" />
        </FooterActions>
      </CardContent>
    </Card>
  );
}

function LargestTransactionsPanel({
  transactions,
  range,
  displayRange,
}: {
  transactions: DashboardPageData["recentLargeTransactions"];
  range: DashboardPageData["range"];
  displayRange: string;
}) {
  return (
    <Card className={cn(dashboardPanelClassName, "flex min-h-[470px] flex-col")}>
      <AlignedPanelHeader
        title="Largest transactions"
        description={`Highest-value transactions inside ${displayRange}.`}
      />
      <CardContent className="flex flex-1 flex-col">
        {transactions.length === 0 ? (
          <EmptyPanel title="No large transactions in this period." />
        ) : (
          <div className={dashboardInnerTableClassName}>
            <TableHeader
              layout={dashboardTableLayouts.largestTransactions}
            />
            <div className="flex-1">
              {transactions.map((transaction, index) => (
                <Link
                  key={transaction.uuid}
                  href={buildTransactionsHref({ transaction: transaction.uuid })}
                  className={cn(
                    dashboardTableRowClassName,
                    "items-start",
                    index > 0 && "border-t border-border/40"
                  )}
                  style={{
                    gridTemplateColumns: dashboardTableLayouts.largestTransactions.template,
                  }}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{transaction.recipient}</p>
                    <p className="mt-0.5 truncate text-xs text-secondary-foreground">
                      {transaction.category ?? "Uncategorized"}
                    </p>
                  </div>
                  <span className="pt-0.5 text-secondary-foreground">
                    {formatShortDate(transaction.timestamp)}
                  </span>
                  <span className="pt-0.5 text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(transaction.amount)}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <FooterActions>
          <PanelFooterLink
            href={buildTransactionsHref({
              ...getRangeParams(range),
              review: "large",
              sortBy: "amount",
              sortOrder: "desc",
            })}
            label="View all transactions"
          />
        </FooterActions>
      </CardContent>
    </Card>
  );
}

function RecentTransactionsPanel({
  transactions,
  range,
  transactionStatus,
  summary,
  isLoading,
  errorMessage,
  quickTagOptions,
  pendingTransactionId,
  assignmentErrorTransactionId,
  onQuickTag,
  openCategoryMenuTransactionId,
  onToggleCategoryMenu,
  categoryMenuRef,
  selectedCategory,
  onClearCategoryFilter,
  displayRange,
}: {
  transactions: DashboardPageData["recentTransactions"];
  range: DashboardPageData["range"];
  transactionStatus: DashboardPageData["sectionStatus"]["transactions"];
  summary: string;
  isLoading: boolean;
  errorMessage: string | null;
  quickTagOptions: Array<{ id: number; label: string }>;
  pendingTransactionId: number | null;
  assignmentErrorTransactionId: number | null;
  onQuickTag: (transactionId: number, categoryId: number) => Promise<void>;
  openCategoryMenuTransactionId: number | null;
  onToggleCategoryMenu: (transactionId: number) => void;
  categoryMenuRef: RefObject<HTMLDivElement | null>;
  selectedCategory: DashboardCategoryFilterValue;
  onClearCategoryFilter: () => void;
  displayRange: string;
}) {
  return (
    <Card className={cn(dashboardPanelClassName, "flex flex-col")}>
      <AlignedPanelHeader
        title="Recent transactions"
        description={`Latest activity in ${displayRange}.`}
        trailing={
          <div className="flex items-center justify-between gap-3 pt-1 text-sm font-medium text-secondary-foreground">
            <span className="tracking-[0.01em]">{summary}</span>
            {isLoading ? <LoaderCircle className="h-4 w-4 animate-spin text-primary" /> : null}
          </div>
        }
      />
      <CardContent className="flex flex-1 flex-col">
        {errorMessage ? (
          <div className="mb-3 rounded-[8px] border border-destructive/35 bg-destructive/10 px-3 py-2 text-sm text-foreground">
            {errorMessage}
          </div>
        ) : null}
        {transactions.length === 0 ? (
          <EmptyPanel
            title={
              selectedCategory !== "all"
                ? "No recent transactions match this filter."
                : "No recent transactions in this period."
            }
            helper={
              selectedCategory !== "all"
                ? "Clear the category filter or search to broaden the activity list."
                : transactionStatus === "empty"
                  ? "Import or add transactions to populate recent activity."
                  : undefined
            }
          />
        ) : (
          <div className={dashboardInnerTableClassName}>
            <TableHeader
              layout={dashboardTableLayouts.recentTransactions}
            />
            <div className="flex-1">
              {transactions.map((transaction, index) => {
                const meta = buildRecentTransactionMeta(transaction.category, transaction.timestamp);
                const isPending = pendingTransactionId === transaction.id;
                const hasAssignmentError = assignmentErrorTransactionId === transaction.id;
                const isCategoryMenuOpen =
                  openCategoryMenuTransactionId === transaction.id;

                return (
                  <div
                    key={transaction.uuid}
                    className={cn(
                      dashboardTableTallRowClassName,
                      "items-start",
                      index > 0 && "border-t border-border/40"
                    )}
                    style={{
                      gridTemplateColumns: dashboardTableLayouts.recentTransactions.template,
                    }}
                  >
                    <div className="flex min-h-full flex-col justify-center pr-2 text-secondary-foreground">
                      <span className="block text-sm font-medium text-foreground">
                        {meta.dateLabel}
                      </span>
                      <span className="mt-1 block text-xs tracking-[0.01em] text-secondary-foreground/88">
                        {meta.timeLabel}
                      </span>
                    </div>
                    <div className="flex min-h-full min-w-0 items-center">
                      <Link
                        href={buildTransactionsHref({ transaction: transaction.uuid })}
                        className="block truncate pr-3 text-[15px] font-medium leading-6 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {transaction.recipient}
                      </Link>
                    </div>
                    <span className="flex min-h-full items-center justify-end pt-0.5 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrency(transaction.amount)}
                    </span>
                    <div className="flex min-h-full min-w-0 items-center">
                      {meta.needsCategory ? (
                        <div className="w-full max-w-[220px] space-y-2">
                          <div
                            ref={isCategoryMenuOpen ? categoryMenuRef : undefined}
                            className="relative w-full"
                          >
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={() => onToggleCategoryMenu(transaction.id)}
                              disabled={isPending}
                              aria-haspopup="listbox"
                              aria-expanded={isCategoryMenuOpen}
                              className={cn(
                                "min-h-9 w-full justify-between rounded-[10px] border-accent/30 bg-[rgba(41,36,18,0.78)] px-3.5 text-sm font-medium text-accent transition-colors hover:bg-[rgba(52,46,20,0.92)] hover:text-accent focus-visible:ring-accent/40",
                                isCategoryMenuOpen && "border-accent/45 bg-[rgba(52,46,20,0.92)]"
                              )}
                            >
                              <span className="truncate">
                                {getCategoryTriggerLabel(transaction.category)}
                              </span>
                              <ChevronDown
                                className={cn(
                                  "h-3.5 w-3.5 shrink-0 transition-transform",
                                  isCategoryMenuOpen && "rotate-180"
                                )}
                              />
                            </Button>
                            {isCategoryMenuOpen ? (
                              <div
                                role="listbox"
                                className="absolute left-0 top-[calc(100%+0.4rem)] z-20 w-full overflow-hidden rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(17,27,22,0.98),rgba(10,16,13,0.99))] shadow-[0_18px_38px_rgba(0,0,0,0.32)]"
                              >
                                <div className="border-b border-border/45 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground/80">
                                  Select category
                                </div>
                                <div className="max-h-56 overflow-y-auto py-1">
                                  {quickTagOptions.map((option) => (
                                    <button
                                      key={option.id}
                                      type="button"
                                      role="option"
                                      aria-selected={transaction.category === option.label}
                                      onClick={() => void onQuickTag(transaction.id, option.id)}
                                      className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-secondary/20 focus-visible:outline-none focus-visible:bg-secondary/20"
                                    >
                                      <span className="truncate">{option.label}</span>
                                      {transaction.category === option.label ? (
                                        <Check className="h-4 w-4 shrink-0 text-primary" />
                                      ) : null}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>
                          {hasAssignmentError ? (
                            <span className="block pl-0.5 text-xs text-destructive">
                              Category update failed.
                            </span>
                          ) : null}
                        </div>
                      ) : (
                        <span className="inline-flex min-h-9 max-w-full items-center rounded-[999px] border border-primary/20 bg-primary/10 px-3.5 text-sm font-medium text-primary">
                          <span className="truncate">{meta.categoryLabel}</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <FooterActions>
          {selectedCategory !== "all" ? (
            <button
              type="button"
              onClick={onClearCategoryFilter}
              className="inline-flex min-h-9 items-center justify-center rounded-[8px] border border-border/50 bg-background/16 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/18"
            >
              Clear category filter
            </button>
          ) : null}
          <PanelFooterLink
            href={buildTransactionsHref(getRangeParams(range))}
            label="View all activity"
          />
        </FooterActions>
      </CardContent>
    </Card>
  );
}

function TableHeader({
  layout,
}: {
  layout: {
    columns: string[];
    template: string;
    rightAlignedColumns?: number[];
    centerAlignedColumns?: number[];
  };
}) {
  return (
    <div
      className={dashboardTableHeaderClassName}
      style={{ gridTemplateColumns: layout.template }}
    >
      {layout.columns.map((column, index) => (
        <span
          key={column}
          className={cn(
            layout.rightAlignedColumns?.includes(index) && "text-right",
            layout.centerAlignedColumns?.includes(index) && "text-center"
          )}
        >
          {column}
        </span>
      ))}
    </div>
  );
}

function PanelFooterLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={dashboardFooterLinkClassName}
    >
      {label}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  );
}

function FooterActions({ children }: { children: ReactNode }) {
  return <div className={dashboardFooterStackClassName}>{children}</div>;
}

function EmptyPanel({
  title,
  helper,
}: {
  title: string;
  helper?: string;
}) {
  return (
    <div className="rounded-[8px] border border-dashed border-border/50 bg-background/16 p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-[8px] border border-border/60 bg-secondary/24 p-2 text-accent">
          <AlertCircle className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {helper ? <p className="mt-1 text-sm leading-5 text-secondary-foreground">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}
