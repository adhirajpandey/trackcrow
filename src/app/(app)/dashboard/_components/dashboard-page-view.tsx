import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Sparkles,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import { DashboardTimeframePicker } from "./dashboard-timeframe-picker";
import {
  buildChartBuckets,
  buildChartTicks,
  buildDashboardInsights,
  buildMetricComparisons,
  buildRecentTransactionMeta,
  buildRecentTransactionsSummary,
  buildReviewQueueCard,
  buildTransactionsHref,
  buildWhatChangedSummary,
  chartLegendItems,
  formatCompactCurrency,
  formatCurrency,
  formatDashboardRangeLabel,
  formatNumber,
  formatPeriod,
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
    categories: data.spendingByCategory,
    importIssueCount: data.importIssueCount,
    range: data.range,
    sectionStatus: data.sectionStatus,
  });
  const metricComparisons = buildMetricComparisons({
    summary: data.summary,
    comparison: data.comparison,
    categories: data.spendingByCategory,
  });
  const changeSummary = buildWhatChangedSummary({
    summary: data.summary,
    comparison: data.comparison,
  });
  const displayRange = formatDashboardRangeLabel(data.range);
  const chartBuckets = buildChartBuckets({
    periods: data.spendingByPeriod,
    peakPeriod,
    latestPeriod,
    averagePeriodSpend,
    chartMax,
    periodLabelStep,
    granularity: data.range.granularity,
  });

  return (
    <div className="space-y-5">
      <section className="border-b border-border/70 pb-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="space-y-3">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-primary/85">
                Spend operations
              </p>
              <h1 className="mt-2 max-w-2xl text-[34px] font-bold leading-tight text-foreground lg:text-[42px]">
                Dashboard
              </h1>
              <p className="mt-2 text-sm font-semibold text-secondary-foreground lg:text-[15px]">
                {displayRange}
              </p>
            </div>
            <p className="max-w-2xl text-[15px] leading-6 text-secondary-foreground">
              Track spending, spot spikes, and clear review items.
            </p>
          </div>
          <div className="shrink-0 self-start">
            <DashboardTimeframePicker
              value={data.range.value}
              startDate={data.range.startDate}
              endDate={data.range.endDate}
            />
          </div>
        </div>
      </section>

      {data.status === "error" ? (
        <section className="rounded-2xl border border-destructive/55 bg-destructive/10 p-4 text-sm text-foreground">
          {data.message}
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        <MetricLink
          href={buildTransactionsHref(rangeParams)}
          label="Total spent"
          value={formatCompactCurrency(data.summary.totalSpend, { style: "kpi" })}
          helper={`${formatCurrency(data.summary.totalSpend)} across ${formatNumber(
            data.summary.transactionCount
          )} transactions`}
          comparison={metricComparisons.totalSpend}
          tone="primary"
        />
        <MetricLink
          href={buildTransactionsHref(rangeParams)}
          label="Average spend"
          value={formatCompactCurrency(data.summary.averageSpend, { style: "kpi" })}
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
              ? `${topCategoryInsight.share}% of spending \u00b7 ${formatCurrency(
                  topCategoryInsight.totalSpend
                )}`
              : "Categorize spending to reveal the leading category."
          }
          comparison={metricComparisons.biggestCategory}
          tone="insight"
        />
        <ReviewQueueCard card={reviewQueue} />
      </section>

      <section className="grid gap-4 2xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.72fr)]">
        <SpendingTrendPanel
          periods={data.spendingByPeriod}
          peakPeriod={peakPeriod}
          latestPeriod={latestPeriod}
          averagePeriodSpend={averagePeriodSpend}
          chartTicks={chartTicks}
          chartMax={chartMax}
          chartBuckets={chartBuckets}
          hasTransactions={hasTransactions}
          changeSummary={changeSummary}
          comparisonStatus={data.sectionStatus.comparison}
        />
        <InsightsPanel insights={insights} />
      </section>

      <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,0.82fr)]">
        <SpendingByCategoryPanel
          categories={data.spendingByCategory}
          totalSpend={data.summary.totalSpend}
          maxCategorySpend={maxCategorySpend}
          topCategory={topCategoryInsight?.category ?? null}
          range={data.range}
          sectionStatus={data.sectionStatus.categories}
        />
        <LargestTransactionsPanel
          transactions={data.recentLargeTransactions}
          range={data.range}
        />
      </section>

      <RecentTransactionsPanel
        transactions={data.recentTransactions}
        range={data.range}
        transactionStatus={data.sectionStatus.transactions}
      />
    </div>
  );
}

