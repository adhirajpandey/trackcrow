import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, CheckCircle2, Clock3, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import { DashboardTimeframePicker } from "./dashboard-timeframe-picker";
import {
  buildRecentTransactionMeta,
  buildRecentTransactionsSummary,
  buildDashboardInsights,
  buildMetricComparisons,
  buildChartTicks,
  buildPeriodTransactionsHref,
  buildReviewQueueCard,
  buildTransactionsHref,
  chartLegendItems,
  formatDashboardRangeLabel,
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
  getRangeParams,
  getTopCategoryInsight,
} from "./dashboard-view-model";

export function DashboardPageView({ data }: { data: DashboardPageData }) {
  const hasTransactions = data.summary.transactionCount > 0;
  const maxCategorySpend = Math.max(
    ...data.spendingByCategory.map((item) => item.totalSpend),
    1
  );
  const chartTicks = buildChartTicks(
    Math.max(...data.spendingByPeriod.map((item) => item.totalSpend), 1)
  );
  const chartMax = chartTicks[chartTicks.length - 1]?.value ?? 0;
  const periodLabelStep = getPeriodLabelStep(data.spendingByPeriod.length);
  const peakPeriod = getPeakPeriod(data.spendingByPeriod);
  const latestPeriod = data.spendingByPeriod[data.spendingByPeriod.length - 1] ?? null;
  const averagePeriodSpend = getAveragePeriodSpend(data.spendingByPeriod);
  const topCategoryInsight = getTopCategoryInsight(
    data.spendingByCategory,
    data.summary.totalSpend
  );
  const rangeParams = getRangeParams(data.range);
  const reviewQueue = buildReviewQueueCard({
    summary: data.summary,
    importHealth: data.importHealth,
    largeTransactionCount: data.largeTransactionCount,
    range: data.range,
  });
  const insights = buildDashboardInsights({
    summary: data.summary,
    comparison: data.comparison,
    periods: data.spendingByPeriod,
    categories: data.spendingByCategory,
    importHealth: data.importHealth,
    largeTransactionCount: data.largeTransactionCount,
  });
  const metricComparisons = buildMetricComparisons({
    summary: data.summary,
    comparison: data.comparison,
    categories: data.spendingByCategory,
  });
  const displayRange = formatDashboardRangeLabel(data.range);

  return (
    <div className="space-y-4">
      <section className="border-b border-border pb-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h1 className="max-w-2xl text-[32px] font-bold leading-tight text-foreground lg:text-4xl">
                Dashboard
              </h1>
              <p className="mt-2 text-sm font-semibold text-secondary-foreground">
                {displayRange}
              </p>
            </div>
            <div className="shrink-0 self-start">
              <DashboardTimeframePicker
                key={`${data.range.value}-${data.range.startDate ?? ""}-${data.range.endDate ?? ""}`}
                value={data.range.value}
                startDate={data.range.startDate}
                endDate={data.range.endDate}
              />
            </div>
          </div>
          <p className="max-w-2xl text-sm leading-6 text-secondary-foreground">
            See where your money went and what needs a quick check.
          </p>
        </div>
      </section>

      {data.status === "error" ? (
        <section className="rounded-lg border border-destructive/70 bg-destructive/10 p-4 text-sm text-foreground">
          {data.message}
        </section>
      ) : null}

      <section className="space-y-4">
        <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <MetricLink
            href={buildTransactionsHref(rangeParams)}
            label="Total spent"
            value={formatCompactCurrency(data.summary.totalSpend)}
            helper={`${formatCurrency(data.summary.totalSpend)} across ${formatNumber(
              data.summary.transactionCount
            )} transactions`}
            comparison={metricComparisons.totalSpend}
            tone="primary"
          />
          <MetricLink
            href={buildTransactionsHref(rangeParams)}
            label="Average spend"
            value={formatCompactCurrency(data.summary.averageSpend)}
            helper={`Across ${formatNumber(data.summary.transactionCount)} transactions`}
            comparison={metricComparisons.averageSpend}
            tone="secondary"
          />
          <MetricLink
            href={
              topCategoryInsight
                ? buildTransactionsHref({
                    ...rangeParams,
                    category: topCategoryInsight.category,
                  })
                : "/categories"
            }
            label="Biggest category"
            value={topCategoryInsight?.category ?? "Not ready yet"}
            helper={
              topCategoryInsight
                ? `${topCategoryInsight.share}% of spending \u00b7 ${formatCompactCurrency(
                    topCategoryInsight.totalSpend
                  )}`
                : "Categorize spending to see your top category."
            }
            comparison={metricComparisons.biggestCategory}
            tone="insight"
          />
          <ReviewQueueCard card={reviewQueue} />
        </section>

        <SpendingTrendPanel
          periods={data.spendingByPeriod}
          peakPeriod={peakPeriod}
          latestPeriod={latestPeriod}
          averagePeriodSpend={averagePeriodSpend}
          chartTicks={chartTicks}
          chartMax={chartMax}
          periodLabelStep={periodLabelStep}
          granularity={data.range.granularity}
          hasTransactions={hasTransactions}
        />

        <InsightsPanel insights={insights} />

        <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
          <SpendingByCategoryPanel
            categories={data.spendingByCategory}
            totalSpend={data.summary.totalSpend}
            maxCategorySpend={maxCategorySpend}
            topCategory={topCategoryInsight?.category ?? null}
            range={data.range}
          />
          <LargestTransactionsPanel
            transactions={data.recentLargeTransactions}
            range={data.range}
          />
        </section>

        <RecentTransactionsPanel
          transactions={data.recentTransactions}
          range={data.range}
        />
      </section>
    </div>
  );
}

