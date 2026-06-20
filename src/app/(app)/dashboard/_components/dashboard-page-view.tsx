import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  ChevronDown,
  ReceiptText,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import {
  buildChartTicks,
  buildReviewItems,
  buildTransactionsHref,
  formatCompactCurrency,
  formatCurrency,
  formatNumber,
  formatPeriod,
  formatPeriodLabel,
  formatShortDate,
  getAveragePeriodSpend,
  getCategoryShare,
  getPeakPeriod,
  getPeriodLabelStep,
  getTopCategoryInsight,
} from "./dashboard-view-model";

export function DashboardPageView({ data }: { data: DashboardPageData }) {
  const hasTransactions = data.summary.transactionCount > 0;
  const reviewItems = buildReviewItems({
    summary: data.summary,
    importHealth: data.importHealth,
  });
  const maxCategorySpend = Math.max(
    ...data.spendingByCategory.map((item) => item.totalSpend),
    1
  );
  const maxPeriodSpend = Math.max(
    ...data.spendingByPeriod.map((item) => item.totalSpend),
    1
  );
  const chartTicks = buildChartTicks(maxPeriodSpend);
  const chartMax = Math.max(chartTicks[chartTicks.length - 1]?.value ?? 0, maxPeriodSpend);
  const periodLabelStep = getPeriodLabelStep(data.spendingByPeriod.length);
  const peakPeriod = getPeakPeriod(data.spendingByPeriod);
  const currentPeriod = data.spendingByPeriod[data.spendingByPeriod.length - 1] ?? null;
  const averagePeriodSpend = getAveragePeriodSpend(data.spendingByPeriod);
  const topCategoryInsight = getTopCategoryInsight(
    data.spendingByCategory,
    data.summary.totalSpend
  );
  const needsReviewShare = getCategoryShare(
    data.summary.uncategorizedCount,
    data.summary.transactionCount
  );

  return (
    <div className="space-y-6">
      <section className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-semibold uppercase text-primary">
                Dashboard
              </p>
              <button
                type="button"
                className="inline-flex min-h-9 items-center gap-2 rounded-md border border-input bg-secondary px-3 text-sm font-semibold text-secondary-foreground shadow-sm shadow-background/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label={`Current dashboard range: ${data.rangeLabel}`}
              >
                <span>{data.rangeLabel}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
            <h1 className="mt-4 max-w-2xl text-[32px] font-bold leading-tight text-foreground lg:text-4xl">
              Spending command center
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Review spend, imports, and transactions that need attention.
            </p>
          </div>
          <Link
            href={buildTransactionsHref({ status: "uncategorized" })}
            className="group inline-flex items-center justify-between gap-4 rounded-lg border border-accent/45 bg-accent/10 px-4 py-3 text-sm transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:min-w-72"
          >
            <span>
              <span className="block text-[11px] font-semibold uppercase text-accent">
                Needs review
              </span>
              <span className="mt-1 block text-lg font-semibold text-foreground">
                {formatNumber(data.summary.uncategorizedCount)} uncategorized
              </span>
              <span className="block text-xs text-muted-foreground">
                {needsReviewShare}% of transactions
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-accent transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {data.status === "error" ? (
        <section className="rounded-lg border border-destructive/70 bg-destructive/10 p-4 text-sm text-foreground">
          {data.message}
        </section>
      ) : null}

      <section className="space-y-4 rounded-lg border border-border/80 bg-muted/35 p-4 lg:p-5">
        <div className="grid gap-4 xl:grid-cols-[1.45fr_1fr_1fr_1fr]">
          <NeedsAttentionPanel items={reviewItems} />
          <MetricLink
            href={buildTransactionsHref({})}
            label="Total spend"
            value={formatCompactCurrency(data.summary.totalSpend)}
            helper={`${formatCurrency(data.summary.totalSpend)} across ${formatNumber(
              data.summary.transactionCount
            )} transactions`}
            tone="primary"
          />
          <MetricLink
            href={buildTransactionsHref({ metric: "average" })}
            label="Average transaction"
            value={formatCurrency(data.summary.averageSpend)}
            helper="Mean spend per transaction"
            tone="secondary"
          />
          <MetricLink
            href={
              topCategoryInsight
                ? buildTransactionsHref({ category: topCategoryInsight.category })
                : "/categories"
            }
            label="Top category"
            value={topCategoryInsight?.category ?? "No category"}
            helper={
              topCategoryInsight
                ? `${topCategoryInsight.share}% of spend, ${formatCompactCurrency(
                    topCategoryInsight.totalSpend
                  )}`
                : "Categorize transactions to see leaders"
            }
            tone="insight"
          />
        </div>

        {!hasTransactions ? (
          <EmptyDashboard />
        ) : (
          <>
            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.65fr)]">
              <SpendingOverTimePanel
                periods={data.spendingByPeriod}
                peakPeriod={peakPeriod}
                currentPeriod={currentPeriod}
                averagePeriodSpend={averagePeriodSpend}
                chartTicks={chartTicks}
                chartMax={chartMax}
                periodLabelStep={periodLabelStep}
              />
              <ImportHealthPanel importHealth={data.importHealth} />
            </section>

            <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.8fr)]">
              <SpendingByCategoryPanel
                categories={data.spendingByCategory}
                totalSpend={data.summary.totalSpend}
                maxCategorySpend={maxCategorySpend}
                topCategory={topCategoryInsight?.category ?? null}
              />
              <RecentLargeTransactionsPanel transactions={data.recentLargeTransactions} />
            </section>
          </>
        )}
      </section>
    </div>
  );
}