function ReviewQueueCard({
  card,
}: {
  card: ReturnType<typeof buildReviewQueueCard>;
}) {
  return (
    <Card className="min-h-[148px] overflow-hidden border-border/70 bg-card/95 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
      <CardHeader className="space-y-3 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-card-foreground">{card.title}</p>
            <p className="mt-1 text-sm text-secondary-foreground">
              {card.hasItems
                ? `${formatNumber(card.totalReviewCount)} open items`
                : "No open review items"}
            </p>
          </div>
          {card.hasItems ? (
            <Clock3 className="h-5 w-5 text-accent" aria-hidden="true" />
          ) : (
            <CheckCircle2 className="h-5 w-5 text-primary" aria-hidden="true" />
          )}
        </div>
        <p className="text-sm leading-5 text-secondary-foreground">{card.helper}</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {card.tasks.map((task) => (
          <Link
            key={task.label}
            href={task.href}
            className="group flex items-center justify-between gap-3 rounded-xl bg-muted/26 px-3 py-3 transition-colors hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-foreground">{task.count} {task.label.toLowerCase()}</span>
              <span className="mt-1 block text-sm text-secondary-foreground">
                {task.helper}
              </span>
            </span>
            <span className="flex items-center gap-2">
              <Badge tone={task.tone}>{formatNumber(task.count)}</Badge>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
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
        "group min-h-[148px] rounded-2xl border bg-card px-4 py-4 transition-colors hover:bg-secondary/28 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone === "primary" && "border-primary/28 bg-primary/5",
        tone === "secondary" && "border-border/70",
        tone === "insight" && "border-border/55 bg-card/90"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-secondary-foreground">{label}</p>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p
        className={cn(
          "mt-4 break-words font-semibold leading-tight tabular-nums",
          tone === "primary" && "text-[2rem] text-primary",
          tone === "secondary" && "text-[2rem] text-foreground",
          tone === "insight" && "text-[1.75rem] text-foreground"
        )}
      >
        {value}
      </p>
      <p
        className={cn(
          "mt-2 text-sm font-semibold",
          comparison.startsWith("+")
            ? "text-info"
            : comparison.startsWith("-")
              ? "text-accent"
              : "text-secondary-foreground/90"
        )}
      >
        {comparison}
      </p>
      <p className="mt-2 text-sm leading-5 text-secondary-foreground">{helper}</p>
    </Link>
  );
}

function InsightsPanel({
  insights,
}: {
  insights: ReturnType<typeof buildDashboardInsights>;
}) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 2xl:grid-cols-1">
      {insights.map((insight) => {
        const className = cn(
          "rounded-2xl px-4 py-4 transition-colors",
          insight.href
            ? "bg-muted/24 hover:bg-muted/38 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            : "bg-muted/18",
          insight.tone === "attention" && "bg-accent/8",
          insight.tone === "info" && "bg-info/8"
        );

        const content = (
          <>
            <div className="flex items-center gap-2 text-sm font-semibold text-secondary-foreground">
              <Sparkles className="h-4 w-4 text-primary" aria-hidden="true" />
              {insight.label}
            </div>
            <p className="mt-3 text-base font-semibold leading-6 text-foreground">
              {insight.value}
            </p>
            <p className="mt-1 text-sm leading-5 text-secondary-foreground">
              {insight.helper}
            </p>
          </>
        );

        return insight.href ? (
          <Link key={insight.label} href={insight.href} className={className}>
            {content}
          </Link>
        ) : (
          <div key={insight.label} className={className}>
            {content}
          </div>
        );
      })}
    </div>
  );
}

function SpendingTrendPanel({
  periods,
  peakPeriod,
  latestPeriod,
  averagePeriodSpend,
  chartTicks,
  chartMax,
  chartBuckets,
  hasTransactions,
  changeSummary,
  comparisonStatus,
}: {
  periods: DashboardPageData["spendingByPeriod"];
  peakPeriod: DashboardPageData["spendingByPeriod"][number] | null;
  latestPeriod: DashboardPageData["spendingByPeriod"][number] | null;
  averagePeriodSpend: number;
  chartTicks: ReturnType<typeof buildChartTicks>;
  chartMax: number;
  chartBuckets: ReturnType<typeof buildChartBuckets>;
  hasTransactions: boolean;
  changeSummary: ReturnType<typeof buildWhatChangedSummary>;
  comparisonStatus: DashboardPageData["sectionStatus"]["comparison"];
}) {
  return (
    <Card className="min-w-0 overflow-hidden border-border/70 bg-card">
      <CardHeader className="space-y-4 pb-4">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="space-y-3">
            <div>
              <CardTitle className="text-sm font-semibold normal-case tracking-normal">
                Spending trend
              </CardTitle>
              <p className="mt-1 text-sm leading-5 text-secondary-foreground">
                Compare spending across this period and open any bucket for details.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              {chartLegendItems.map((item) => (
                <span
                  key={item.label}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-secondary-foreground"
                >
                  <span className={cn("h-2.5 w-2.5 rounded-sm", item.className)} />
                  {item.label}
                </span>
              ))}
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[360px]">
            <SummaryChip label="Peak">
              {peakPeriod
                ? `${formatPeriod(peakPeriod.period)} \u00b7 ${formatCompactCurrency(
                    peakPeriod.totalSpend,
                    { style: "chart" }
                  )}`
                : "No data"}
            </SummaryChip>
            <SummaryChip label="Latest">
              {latestPeriod
                ? `${formatPeriod(latestPeriod.period)} \u00b7 ${formatCompactCurrency(
                    latestPeriod.totalSpend,
                    { style: "chart" }
                  )}`
                : "No data"}
            </SummaryChip>
            <SummaryChip label="Average">
              {formatCompactCurrency(averagePeriodSpend, { style: "chart" })}
            </SummaryChip>
            <SummaryChip label={changeSummary.title}>
              {changeSummary.value}
            </SummaryChip>
          </div>
        </div>
        <div className="rounded-2xl bg-muted/18 px-4 py-3">
          <p className="text-sm font-semibold text-foreground">{changeSummary.title}</p>
          <p className="mt-1 text-sm text-secondary-foreground">{changeSummary.helper}</p>
          {comparisonStatus === "unavailable" ? (
            <p className="mt-2 text-sm text-secondary-foreground/80">
              Previous-period comparison will appear once this range has enough history.
            </p>
          ) : null}
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
          <div className="grid h-[340px] min-w-0 grid-cols-[4.9rem_minmax(0,1fr)] gap-3 rounded-2xl bg-muted/16 p-3">
            <div className="relative h-full pb-12 pt-2">
              {chartTicks.map((tick) => (
                <div
                  key={`${tick.ratio}-${tick.value}`}
                  className="absolute right-0 translate-y-1/2 text-right text-sm font-semibold text-secondary-foreground tabular-nums"
                  style={{ bottom: `calc(3rem + ${tick.ratio * 100}% - ${tick.ratio * 3}rem)` }}
                >
                  {formatCompactCurrency(tick.value, { style: "chart" })}
                </div>
              ))}
            </div>
            <div className="relative min-w-0 pb-12 pt-2">
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
                  gridTemplateColumns: `repeat(${Math.max(chartBuckets.length, 1)}, minmax(0, 1fr))`,
                }}
              >
                {chartBuckets.map((bucket) => (
                  <Link
                    key={bucket.period}
                    href={bucket.href}
                    className="group relative flex h-full min-w-0 flex-col items-center justify-end gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                    aria-label={bucket.ariaLabel}
                  >
                    <span className="pointer-events-none absolute bottom-[calc(3rem+100%)] z-10 hidden w-44 -translate-y-2 rounded-xl border border-border bg-popover px-3 py-2 text-center text-sm text-popover-foreground shadow-lg group-hover:block group-focus-visible:block">
                      {bucket.tooltip.title}
                      <span className="mt-1 block font-semibold tabular-nums">
                        {bucket.tooltip.amountLabel}
                      </span>
                      <span className="mt-1 block text-secondary-foreground">
                        {bucket.tooltip.transactionLabel}
                      </span>
                      {bucket.tooltip.comparisonLabel ? (
                        <span className="mt-1 block text-secondary-foreground">
                          {bucket.tooltip.comparisonLabel}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex h-[calc(100%-3rem)] w-full items-end rounded-md bg-secondary/55 px-0.5 pb-0.5">
                      <span
                        className={cn(
                          "w-full rounded-md transition-[background-color,filter,transform] duration-150 group-hover:-translate-y-1 group-hover:brightness-110 group-focus-visible:-translate-y-1 group-focus-visible:brightness-110",
                          bucket.isPeak && "bg-accent shadow-[0_0_16px_rgba(242,184,75,0.24)]",
                          bucket.isLatest && !bucket.isPeak && "bg-info",
                          !bucket.isPeak && !bucket.isLatest && "bg-primary/85 group-hover:bg-primary"
                        )}
                        style={{
                          height: `${bucket.height}%`,
                        }}
                      />
                    </span>
                    <span className="flex h-10 items-start justify-center text-center text-sm font-semibold leading-tight text-secondary-foreground">
                      {bucket.showLabel ? (
                        <span>
                          <span className="block">{bucket.label.primary}</span>
                          {bucket.label.secondary ? (
                            <span className="block text-xs text-secondary-foreground/75">
                              {bucket.label.secondary}
                            </span>
                          ) : null}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                ))}
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
  children,
}: {
  label: string;
  children: string;
}) {
  return (
    <div className="rounded-xl bg-muted/24 px-3 py-3">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground/80">
        {label}
      </p>
      <p className="mt-1 text-sm font-semibold text-foreground tabular-nums">{children}</p>
    </div>
  );
}

function SpendingByCategoryPanel({
  categories,
  totalSpend,
  maxCategorySpend,
  topCategory,
  range,
  sectionStatus,
}: {
  categories: DashboardPageData["spendingByCategory"];
  totalSpend: number;
  maxCategorySpend: number;
  topCategory: string | null;
  range: DashboardPageData["range"];
  sectionStatus: DashboardPageData["sectionStatus"]["categories"];
}) {
  const rangeParams = getRangeParams(range);

  return (
    <Card className="min-w-0 border-border/70">
      <CardHeader>
        <CardTitle className="normal-case tracking-normal">Where your money went</CardTitle>
        <p className="mt-2 text-sm leading-5 text-secondary-foreground">
          Category totals stay exact here so you can scan real spend without mixed notation.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {categories.length === 0 ? (
          <EmptyPanel
            title={
              sectionStatus === "incomplete"
                ? "Categories are still incomplete."
                : "No categorized spending yet."
            }
            helper={
              sectionStatus === "incomplete"
                ? "Some spending is still uncategorized, so category coverage is partial."
                : "Categorize spending to see your top category."
            }
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
                  "group block rounded-2xl bg-muted/18 p-3 transition-colors hover:bg-secondary/42 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
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
                    <p className="mt-1 text-sm text-secondary-foreground">
                      {formatNumber(item.transactionCount)} transactions {"\u00b7"} {share}% of spending
                    </p>
                  </div>
                  <span className="text-sm font-semibold text-foreground tabular-nums">
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
    <Card className="border-border/70">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="normal-case tracking-normal">Largest transactions</CardTitle>
            <p className="mt-2 text-sm leading-5 text-secondary-foreground">
              Highest-value transactions in this period.
            </p>
          </div>
          <Link
            href={buildTransactionsHref({
              ...getRangeParams(range),
              review: "large",
              sortBy: "amount",
              sortOrder: "desc",
            })}
            className="inline-flex min-h-9 shrink-0 items-center rounded-xl bg-secondary/70 px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="group flex items-start justify-between gap-3 rounded-2xl bg-muted/18 px-3 py-3 transition-colors hover:bg-secondary/42 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-foreground">
                  {transaction.recipient}
                </span>
                <span className="mt-1 block truncate text-sm text-secondary-foreground">
                  {formatShortDate(transaction.timestamp)} {"\u00b7"} {transaction.category ?? "Uncategorized"}
                </span>
              </span>
              <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
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
  transactionStatus,
}: {
  transactions: DashboardPageData["recentTransactions"];
  range: DashboardPageData["range"];
  transactionStatus: DashboardPageData["sectionStatus"]["transactions"];
}) {
  const summary = buildRecentTransactionsSummary({
    transactionCount: transactions.length,
    uncategorizedCount: transactions.filter((transaction) => !transaction.category).length,
  });

  return (
    <Card className="border-border/70">
      <CardHeader className="space-y-2 pb-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="normal-case tracking-normal">Recent transactions</CardTitle>
            <p className="mt-2 text-sm leading-5 text-secondary-foreground">
              Latest activity in this period.
            </p>
            <p className="mt-2 text-sm font-medium text-secondary-foreground">{summary}</p>
          </div>
          <Link
            href={buildTransactionsHref(getRangeParams(range))}
            className="inline-flex min-h-9 shrink-0 items-center rounded-xl bg-secondary/70 px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            View all
          </Link>
        </div>
      </CardHeader>
      <CardContent>
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
          <div className="overflow-hidden rounded-2xl bg-muted/14">
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
                    "group grid grid-cols-[minmax(0,1fr)_112px] items-center gap-4 px-4 py-3 transition-colors hover:bg-secondary/42 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    index > 0 && "border-t border-border/55"
                  )}
                >
                  <span className="min-w-0">
                    <span className="flex min-w-0 items-baseline gap-2">
                      <span className="truncate text-sm font-semibold text-foreground">
                        {transaction.recipient}
                      </span>
                      <span className="shrink-0 text-sm text-secondary-foreground">
                        {meta.timestampLabel}
                      </span>
                    </span>
                    <span className="mt-1 block truncate text-sm text-secondary-foreground">
                      {meta.categoryLabel}
                    </span>
                  </span>
                  <span className="shrink-0 text-right text-sm font-semibold tabular-nums text-foreground">
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
        "rounded-full px-2.5 py-1 text-[11px] font-semibold",
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
    <div className="rounded-2xl border border-dashed border-border bg-muted/28 p-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="rounded-xl border border-border bg-secondary p-2 text-primary">
            {icon}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-secondary p-2 text-accent">
            <AlertCircle className="h-5 w-5" />
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          {helper ? <p className="mt-1 text-sm leading-5 text-secondary-foreground">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}