function ReviewQueueCard({
  card,
}: {
  card: ReturnType<typeof buildReviewQueueCard>;
}) {
  return (
    <Link
      href={card.href}
      className="group min-h-[164px] rounded-lg border border-accent/45 bg-accent/8 p-4 transition-colors hover:border-accent/70 hover:bg-accent/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-card-foreground">{card.title}</p>
          <p className="mt-1 text-xs text-secondary-foreground/80">
            {card.totalReviewCount > 0
              ? `${formatNumber(card.totalReviewCount)} open checks`
              : "No open checks"}
          </p>
        </div>
        {card.hasItems ? (
          <Clock3 className="h-5 w-5 text-accent" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
        )}
      </div>
      <div className="mt-4 grid gap-2">
        {card.badges.map((badge) => (
          <div
            key={badge.label}
            className="flex items-center justify-between gap-3 rounded-md bg-card/60 px-3 py-2"
          >
            <span className="text-xs font-semibold text-secondary-foreground">
              {badge.label}
            </span>
            <Badge tone={badge.tone}>{formatNumber(badge.count)}</Badge>
          </div>
        ))}
        {card.helper ? (
          <p className="text-sm leading-5 text-secondary-foreground/80">{card.helper}</p>
        ) : null}
      </div>
      <div className="mt-4 inline-flex min-h-9 items-center gap-2 rounded-md bg-primary px-3 text-sm font-semibold text-primary-foreground transition-colors group-hover:bg-primary/90">
        {card.hasItems ? "Review queue" : card.action}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

function MetricLink({
  href,
  label,
  value,
  helper,
  comparison,
  tone,
}: {
  href: string;
  label: string;
  value: string;
  helper: string;
  comparison: string;
  tone: "primary" | "secondary" | "insight";
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group min-h-[164px] rounded-lg border bg-card p-4 transition-colors hover:bg-secondary/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone === "primary" && "border-primary/20 bg-primary/4",
        tone !== "primary" && "border-border/65"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-secondary-foreground">{label}</p>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p
        className={cn(
          "mt-3 break-words font-semibold leading-tight tabular-nums",
          tone === "primary" && "text-4xl text-primary",
          tone === "secondary" && "text-4xl text-foreground",
          tone === "insight" && "text-3xl text-foreground"
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-2 text-xs font-semibold",
          comparison.startsWith("+")
            ? "text-info"
            : comparison.startsWith("-")
              ? "text-accent"
              : "text-secondary-foreground/85"
        )}
      >
        {comparison}
      </p>
      <p className="mt-1 text-sm leading-5 text-secondary-foreground/80">{helper}</p>
    </Link>
  );
}

function InsightsPanel({
  insights,
}: {
  insights: ReturnType<typeof buildDashboardInsights>;
}) {
  return (
    <section className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-4">
      {insights.map((insight) => (
        <div
          key={insight.label}
          className="rounded-lg border border-transparent bg-muted/24 px-4 py-3 transition-colors hover:bg-muted/36 focus-within:bg-muted/36"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-secondary-foreground/85">
            <Sparkles className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {insight.label}
          </div>
          <p className="mt-3 text-sm font-semibold leading-5 text-foreground">
            {insight.value}
          </p>
          <p className="mt-1 text-xs leading-5 text-secondary-foreground/75">
            {insight.helper}
          </p>
        </div>
      ))}
    </section>
  );
}

function SpendingTrendPanel({
  periods,
  peakPeriod,
  latestPeriod,
  averagePeriodSpend,
  chartTicks,
  chartMax,
  periodLabelStep,
  granularity,
  hasTransactions,
}: {
  periods: DashboardPageData["spendingByPeriod"];
  peakPeriod: DashboardPageData["spendingByPeriod"][number] | null;
  latestPeriod: DashboardPageData["spendingByPeriod"][number] | null;
  averagePeriodSpend: number;
  chartTicks: ReturnType<typeof buildChartTicks>;
  chartMax: number;
  periodLabelStep: number;
  granularity: DashboardPageData["range"]["granularity"];
  hasTransactions: boolean;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader className="space-y-3 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div>
              <CardTitle className="text-sm font-semibold normal-case tracking-normal">
                Spending trend
              </CardTitle>
              <p className="mt-1 text-sm text-secondary-foreground">
              Compare spending across this period.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {chartLegendItems.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-secondary-foreground"
                >
                  <span className={cn("h-2.5 w-2.5 rounded-sm", item.className)} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-2 text-sm xl:justify-end">
            <SummaryChip
              label="Peak"
              content={
                peakPeriod
                  ? `${formatPeriod(peakPeriod.period)} \u00b7 ${formatCompactCurrency(
                      peakPeriod.totalSpend
                    )}`
                  : "No data"
              }
            />
            <SummaryChip
              label="Latest"
              content={
                latestPeriod
                  ? `${formatPeriod(latestPeriod.period)} \u00b7 ${formatCompactCurrency(
                      latestPeriod.totalSpend
                    )}`
                  : "No data"
              }
            />
            <SummaryChip label="Average" content={formatCompactCurrency(averagePeriodSpend)} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="min-w-0">
        {!hasTransactions || periods.length === 0 ? (
          <EmptyPanel
            icon={<BarChart3 className="h-5 w-5" />}
            title="No spending found for this period."
            helper="Try a different timeframe or import transactions."
          />
        ) : (
          <div className="grid h-[460px] min-w-0 grid-cols-[4.25rem_minmax(0,1fr)] gap-3 rounded-lg bg-muted/18 p-3">
            <div className="relative h-full pb-12 pt-1">
              {chartTicks.map((tick) => (
                <div
                  key={`${tick.ratio}-${tick.value}`}
                  className="absolute right-0 translate-y-1/2 text-right text-xs font-semibold text-secondary-foreground tabular-nums"
                  style={{ bottom: `calc(3rem + ${tick.ratio * 100}% - ${tick.ratio * 3}rem)` }}
                >
                  {formatCompactCurrency(tick.value)}
                </div>
              ))}
            </div>
            <div className="relative min-w-0 pb-12 pt-1">
              {chartTicks.map((tick) => (
                <div
                  key={`grid-${tick.ratio}-${tick.value}`}
                  className="pointer-events-none absolute inset-x-0 border-t border-border/45"
                  style={{ bottom: `calc(3rem + ${tick.ratio * 100}% - ${tick.ratio * 3}rem)` }}
                />
              ))}
              {averagePeriodSpend > 0 && chartMax > 0 ? (
                <div
                  className="pointer-events-none absolute inset-x-0 border-t border-dashed border-info/55"
                  style={{
                    bottom: `calc(3rem + ${(averagePeriodSpend / chartMax) * 100}% - ${
                      (averagePeriodSpend / chartMax) * 3
                    }rem)`,
                  }}
                />
              ) : null}
              <div
                className="grid h-full min-w-0 items-end gap-2"
                style={{
                  gridTemplateColumns: `repeat(${Math.max(periods.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                {periods.map((item, index) => {
                  const label = formatPeriodLabel(item.period);
                  const isPeak = peakPeriod?.period === item.period;
                  const isLatest = latestPeriod?.period === item.period;
                  const showLabel =
                    index === 0 ||
                    index === periods.length - 1 ||
                    index % periodLabelStep === 0;
                  const href = buildPeriodTransactionsHref(item.period, granularity);

                  return (
                    <Link
                      key={item.period}
                      href={href}
                      className="group relative flex h-full min-w-0 flex-col items-center justify-end gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                      aria-label={`${formatPeriod(item.period)}: ${formatCurrency(
                        item.totalSpend
                      )}, ${formatNumber(item.transactionCount)} transactions`}
                    >
                      <span className="pointer-events-none absolute bottom-[calc(3rem+100%)] z-10 hidden w-40 -translate-y-2 rounded-md border border-border bg-popover px-2 py-1.5 text-center text-xs text-popover-foreground shadow-lg group-hover:block group-focus-visible:block">
                        {formatPeriod(item.period)}: {formatCurrency(item.totalSpend)}
                        <span className="block text-muted-foreground">
                          {formatNumber(item.transactionCount)} transactions
                        </span>
                      </span>
                      <span className="flex h-[calc(100%-3rem)] w-full items-end rounded-sm bg-secondary/55">
                        <span
                          className={cn(
                            "w-full rounded-sm transition-[background-color,filter] group-hover:brightness-110 group-focus-visible:brightness-110",
                            isPeak && "bg-accent shadow-[0_0_10px_rgba(242,184,75,0.18)]",
                            isLatest && !isPeak && "bg-info",
                            !isPeak && !isLatest && "bg-primary/85 group-hover:bg-primary"
                          )}
                          style={{
                            height: `${
                              chartMax > 0 ? Math.max(4, (item.totalSpend / chartMax) * 100) : 4
                            }%`,
                          }}
                        />
                      </span>
                      <span className="flex h-10 items-start justify-center text-center text-xs font-semibold leading-tight text-secondary-foreground">
                        {showLabel ? (
                          <span>
                            <span className="block">{label.primary}</span>
                            {label.secondary ? (
                              <span className="block text-[11px] text-secondary-foreground/75">
                                {label.secondary}
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
        )}
      </CardContent>
    </Card>
  );
}

function SummaryChip({
  label,
  content,
}: {
  label: string;
  content: string;
}) {
  return (
    <div className="min-w-[92px] rounded-md bg-muted/28 px-3 py-2.5 text-right">
      <p className="text-[10px] font-semibold text-secondary-foreground/80">{label}</p>
      <p className="mt-1 text-xs font-semibold text-foreground tabular-nums">{content}</p>
    </div>
  );
}

function SpendingByCategoryPanel({
  categories,
  totalSpend,
  maxCategorySpend,
  topCategory,
  range,
}: {
  categories: DashboardPageData["spendingByCategory"];
  totalSpend: number;
  maxCategorySpend: number;
  topCategory: string | null;
  range: DashboardPageData["range"];
}) {
  const rangeParams = getRangeParams(range);

  return (
    <Card className="min-w-0">
      <CardHeader>
            <CardTitle className="normal-case tracking-normal">Where your money went</CardTitle>
        <p className="mt-2 text-sm text-secondary-foreground">
          See which categories make up your spending.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <EmptyPanel
            title="No categorized spending yet."
            helper="Categorize spending to see your top category."
          />
        ) : (
          categories.map((item) => {
            const share = getCategoryShare(item.totalSpend, totalSpend);
            const isTop = item.category === topCategory;
            const isUncategorized = item.category === "Uncategorized";

            return (
              <Link
                key={item.category}
                href={buildTransactionsHref({
                  ...rangeParams,
                  category: isUncategorized ? null : item.category,
                  status: isUncategorized ? "uncategorized" : null,
                })}
                className={cn(
                  "group block rounded-lg bg-muted/22 p-3 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  isTop && "bg-primary/6",
                  isUncategorized && "bg-accent/8"
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex min-w-0 flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-card-foreground">
                        {item.category}
                      </p>
                      {isTop ? <Badge tone="primary">Largest</Badge> : null}
                      {isUncategorized ? <Badge tone="attention">Needs category</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-secondary-foreground">
                      {formatNumber(item.transactionCount)} transactions {"\u00b7"} {share}% of spending
                    </p>
                  </div>
                  <span className="font-mono text-sm text-secondary-foreground tabular-nums">
                    {formatCurrency(item.totalSpend)}
                  </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-secondary">
                  <div
                    className={cn(
                      "h-2 rounded-full",
                      isUncategorized ? "bg-accent" : "bg-primary"
                    )}
                    style={{
                      width: `${Math.max(4, (item.totalSpend / maxCategorySpend) * 100)}%`,
                    }}
                  />
                </div>
              </Link>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}

function LargestTransactionsPanel({
  transactions,
  range,
}: {
  transactions: DashboardPageData["recentLargeTransactions"];
  range: DashboardPageData["range"];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="normal-case tracking-normal">Largest transactions</CardTitle>
            <p className="mt-2 text-sm text-secondary-foreground">
              Highest-value transactions in this period.
            </p>
          </div>
          <Link
            href={buildTransactionsHref({
              ...getRangeParams(range),
              sortBy: "amount",
              sortOrder: "desc",
            })}
            className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-secondary/80 px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {transactions.length === 0 ? (
          <EmptyPanel title="No large transactions in this period." />
        ) : (
          transactions.map((transaction) => (
            <Link
              key={transaction.uuid}
              href={buildTransactionsHref({ transaction: transaction.uuid })}
              className="group flex items-start justify-between gap-3 rounded-md bg-muted/22 px-3 py-3 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {transaction.recipient}
                </span>
                <span className="mt-1 block truncate text-xs text-secondary-foreground">
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

function RecentTransactionsPanel({
  transactions,
  range,
}: {
  transactions: DashboardPageData["recentTransactions"];
  range: DashboardPageData["range"];
}) {
  const summary = buildRecentTransactionsSummary({
    transactionCount: transactions.length,
    uncategorizedCount: transactions.filter((transaction) => !transaction.category).length,
  });

  return (
    <Card>
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="normal-case tracking-normal">Recent transactions</CardTitle>
            <p className="mt-2 text-sm text-secondary-foreground">
              Latest activity in this period.
            </p>
            <p className="mt-2 text-xs font-medium text-secondary-foreground">{summary}</p>
          </div>
          <Link
            href={buildTransactionsHref(getRangeParams(range))}
            className="inline-flex min-h-9 shrink-0 items-center rounded-md bg-secondary/80 px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyPanel title="No recent transactions in this period." />
        ) : (
          <div className="overflow-hidden rounded-md bg-muted/16">
            {transactions.map((transaction, index) => {
              const meta = buildRecentTransactionMeta(
                transaction.category,
                transaction.timestamp
              );

              return (
                <Link
                  key={transaction.uuid}
                  href={buildTransactionsHref({ transaction: transaction.uuid })}
                  className={cn(
                    "group grid grid-cols-[minmax(0,1fr)_96px] items-center gap-4 px-4 py-2.5 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    index > 0 && "border-t border-border/60"
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {transaction.recipient}
                      </span>
                      <span className="shrink-0 text-xs text-secondary-foreground">
                        {meta.timestampLabel}
                      </span>
                    </span>
                    <span className="mt-0.5 block truncate text-xs text-secondary-foreground">
                      {meta.categoryLabel}
                    </span>
                  </span>
                  <span className="shrink-0 text-right font-mono text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(transaction.amount)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Badge({
  children,
  tone,
}: {
  children: string;
  tone: "primary" | "attention" | "warning" | "info";
}) {
  return (
    <span
      className={cn(
        "rounded-sm px-2 py-0.5 text-[10px] font-semibold",
        tone === "primary" && "bg-primary/15 text-primary",
        tone === "attention" && "bg-accent/15 text-accent",
        tone === "warning" && "bg-destructive/15 text-destructive",
        tone === "info" && "bg-info/15 text-info"
      )}
    >
      {children}
    </span>
  );
}

function EmptyPanel({
  icon,
  title,
  helper,
}: {
  icon?: ReactNode;
  title: string;
  helper?: string;
}) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-muted/35 p-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="rounded-md border border-border bg-secondary p-2 text-primary">
            {icon}
          </div>
        ) : null}
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {helper ? <p className="mt-1 text-sm text-secondary-foreground">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}
