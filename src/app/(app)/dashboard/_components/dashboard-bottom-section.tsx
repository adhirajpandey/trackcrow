"use client";

import Link from "next/link";
import type { ReactNode, RefObject } from "react";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronRight,
  LoaderCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader as SemanticTableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  handleLinkRowClick,
  handleLinkRowKeyDown,
} from "@/lib/row-link-navigation";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import {
  buildCategoryQuickTagOptions,
  buildLargestTransactionHref,
  dashboardTableLayouts,
  getCategoryTriggerLabel,
} from "./dashboard-bottom-section-model";
import {
  dashboardAttentionPanelClassName,
  dashboardFooterLinkClassName,
  dashboardFooterSecondaryLinkClassName,
  dashboardFooterStackClassName,
  dashboardInnerTableClassName,
  dashboardPanelClassName,
  dashboardPrimaryActionClassName,
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
  const [recentTransactions, setRecentTransactions] = useState(
    data.recentTransactions.slice(0, 6)
  );
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
    setRecentTransactions(data.recentTransactions.slice(0, 6));
  }, [data.recentTransactions]);

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

  return (
    <section className="space-y-3">
      <section className="grid items-stretch gap-3 xl:grid-cols-3">
        <SpendingByCategoryPanel
          categories={knownCategories}
          categorizedSpendTotal={knownSpendTotal}
          maxCategorySpend={maxKnownCategorySpend}
          topCategory={topCategory}
          sectionStatus={data.sectionStatus.categories}
          uncategorizedCategory={uncategorizedCategory}
        />
        <FrequentRecipientsPanel
          recipients={frequentRecipientRows}
          displayRange={displayRange}
        />
        <LargestTransactionsPanel
          transactions={data.recentLargeTransactions}
          displayRange={displayRange}
        />
      </section>

      <section>
        <RecentTransactionsPanel
          transactions={recentTransactions}
          range={data.range}
          transactionStatus={data.sectionStatus.transactions}
          summary={recentSummary}
          isLoading={isRefreshing}
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
  href,
  hrefLabel,
}: {
  title: string;
  description: string;
  trailing?: ReactNode;
  href?: string;
  hrefLabel?: string;
}) {
  const content = (
    <>
      <div className="min-w-0 space-y-1.5">
        <CardTitle className="text-[1.1rem] font-semibold normal-case tracking-normal text-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary">
          <span className="decoration-primary/80 underline-offset-4 transition-[text-decoration-color] group-hover:underline group-focus-visible:underline">
            {title}
          </span>
        </CardTitle>
        <p className="min-h-[28px] text-sm leading-5 text-secondary-foreground">{description}</p>
      </div>
      <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-secondary-foreground transition-colors group-hover:text-primary group-focus-visible:text-primary" />
    </>
  );

  return (
    <CardHeader className="pb-3">
      {href ? (
        <Link
          href={href}
          aria-label={hrefLabel ?? `Open ${title}`}
          className="group -mx-2 flex cursor-pointer items-start justify-between gap-3 rounded-[8px] px-2 py-1.5 transition-colors hover:bg-background/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {content}
        </Link>
      ) : (
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <CardTitle className="text-[1.1rem] font-semibold normal-case tracking-normal text-foreground">
              {title}
            </CardTitle>
            <p className="min-h-[28px] text-sm leading-5 text-secondary-foreground">{description}</p>
          </div>
        </div>
      )}
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
  uncategorizedCategory,
}: {
  categories: DashboardPageData["spendingByCategory"];
  categorizedSpendTotal: number;
  maxCategorySpend: number;
  topCategory: string | null;
  sectionStatus: DashboardPageData["sectionStatus"]["categories"];
  uncategorizedCategory: DashboardPageData["spendingByCategory"][number] | null;
}) {
  const router = useRouter();

  return (
    <Card className={cn(dashboardPanelClassName, "flex min-h-[470px] flex-col")}>
      <AlignedPanelHeader
        title="Where your money went"
        description="Known categories only"
        href="/transactions"
        hrefLabel="Open transactions"
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
              <Table className="table-fixed">
                <TableHeader layout={dashboardTableLayouts.spendingByCategory} />
                <TableBody>
                {categories.slice(0, 5).map((item, index) => {
                  const share = getCategoryShare(item.totalSpend, categorizedSpendTotal);
                  const isTop = item.category === topCategory;

                  return (
                    <TableRow
                      key={item.category}
                      tabIndex={0}
                      role="link"
                      className={cn(
                        "cursor-pointer hover:bg-secondary/18",
                        index > 0 && "border-t border-border/40"
                      )}
                      onClick={(event) =>
                        handleLinkRowClick(
                          event,
                          buildTransactionsHref({ category: item.category }),
                          router.push
                        )
                      }
                      onKeyDown={(event) =>
                        handleLinkRowKeyDown(
                          event,
                          buildTransactionsHref({ category: item.category }),
                          router.push
                        )
                      }
                    >
                      <TableCell className="overflow-hidden py-4">
                        <div className="flex min-w-0 items-start gap-2">
                          <span
                            className={cn(
                              "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                              isTop ? "bg-primary" : "bg-primary/65"
                            )}
                          />
                          <Link
                            href={buildTransactionsHref({ category: item.category })}
                            className="block min-w-0 truncate font-medium leading-5 text-foreground"
                            onClick={(event) => event.stopPropagation()}
                          >
                            {item.category}
                          </Link>
                        </div>
                        <div className="mt-2 h-1.5 rounded-full bg-secondary/20">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{
                              width: `${Math.max(4, (item.totalSpend / maxCategorySpend) * 100)}%`,
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell className="py-4 text-right font-medium tabular-nums text-foreground">
                        {formatCurrency(item.totalSpend)}
                      </TableCell>
                      <TableCell className="py-4 text-right font-medium text-secondary-foreground">
                        {share}%
                      </TableCell>
                    </TableRow>
                  );
                })}
                </TableBody>
              </Table>
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
                    href={buildTransactionsHref({ status: "uncategorized" })}
                    className={cn(
                      dashboardPrimaryActionClassName,
                      "cursor-pointer border border-accent/35 bg-accent text-accent-foreground transition-colors hover:brightness-105"
                    )}
                  >
                    Review
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        )}
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
  const router = useRouter();

  return (
    <Card className={cn(dashboardPanelClassName, "flex min-h-[470px] flex-col")}>
      <AlignedPanelHeader
        title="Frequent recipients"
        description={`Most repeated recipients in ${displayRange}.`}
        href="/recipients"
      />
      <CardContent className="flex flex-1 flex-col">
        {recipients.length === 0 ? (
          <EmptyPanel title="No repeated recipients in this period." />
        ) : (
          <div className={dashboardInnerTableClassName}>
            <Table className="table-fixed">
              <TableHeader layout={dashboardTableLayouts.frequentRecipients} />
              <TableBody>
              {recipients.map((recipient, index) => (
                <TableRow
                  key={recipient.recipient}
                  tabIndex={0}
                  role="link"
                  className={cn(
                    "cursor-pointer hover:bg-secondary/18",
                    index > 0 && "border-t border-border/40"
                  )}
                  onClick={(event) =>
                    handleLinkRowClick(event, recipient.href, router.push)
                  }
                  onKeyDown={(event) =>
                    handleLinkRowKeyDown(event, recipient.href, router.push)
                  }
                >
                  <TableCell className="overflow-hidden py-4 font-medium text-foreground">
                    <Link
                      href={recipient.href}
                      className="block truncate"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {recipient.recipient}
                    </Link>
                  </TableCell>
                  <TableCell className="py-4 text-right text-secondary-foreground">
                    {recipient.paymentCount}
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(recipient.totalAmount)}
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LargestTransactionsPanel({
  transactions,
  displayRange,
}: {
  transactions: DashboardPageData["recentLargeTransactions"];
  displayRange: string;
}) {
  const router = useRouter();

  return (
    <Card className={cn(dashboardPanelClassName, "flex min-h-[470px] flex-col")}>
      <AlignedPanelHeader
        title="Largest transactions"
        description={`Highest-value transactions inside ${displayRange}.`}
        href="/transactions"
      />
      <CardContent className="flex flex-1 flex-col">
        {transactions.length === 0 ? (
          <EmptyPanel title="No large transactions in this period." />
        ) : (
          <div className={dashboardInnerTableClassName}>
            <Table className="table-fixed">
              <TableHeader layout={dashboardTableLayouts.largestTransactions} />
              <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow
                  key={transaction.uuid}
                  tabIndex={0}
                  role="link"
                  className={cn(
                    "cursor-pointer hover:bg-secondary/18",
                    index > 0 && "border-t border-border/40"
                  )}
                  onClick={(event) =>
                    handleLinkRowClick(
                      event,
                      buildLargestTransactionHref(transaction.id),
                      router.push
                    )
                  }
                  onKeyDown={(event) =>
                    handleLinkRowKeyDown(
                      event,
                      buildLargestTransactionHref(transaction.id),
                      router.push
                    )
                  }
                >
                  <TableCell className="overflow-hidden py-4">
                    <Link
                      href={buildLargestTransactionHref(transaction.id)}
                      className="block truncate font-medium text-foreground"
                      onClick={(event) => event.stopPropagation()}
                    >
                      {transaction.recipient}
                    </Link>
                    <p className="mt-0.5 truncate text-xs text-secondary-foreground">
                      {transaction.category ?? "Uncategorized"}
                    </p>
                  </TableCell>
                  <TableCell className="py-4 text-secondary-foreground">
                    {formatShortDate(transaction.timestamp)}
                  </TableCell>
                  <TableCell className="py-4 text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                </TableRow>
              ))}
              </TableBody>
            </Table>
          </div>
        )}
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
  quickTagOptions,
  pendingTransactionId,
  assignmentErrorTransactionId,
  onQuickTag,
  openCategoryMenuTransactionId,
  onToggleCategoryMenu,
  categoryMenuRef,
  displayRange,
}: {
  transactions: DashboardPageData["recentTransactions"];
  range: DashboardPageData["range"];
  transactionStatus: DashboardPageData["sectionStatus"]["transactions"];
  summary: string;
  isLoading: boolean;
  quickTagOptions: Array<{ id: number; label: string }>;
  pendingTransactionId: number | null;
  assignmentErrorTransactionId: number | null;
  onQuickTag: (transactionId: number, categoryId: number) => Promise<void>;
  openCategoryMenuTransactionId: number | null;
  onToggleCategoryMenu: (transactionId: number) => void;
  categoryMenuRef: RefObject<HTMLDivElement | null>;
  displayRange: string;
}) {
  const router = useRouter();

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
        {transactions.length === 0 ? (
          <EmptyPanel
            title="No recent transactions in this period."
            helper={
              transactionStatus === "empty"
                ? "Import or add transactions to populate recent activity."
                : undefined
            }
          />
        ) : (
          <div className={dashboardInnerTableClassName}>
            <Table className="min-w-[860px]">
              <TableHeader layout={dashboardTableLayouts.recentTransactions} />
              <TableBody>
              {transactions.map((transaction, index) => {
                const meta = buildRecentTransactionMeta(transaction.category, transaction.timestamp);
                const isPending = pendingTransactionId === transaction.id;
                const hasAssignmentError = assignmentErrorTransactionId === transaction.id;
                const isCategoryMenuOpen =
                  openCategoryMenuTransactionId === transaction.id;

                return (
                  <TableRow
                    key={transaction.uuid}
                    className={cn(
                      "cursor-pointer items-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                      index > 0 && "border-t border-border/40"
                    )}
                    role="link"
                    tabIndex={0}
                    onClick={(event) =>
                      handleLinkRowClick(
                        event,
                        `/transactions/${transaction.id}`,
                        router.push
                      )
                    }
                    onKeyDown={(event) =>
                      handleLinkRowKeyDown(
                        event,
                        `/transactions/${transaction.id}`,
                        router.push
                      )
                    }
                  >
                    <TableCell className="py-4 text-secondary-foreground">
                      <span className="block text-sm font-medium text-foreground">
                        {meta.dateLabel}
                      </span>
                      <span className="mt-1 block text-xs tracking-[0.01em] text-secondary-foreground/88">
                        {meta.timeLabel}
                      </span>
                    </TableCell>
                    <TableCell className="py-4">
                      <Link
                        href={`/transactions/${transaction.id}`}
                        onClick={(event) => event.stopPropagation()}
                        className="block truncate pr-3 text-[15px] font-medium leading-6 text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {transaction.recipient}
                      </Link>
                    </TableCell>
                    <TableCell className="py-4 text-right font-semibold tabular-nums text-foreground">
                      {formatCurrency(transaction.amount)}
                    </TableCell>
                    <TableCell className="py-4">
                      {meta.needsCategory ? (
                        <div className="w-full max-w-[220px] space-y-2">
                          <div
                            ref={isCategoryMenuOpen ? categoryMenuRef : undefined}
                            className="relative w-full"
                          >
                            <Button
                              type="button"
                              variant="secondary"
                              onClick={(event) => {
                                event.stopPropagation();
                                onToggleCategoryMenu(transaction.id);
                              }}
                              onKeyDown={(event) => event.stopPropagation()}
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
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        void onQuickTag(transaction.id, option.id);
                                      }}
                                      onKeyDown={(event) => event.stopPropagation()}
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
                    </TableCell>
                  </TableRow>
                );
              })}
              </TableBody>
            </Table>
          </div>
        )}
        <FooterActions>
          <PanelFooterLink
            href={buildTransactionsHref(getRangeParams(range))}
            label="View all activity"
            className={dashboardFooterSecondaryLinkClassName}
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
    columnWidths?: string[];
  };
}) {
  return (
    <SemanticTableHeader className="border-b border-border/40 bg-background/16">
      <TableRow className="hover:bg-transparent">
      {layout.columns.map((column, index) => (
        <TableHead
          key={column}
          className={cn(
            layout.rightAlignedColumns?.includes(index) && "text-right",
            layout.centerAlignedColumns?.includes(index) && "text-center"
          )}
          style={
            layout.columnWidths?.[index]
              ? { width: layout.columnWidths[index] }
              : undefined
          }
        >
          {column}
        </TableHead>
      ))}
      </TableRow>
    </SemanticTableHeader>
  );
}

function PanelFooterLink({
  href,
  label,
  className,
}: {
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(className ?? dashboardFooterLinkClassName, "cursor-pointer")}
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
