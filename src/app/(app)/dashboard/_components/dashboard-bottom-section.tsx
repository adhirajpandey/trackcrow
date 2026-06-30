"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ArrowUpRight,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  buildLargestTransactionHref,
  dashboardTableLayouts,
} from "./dashboard-bottom-section-model";
import {
  dashboardAttentionPanelClassName,
  dashboardInnerTableClassName,
  dashboardPanelClassName,
  dashboardPrimaryActionClassName,
} from "./dashboard-style";
import { TransactionsTable } from "@/app/(app)/transactions/_components/transactions-table";
import {
  buildFrequentRecipientRows,
  buildTransactionsHref,
  formatCurrency,
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
  const recentTransactions = data.recentTransactions.slice(0, 10);
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
          <TransactionsTable
            rows={transactions}
            columns={["recipient", "timestamp", "amount"]}
            variant="compact"
            rowHref={(transaction) => buildLargestTransactionHref(transaction.id)}
            onNavigate={router.push}
            emptyTitle="No large transactions in this period."
          />
        )}
      </CardContent>
    </Card>
  );
}

function RecentTransactionsPanel({
  transactions,
  range,
  transactionStatus,
  displayRange,
}: {
  transactions: DashboardPageData["recentTransactions"];
  range: DashboardPageData["range"];
  transactionStatus: DashboardPageData["sectionStatus"]["transactions"];
  displayRange: string;
}) {
  const router = useRouter();

  return (
    <Card className={cn(dashboardPanelClassName, "flex flex-col")}>
      <AlignedPanelHeader
        title="Recent transactions"
        description={`Latest activity in ${displayRange}.`}
        href={buildTransactionsHref(getRangeParams(range))}
        hrefLabel="Open recent transactions"
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
          <TransactionsTable
            rows={transactions}
            columns={["timestamp", "recipient", "amount", "category", "subcategory"]}
            variant="embedded"
            rowHref={(transaction) => `/transactions/${transaction.id}`}
            onNavigate={router.push}
            emptyTitle="No recent transactions in this period."
          />
        )}
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