function NeedsAttentionPanel({
  items,
}: {
  items: ReturnType<typeof buildReviewItems>;
}) {
  return (
    <Card className="bg-card/95">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-4">
          <CardTitle>Needs attention</CardTitle>
          <AlertTriangle className="h-4 w-4 text-accent" />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {items.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className="group flex items-center justify-between gap-3 rounded-md border border-border/70 bg-muted/50 px-3 py-2.5 transition-colors hover:border-input hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-foreground">
                {item.label}
              </span>
              <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                {item.helper}
              </span>
            </span>
            <span
              className={cn(
                "shrink-0 rounded-sm px-2 py-1 text-sm font-semibold tabular-nums",
                item.tone === "attention" && "bg-accent/15 text-accent",
                item.tone === "danger" && "bg-destructive/15 text-destructive",
                item.tone === "info" && "bg-secondary text-secondary-foreground",
                item.tone === "neutral" && "bg-secondary text-muted-foreground"
              )}
            >
              {typeof item.value === "number" ? formatNumber(item.value) : item.value}
            </span>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}

function MetricLink({
  href,
  label,
  value,
  helper,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  helper: string;
  tone: "primary" | "secondary" | "insight";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group rounded-lg border border-border bg-card p-5 transition-colors hover:border-input focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone === "primary" && "border-primary/35 bg-primary/5",
        tone === "insight" && "bg-card/85"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold uppercase text-card-foreground">{label}</p>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p
        className={cn(
          "mt-5 break-words font-semibold leading-tight tabular-nums",
          tone === "primary" && "text-3xl text-primary",
          tone === "secondary" && "text-2xl text-foreground",
          tone === "insight" && "text-xl text-foreground"
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{helper}</p>
    </Link>
  );
}

function SpendingOverTimePanel({
  periods,
  peakPeriod,
  currentPeriod,
  averagePeriodSpend,
  chartTicks,
  chartMax,
  periodLabelStep,
}: {
  periods: DashboardPageData["spendingByPeriod"];
  peakPeriod: DashboardPageData["spendingByPeriod"][number] | null;
  currentPeriod: DashboardPageData["spendingByPeriod"][number] | null;
  averagePeriodSpend: number;
  chartTicks: ReturnType<typeof buildChartTicks>;
  chartMax: number;
  periodLabelStep: number;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Spending over time</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Monthly spend with peak, latest, and average context.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <SummaryChip
              label="Peak"
              value={peakPeriod ? formatCompactCurrency(peakPeriod.totalSpend) : "-"}
              helper={peakPeriod ? formatPeriod(peakPeriod.period) : "No data"}
            />
            <SummaryChip
              label="Latest"
              value={currentPeriod ? formatCompactCurrency(currentPeriod.totalSpend) : "-"}
              helper={currentPeriod ? formatPeriod(currentPeriod.period) : "No data"}
            />
            <SummaryChip
              label="Average"
              value={formatCompactCurrency(averagePeriodSpend)}
              helper="Per active month"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="grid h-[360px] min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-lg border border-border/80 bg-muted/45 p-4">
          <div className="relative h-full pb-12 pt-2">
            {chartTicks.map((tick) => (
              <div
                key={tick.ratio}
                className="absolute right-0 translate-y-1/2 text-right text-[11px] text-muted-foreground/75 tabular-nums"
                style={{ bottom: `calc(3rem + ${tick.ratio * 100}% - ${tick.ratio * 3}rem)` }}
              >
                {formatCompactCurrency(tick.value)}
              </div>
            ))}
          </div>
          <div className="relative min-w-0 pb-12 pt-2">
            {chartTicks.map((tick) => (
              <div
                key={`grid-${tick.ratio}`}
                className="pointer-events-none absolute inset-x-0 border-t border-border/30"
                style={{ bottom: `calc(3rem + ${tick.ratio * 100}% - ${tick.ratio * 3}rem)` }}
              />
            ))}
            {averagePeriodSpend > 0 ? (
              <div
                className="pointer-events-none absolute inset-x-0 border-t border-dashed border-info/45"
                style={{
                  bottom: `calc(3rem + ${(averagePeriodSpend / chartMax) * 100}% - ${
                    (averagePeriodSpend / chartMax) * 3
                  }rem)`,
                }}
              />
            ) : null}
            <div
              className="grid h-full min-w-0 items-end gap-1.5"
              style={{
                gridTemplateColumns: `repeat(${Math.max(periods.length, 1)}, minmax(0, 1fr))`,
              }}
            >
              {periods.map((item, index) => {
                const label = formatPeriodLabel(item.period);
                const isPeak = peakPeriod?.period === item.period;
                const isLatest = currentPeriod?.period === item.period;
                const showLabel =
                  index === 0 || index === periods.length - 1 || index % periodLabelStep === 0;
                const href = buildTransactionsHref({ month: item.period });

                return (
                  <Link
                    key={item.period}
                    href={href}
                    className="group relative flex h-full min-w-0 flex-col items-center justify-end gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${formatPeriod(item.period)}: ${formatCurrency(
                      item.totalSpend
                    )}, ${formatNumber(item.transactionCount)} transactions`}
                  >
                    <span className="pointer-events-none absolute bottom-[calc(3rem+100%)] z-10 hidden w-36 -translate-y-2 rounded-md border border-border bg-popover px-2 py-1.5 text-center text-xs text-popover-foreground shadow-lg group-hover:block group-focus-visible:block">
                      {formatPeriod(item.period)}: {formatCurrency(item.totalSpend)}
                      <span className="block text-muted-foreground">
                        {formatNumber(item.transactionCount)} transactions
                      </span>
                    </span>
                    <span className="flex h-[calc(100%-3rem)] w-full items-end rounded-sm bg-secondary/75">
                      <span
                        className={cn(
                          "w-full rounded-sm transition-colors",
                          isPeak && "bg-accent shadow-[0_0_18px_rgba(242,184,75,0.18)]",
                          isLatest && !isPeak && "bg-info",
                          !isPeak && !isLatest && "bg-primary/80 group-hover:bg-primary"
                        )}
                        style={{ height: `${Math.max(4, (item.totalSpend / chartMax) * 100)}%` }}
                      />
                    </span>
                    <span className="flex h-10 items-start justify-center text-center text-[11px] leading-tight text-muted-foreground">
                      {showLabel ? (
                        <span>
                          <span className="block">{label.month}</span>
                          {label.year ? (
                            <span className="block text-[10px] text-muted-foreground/70">
                              {label.year}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryChip({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-md border border-border bg-muted/60 px-3 py-2 text-right">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold text-foreground tabular-nums">{value}</p>
      <p className="mt-0.5 text-[11px] text-muted-foreground">{helper}</p>
    </div>
  );
}

function ImportHealthPanel({ importHealth }: { importHealth: DashboardPageData["importHealth"] }) {
  const issueCount = importHealth.failedCount + importHealth.unparseableCount;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import health</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          SMS imports that may need recovery.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <HealthRow label="Parsed" value={importHealth.parsedCount} tone="good" />
        <HealthRow label="Failed" value={importHealth.failedCount} tone="danger" />
        <HealthRow label="Unparseable" value={importHealth.unparseableCount} tone="attention" />
        <Link
          href="/imports/review"
          className="mt-2 inline-flex min-h-10 w-full items-center justify-between rounded-md border border-border bg-secondary px-3 text-sm font-semibold text-secondary-foreground hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Review imports
          <span className="tabular-nums">{formatNumber(issueCount)}</span>
        </Link>
      </CardContent>
    </Card>
  );
}

function HealthRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "good" | "danger" | "attention";
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-b-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-mono text-sm font-semibold tabular-nums",
          tone === "good" && "text-primary",
          tone === "danger" && "text-destructive",
          tone === "attention" && "text-accent"
        )}
      >
        {formatNumber(value)}
      </span>
    </div>
  );
}

function SpendingByCategoryPanel({
  categories,
  totalSpend,
  maxCategorySpend,
  topCategory,
}: {
  categories: DashboardPageData["spendingByCategory"];
  totalSpend: number;
  maxCategorySpend: number;
  topCategory: string | null;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>Spending by category</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Ranked category spend with review states surfaced inline.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.map((item) => {
          const share = getCategoryShare(item.totalSpend, totalSpend);
          const isTop = item.category === topCategory;
          const isUncategorized = item.category === "Uncategorized";

          return (
            <Link
              key={item.category}
              href={buildTransactionsHref({
                category: isUncategorized ? null : item.category,
                status: isUncategorized ? "uncategorized" : null,
              })}
              className={cn(
                "group block rounded-lg border border-transparent p-3 transition-colors hover:border-input hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                isTop && "border-primary/25 bg-primary/5",
                isUncategorized && "border-accent/35 bg-accent/10"
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="truncate text-sm font-semibold text-card-foreground">
                      {item.category}
                    </p>
                    {isTop ? <Badge tone="primary">Largest</Badge> : null}
                    {isUncategorized ? <Badge tone="attention">Review</Badge> : null}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {formatNumber(item.transactionCount)} transactions {"\u00b7"} {share}% of spend
                  </p>
                </div>
                <span className="font-mono text-sm text-muted-foreground tabular-nums">
                  {formatCurrency(item.totalSpend)}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-secondary">
                <div
                  className={cn(
                    "h-2 rounded-full",
                    isUncategorized ? "bg-accent" : "bg-primary"
                  )}
                  style={{ width: `${Math.max(4, (item.totalSpend / maxCategorySpend) * 100)}%` }}
                />
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}

function RecentLargeTransactionsPanel({
  transactions,
}: {
  transactions: DashboardPageData["recentLargeTransactions"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent large transactions</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
          Highest value transactions in the current range.
        </p>
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">
            No transactions to review in this range.
          </p>
        ) : (
          transactions.map((transaction) => (
            <Link
              key={transaction.uuid}
              href={buildTransactionsHref({ transaction: transaction.uuid })}
              className="group flex items-start justify-between gap-3 rounded-md border border-border/70 bg-muted/45 px-3 py-3 hover:border-input hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {transaction.recipient}
                </span>
                <span className="mt-1 block truncate text-xs text-muted-foreground">
                  {formatShortDate(transaction.timestamp)} {"\u00b7"} {transaction.category ?? "Uncategorized"}
                </span>
              </span>
              <span className="shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                {formatCurrency(transaction.amount)}
              </span>
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}

function Badge({ children, tone }: { children: string; tone: "primary" | "attention" }) {
  return (
    <span
      className={cn(
        "rounded-sm px-2 py-0.5 text-[10px] font-semibold uppercase",
        tone === "primary" && "bg-primary/15 text-primary",
        tone === "attention" && "bg-accent/15 text-accent"
      )}
    >
      {children}
    </span>
  );
}

function EmptyDashboard() {
  return (
    <section className="rounded-lg border border-dashed border-border bg-card p-8">
      <div className="flex max-w-2xl items-start gap-4">
        <div className="rounded-lg border border-border bg-secondary p-3 text-primary">
          <BarChart3 className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase text-primary">No transactions</p>
          <h2 className="mt-2 text-2xl font-bold">Dashboard data will appear here.</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Import SMS messages or add transactions, then review totals, attention queues,
            categories, and monthly trends here.
          </p>
          <Link
            href="/transactions"
            className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ReceiptText className="h-4 w-4" />
            Open transactions
          </Link>
        </div>
      </div>
    </section>
  );
}