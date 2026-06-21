import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Sparkles,
  TriangleAlert,
  Wand2,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import { DashboardTimeframePicker } from "./dashboard-timeframe-picker";
import {
  buildBiggestChangeCard,
  buildChartBuckets,
  buildChartTicks,
  buildMetricComparisons,
  buildRecentTransactionMeta,
  buildRecentTransactionsSummary,
  buildReviewQueueCard,
  buildSuggestedRules,
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
  getUncategorizedShare,
} from "./dashboard-view-model";

const panelClassName =
  "overflow-hidden rounded-[8px] border border-border/55 bg-[linear-gradient(180deg,rgba(12,22,17,0.94),rgba(9,16,13,0.96))] shadow-[0_8px_24px_rgba(0,0,0,0.16)]";

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
  const biggestChange = buildBiggestChangeCard({
    summary: data.summary,
    comparison: data.comparison,
    categories: data.spendingByCategory,
    range: data.range,
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
  const uncategorizedShare = getUncategorizedShare(
    data.summary.uncategorizedCount,
    data.summary.transactionCount
  );
  const suggestedRules = buildSuggestedRules({
    recipients: data.frequentRecipients,
  });

  return (
    <div className="space-y-3.5">
      <section className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-1.5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-primary/85">
            Spend operations
          </p>
          <h1 className="text-[34px] font-semibold leading-none text-foreground lg:text-[42px]">
            Dashboard
          </h1>
          <div className="flex items-center gap-2 text-sm text-secondary-foreground">
            <span className="font-medium text-foreground">{displayRange}</span>
            <Calendar className="h-3.5 w-3.5 text-secondary-foreground/80" />
          </div>
        </div>
        <div className="shrink-0">
          <DashboardTimeframePicker
            value={data.range.value}
            startDate={data.range.startDate}
            endDate={data.range.endDate}
          />
        </div>
      </section>

      {data.status === "error" ? (
        <section className="rounded-[8px] border border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {data.message}
        </section>
      ) : null}

      {reviewQueue.hasItems ? (
        <ReviewAlertBar
          uncategorizedShare={uncategorizedShare}
          reviewHref={reviewQueue.href}
          uncategorizedCount={data.summary.uncategorizedCount}
        />
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        <MetricCard
          href={buildTransactionsHref(rangeParams)}
          label="Total spent"
          value={formatCompactCurrency(data.summary.totalSpend, { style: "kpi" })}
          helper={`${formatCurrency(data.summary.totalSpend)} across ${formatNumber(
            data.summary.transactionCount
          )} transactions`}
          comparison={metricComparisons.totalSpend}
          tone="primary"
        />
        <MetricCard
          href={buildTransactionsHref(rangeParams)}
          label="Average spend"
          value={formatCompactCurrency(data.summary.averageSpend, { style: "kpi" })}
          helper={`Across ${formatNumber(data.summary.transactionCount)} transactions`}
          comparison={metricComparisons.averageSpend}
          tone="secondary"
        />
        <MetricCard
          href={
            topCategoryInsight
              ? buildTransactionsHref({
                  ...rangeParams,
                  category: topCategoryInsight.category,
                })
              : "/categories"
          }
          label="Top categorized spend"
          value={
            topCategoryInsight
              ? formatCurrency(topCategoryInsight.totalSpend)
              : "Not ready yet"
          }
          helper={
            topCategoryInsight
              ? `${topCategoryInsight.category} · ${topCategoryInsight.share}% of categorized spend`
              : "Categorize spending to reveal the leading category."
          }
          comparison={topCategoryInsight?.category ?? "No category signal"}
          tone="secondary"
        />
        <ReviewQueueHero card={reviewQueue} />
      </section>

      <section className="grid gap-3 2xl:grid-cols-[minmax(0,1.58fr)_minmax(320px,0.72fr)]">
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
          trendHref={buildTransactionsHref(rangeParams)}
        />
        <RightRail
          needsCategoryCount={data.summary.uncategorizedCount}
          needsCategoryAmount={data.spendingByCategory.find((item) => item.category === "Uncategorized")?.totalSpend ?? 0}
          needsCategoryHref={buildTransactionsHref({
            ...rangeParams,
            status: "uncategorized",
          })}
          biggestChange={biggestChange}
          suggestedRules={suggestedRules}
        />
      </section>

      <section className="grid gap-3 xl:grid-cols-4">
        <SpendingByCategoryPanel
          categories={data.spendingByCategory}
          totalSpend={data.summary.totalSpend}
          maxCategorySpend={maxCategorySpend}
          topCategory={topCategoryInsight?.category ?? null}
          range={data.range}
          sectionStatus={data.sectionStatus.categories}
        />
        <FrequentRecipientsPanel recipients={data.frequentRecipients} />
        <LargestTransactionsPanel
          transactions={data.recentLargeTransactions}
          range={data.range}
        />
        <RecentTransactionsPanel
          transactions={data.recentTransactions}
          range={data.range}
          transactionStatus={data.sectionStatus.transactions}
        />
      </section>
    </div>
  );
}

function ReviewAlertBar({
  uncategorizedShare,
  reviewHref,
  uncategorizedCount,
}: {
  uncategorizedShare: number;
  reviewHref: string;
  uncategorizedCount: number;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-[8px] border border-accent/18 bg-[linear-gradient(90deg,rgba(242,184,75,0.10),rgba(242,184,75,0.05))] px-4 py-2.5 text-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TriangleAlert className="h-4 w-4 shrink-0 text-accent" />
        <p className="text-secondary-foreground">
          <span className="font-semibold text-foreground">
            {uncategorizedShare}% of this period is uncategorized.
          </span>{" "}
          Categorize these transactions to unlock better insights.
        </p>
      </div>
      <Link
        href={reviewHref}
        className="inline-flex min-h-8 shrink-0 items-center justify-center rounded-[8px] border border-accent/35 bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {uncategorizedCount > 0 ? "Review uncategorized" : "Open review items"}
      </Link>
    </section>
  );
}

function MetricCard({
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
  tone: "primary" | "secondary";
}) {
  return (
    <Link
      href={href}
      className={cn(
        panelClassName,
        "group min-h-[132px] px-4 py-4 transition-colors hover:border-primary/18 hover:bg-[linear-gradient(180deg,rgba(14,25,19,0.98),rgba(10,17,14,0.98))]",
        tone === "primary" && "border-primary/16"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-secondary-foreground">{label}</p>
        <span className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-primary/12 bg-primary/6 text-primary/85">
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
      <p
        className={cn(
          "mt-4 break-words text-[1.55rem] font-semibold leading-tight tabular-nums",
          tone === "primary" ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm font-semibold text-secondary-foreground">{comparison}</p>
      <p className="mt-2 text-sm leading-5 text-secondary-foreground">{helper}</p>
    </Link>
  );
}

function ReviewQueueHero({
  card,
}: {
  card: ReturnType<typeof buildReviewQueueCard>;
}) {
  const needsCategoryTask = card.tasks.find((task) => task.label === "Need category");
  const largeTransactionsTask = card.tasks.find((task) => task.label === "Large transactions");

  return (
    <Card className={cn(panelClassName, "min-h-[132px] border-accent/14")}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-secondary-foreground">Review queue</p>
            <p className="mt-3 text-[1.6rem] font-semibold leading-none text-accent">
              {formatNumber(card.totalReviewCount)}
              <span className="ml-1.5 text-base text-foreground">open items</span>
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-[8px] border border-accent/22 bg-accent/10 text-accent">
            {card.hasItems ? <Clock3 className="h-4.5 w-4.5" /> : <CheckCircle2 className="h-4.5 w-4.5" />}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm leading-5 text-secondary-foreground">
          {needsCategoryTask?.count ?? 0} need category · {largeTransactionsTask?.count ?? 0} large transactions
        </p>
        <Link
          href={card.hasItems ? card.href : buildTransactionsHref({})}
          className="mt-3 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-[8px] border border-accent/35 bg-accent px-4 text-sm font-semibold text-accent-foreground transition-colors hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {card.hasItems ? "Start review" : "View transactions"}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </CardContent>
    </Card>
  );
}

function RightRail({
  needsCategoryCount,
  needsCategoryAmount,
  needsCategoryHref,
  biggestChange,
  suggestedRules,
}: {
  needsCategoryCount: number;
  needsCategoryAmount: number;
  needsCategoryHref: string;
  biggestChange: ReturnType<typeof buildBiggestChangeCard>;
  suggestedRules: ReturnType<typeof buildSuggestedRules>;
}) {
  return (
    <div className="grid gap-3">
      <Link
        href={needsCategoryHref}
        className={cn(
          panelClassName,
          "group px-4 py-4 transition-colors hover:border-accent/25",
          "bg-[linear-gradient(180deg,rgba(33,28,12,0.66),rgba(18,18,12,0.94))]"
        )}
      >
        <RailHeader icon={<TriangleAlert className="h-4 w-4 text-accent" />} label="Needs category" />
        <p className="mt-2 text-[1.05rem] font-semibold text-foreground">
          {formatNumber(needsCategoryCount)} transactions still need a category.
        </p>
        <p className="mt-1 text-sm text-secondary-foreground">
          {formatCurrency(needsCategoryAmount)} ({formatNumber(needsCategoryCount)} transactions)
        </p>
      </Link>

      <Link
        href={biggestChange.href ?? "#"}
        className={cn(panelClassName, "group px-4 py-4 transition-colors hover:border-primary/18")}
      >
        <RailHeader icon={<Sparkles className="h-4 w-4 text-primary" />} label={biggestChange.label} />
        <p className="mt-2 text-[1.05rem] font-semibold text-primary">{biggestChange.value}</p>
        <p className="mt-1 text-sm text-secondary-foreground">{biggestChange.helper}</p>
      </Link>

      <div className={cn(panelClassName, "px-4 py-4")}>
        <RailHeader icon={<Wand2 className="h-4 w-4 text-info" />} label="Suggested rules" />
        <p className="mt-2 text-sm text-secondary-foreground">
          {suggestedRules.length > 0
            ? `${suggestedRules.length} suggestions based on repeated payees.`
            : "Suggestions appear once repeated payees emerge in this period."}
        </p>
        {suggestedRules.length > 0 ? (
          <div className="mt-3 space-y-2 text-sm">
            {suggestedRules.map((rule) => (
              <div key={rule.recipient} className="flex items-center justify-between gap-3">
                <span className="truncate text-foreground">{rule.recipient}</span>
                <span className="shrink-0 text-primary">{rule.action}</span>
              </div>
            ))}
          </div>
        ) : null}
        <Link
          href="/categories"
          className="mt-4 inline-flex min-h-9 w-full items-center justify-between rounded-[8px] border border-border/55 bg-background/18 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/22 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          View all suggestions
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </Link>
      </div>
    </div>
  );
}

function RailHeader({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm font-medium text-secondary-foreground">
      <div className="flex items-center gap-2">
        {icon}
        {label}
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
}) {
  const legendByLabel = new Map(chartLegendItems.map((item) => [item.label, item.className]));

  return (
    <Card className={panelClassName}>
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-[1rem] font-semibold normal-case tracking-normal text-foreground">
              Spending trend
            </CardTitle>
            <p className="mt-1 text-sm leading-5 text-secondary-foreground">
              Compare spending across this period and open any bucket for details.
            </p>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 xl:min-w-[386px] xl:grid-cols-4">
            <SummaryChip
              label="Average"
              value={formatCompactCurrency(averagePeriodSpend, { style: "chart" })}
              tone="primary"
              dotClassName={legendByLabel.get("Normal")}
            />
            <SummaryChip
              label="Peak"
              value={
                peakPeriod
                  ? formatCompactCurrency(peakPeriod.totalSpend, { style: "chart" })
                  : "No data"
              }
              helper={peakPeriod ? formatPeriod(peakPeriod.period) : undefined}
              tone="accent"
              dotClassName={legendByLabel.get("Peak")}
            />
            <SummaryChip
              label="Latest"
              value={
                latestPeriod
                  ? formatCompactCurrency(latestPeriod.totalSpend, { style: "chart" })
                  : "No data"
              }
              helper={latestPeriod ? formatPeriod(latestPeriod.period) : undefined}
              tone="info"
              dotClassName={legendByLabel.get("Latest")}
            />
            <SummaryChip label="What changed?" value={changeSummary.value} />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {!hasTransactions || periods.length === 0 ? (
          <EmptyPanel
            icon={<BarChart3 className="h-5 w-5" />}
            title="No spending found for this period."
            helper="Try a different timeframe or import transactions."
          />
        ) : (
          <div className="rounded-[8px] border border-border/35 bg-[linear-gradient(180deg,rgba(10,17,14,0.62),rgba(8,13,11,0.76))] px-3 py-2.5">
            <div className="grid h-[248px] min-w-0 grid-cols-[3.4rem_minmax(0,1fr)] gap-2.5">
              <div className="relative h-full pb-7 pt-1.5">
                {chartTicks.map((tick) => (
                  <div
                    key={`${tick.ratio}-${tick.value}`}
                    className="absolute right-0 translate-y-1/2 text-right text-[11px] font-medium text-secondary-foreground/80 tabular-nums"
                    style={{ bottom: `calc(2rem + ${tick.ratio * 100}% - ${tick.ratio * 2}rem)` }}
                  >
                    {formatCompactCurrency(tick.value, { style: "chart" })}
                  </div>
                ))}
              </div>

              <div className="relative min-w-0 pb-7 pt-1.5">
                {chartTicks.map((tick) => (
                  <div
                    key={`grid-${tick.ratio}-${tick.value}`}
                    className="pointer-events-none absolute inset-x-0 border-t border-border/14"
                    style={{ bottom: `calc(2rem + ${tick.ratio * 100}% - ${tick.ratio * 2}rem)` }}
                  />
                ))}
                {averagePeriodSpend > 0 && chartMax > 0 ? (
                  <div
                    className="pointer-events-none absolute inset-x-0 border-t border-dashed border-primary/22"
                    style={{
                      bottom: `calc(2rem + ${(averagePeriodSpend / chartMax) * 100}% - ${
                        (averagePeriodSpend / chartMax) * 2
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
                      <span className="pointer-events-none absolute bottom-[calc(2rem+100%)] z-10 hidden w-44 -translate-y-2 rounded-[8px] border border-border/70 bg-popover px-3 py-2 text-center text-sm text-popover-foreground shadow-lg group-hover:block group-focus-visible:block">
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
                      <span className="flex h-[calc(100%-2rem)] w-full items-end rounded-[3px] bg-secondary/10 px-[1px] pb-[1px]">
                        <span
                          className={cn(
                            "w-full rounded-[2px] transition-[background-color,filter,transform] duration-150 group-hover:-translate-y-0.5 group-hover:brightness-110 group-focus-visible:-translate-y-0.5 group-focus-visible:brightness-110",
                            bucket.isPeak && "bg-accent",
                            bucket.isLatest && !bucket.isPeak && "bg-info",
                            !bucket.isPeak && !bucket.isLatest && "bg-primary/90"
                          )}
                          style={{ height: `${bucket.height}%` }}
                        />
                      </span>
                      <span className="flex h-6 items-start justify-center text-center text-[10px] font-medium leading-tight text-secondary-foreground/85">
                        {bucket.showLabel ? (
                          <span>
                            <span className="block">{bucket.label.primary}</span>
                            {bucket.label.secondary ? (
                              <span className="block text-[9px] text-secondary-foreground/70">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryChip({
  label,
  value,
  helper,
  tone = "neutral",
  dotClassName,
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: "neutral" | "primary" | "accent" | "info";
  dotClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[8px] border border-border/35 bg-background/14 px-3 py-2",
        tone === "primary" && "border-primary/16",
        tone === "accent" && "border-accent/16",
        tone === "info" && "border-info/16"
      )}
    >
      <div className="flex items-center gap-2">
        {dotClassName ? <span className={cn("h-2.5 w-2.5 rounded-full", dotClassName)} /> : null}
        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-secondary-foreground/75">
          {label}
        </p>
      </div>
      <p className="mt-1 text-[13px] font-semibold text-foreground tabular-nums">{value}</p>
      {helper ? <p className="mt-0.5 text-[10px] text-secondary-foreground/85">{helper}</p> : null}
    </div>
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
      <div className="min-h-[52px] space-y-1.5">
        <CardTitle className="text-[1.1rem] font-semibold normal-case tracking-normal text-foreground">
          {title}
        </CardTitle>
        <p className="text-sm leading-5 text-secondary-foreground">{description}</p>
      </div>
      {trailing ? <div className="mt-2">{trailing}</div> : null}
    </CardHeader>
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
    <Card className={panelClassName}>
      <AlignedPanelHeader
        title="Where your money went"
        description="Category totals stay stable so you can scan and spend."
      />
      <CardContent>
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
          <div className="overflow-hidden rounded-[8px] border border-border/50 bg-background/14">
            <TableHeader
              columns={["Category", "Amount", "% of spend"]}
              template="minmax(0,1.35fr) 108px 76px"
            />
            {categories.slice(0, 5).map((item, index) => {
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
                    "grid grid-cols-[minmax(0,1.35fr)_108px_76px] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    index > 0 && "border-t border-border/40"
                  )}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          isUncategorized ? "bg-accent" : isTop ? "bg-primary" : "bg-primary/65"
                        )}
                      />
                      <span className="truncate font-medium text-foreground">{item.category}</span>
                    </div>
                    <div className="mt-2 h-1.5 rounded-full bg-secondary/20">
                      <div
                        className={cn(
                          "h-1.5 rounded-full",
                          isUncategorized ? "bg-accent" : "bg-primary"
                        )}
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
                </Link>
              );
            })}
            <div className="grid grid-cols-[minmax(0,1.35fr)_108px_76px] items-center gap-3 border-t border-border/40 px-4 py-3 text-sm font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-right tabular-nums text-foreground">
                {formatCurrency(totalSpend)}
              </span>
              <span className="text-right text-secondary-foreground">100%</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function FrequentRecipientsPanel({
  recipients,
}: {
  recipients: DashboardPageData["frequentRecipients"];
}) {
  return (
    <Card className={panelClassName}>
      <AlignedPanelHeader
        title="Frequent payees"
        description="Your most frequent recipients this period."
      />
      <CardContent>
        {recipients.length === 0 ? (
          <EmptyPanel title="No repeated payees in this period." />
        ) : (
          <div className="overflow-hidden rounded-[8px] border border-border/50 bg-background/14">
            <TableHeader
              columns={["Payee", "Payments", "Amount"]}
              template="minmax(0,1.35fr) 72px 92px"
            />
            {recipients.map((recipient, index) => (
              <Link
                key={recipient.recipient}
                href="/recipients"
                className={cn(
                  "grid grid-cols-[minmax(0,1.35fr)_72px_92px] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  index > 0 && "border-t border-border/40"
                )}
              >
                <span className="truncate font-medium text-foreground">{recipient.recipient}</span>
                <span className="text-right text-secondary-foreground">
                  {recipient.paymentCount}
                </span>
                <span className="text-right font-medium tabular-nums text-foreground">
                  {formatCurrency(recipient.totalAmount)}
                </span>
              </Link>
            ))}
          </div>
        )}
        <PanelFooterLink href="/recipients" label="View all recipients" />
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
    <Card className={panelClassName}>
      <AlignedPanelHeader
        title="Largest transactions"
        description="High-value transactions in this period."
      />
      <CardContent>
        {transactions.length === 0 ? (
          <EmptyPanel title="No large transactions in this period." />
        ) : (
          <div className="overflow-hidden rounded-[8px] border border-border/50 bg-background/14">
            <TableHeader
              columns={["Merchant", "Date", "Amount"]}
              template="minmax(0,1.35fr) 76px 88px"
            />
            {transactions.map((transaction, index) => (
              <Link
                key={transaction.uuid}
                href={buildTransactionsHref({ transaction: transaction.uuid })}
                className={cn(
                  "grid grid-cols-[minmax(0,1.35fr)_76px_88px] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                  index > 0 && "border-t border-border/40"
                )}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{transaction.recipient}</p>
                  <p className="mt-0.5 truncate text-xs text-secondary-foreground">
                    {transaction.category ?? "Uncategorized"}
                  </p>
                </div>
                <span className="text-right text-secondary-foreground">
                  {formatShortDate(transaction.timestamp)}
                </span>
                <span className="text-right font-medium tabular-nums text-foreground">
                  {formatCurrency(transaction.amount)}
                </span>
              </Link>
            ))}
          </div>
        )}
        <PanelFooterLink
          href={buildTransactionsHref({
            ...getRangeParams(range),
            review: "large",
            sortBy: "amount",
            sortOrder: "desc",
          })}
          label="View all transactions"
        />
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
    <Card className={panelClassName}>
      <AlignedPanelHeader
        title="Recent transactions"
        description="Latest activity in this period."
        trailing={
          <p className="text-sm font-medium text-secondary-foreground">{summary}</p>
        }
      />
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
          <div className="overflow-hidden rounded-[8px] border border-border/50 bg-background/14">
            <TableHeader
              columns={["Merchant", "Date", "Amount"]}
              template="minmax(0,1.35fr) 76px 88px"
            />
            {transactions.slice(0, 6).map((transaction, index) => {
              const meta = buildRecentTransactionMeta(
                transaction.category,
                transaction.timestamp
              );

              return (
                <Link
                  key={transaction.uuid}
                  href={buildTransactionsHref({ transaction: transaction.uuid })}
                  className={cn(
                    "grid grid-cols-[minmax(0,1.35fr)_76px_88px] items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-secondary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    index > 0 && "border-t border-border/40"
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{transaction.recipient}</p>
                    <p className="mt-0.5 truncate text-xs text-secondary-foreground">
                      {meta.categoryLabel}
                    </p>
                  </div>
                  <span className="text-right text-secondary-foreground">
                    {meta.timestampLabel}
                  </span>
                  <span className="text-right font-medium tabular-nums text-foreground">
                    {formatCurrency(transaction.amount)}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
        <PanelFooterLink
          href={buildTransactionsHref(getRangeParams(range))}
          label="View all activity"
        />
      </CardContent>
    </Card>
  );
}

function TableHeader({
  columns,
  template,
}: {
  columns: [string, string, string];
  template: string;
}) {
  return (
    <div
      className="grid gap-3 border-b border-border/40 bg-background/16 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-secondary-foreground/75"
      style={{ gridTemplateColumns: template }}
    >
      {columns.map((column, index) => (
        <span key={column} className={cn(index > 0 && "text-right")}>
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
      className="mt-4 inline-flex min-h-9 w-full items-center justify-between rounded-[8px] border border-border/50 bg-background/16 px-4 text-sm font-semibold text-foreground transition-colors hover:bg-secondary/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {label}
      <ChevronRight className="h-4 w-4 text-muted-foreground" />
    </Link>
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
    <div className="rounded-[8px] border border-dashed border-border/50 bg-background/16 p-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <div className="rounded-[8px] border border-border/60 bg-secondary/24 p-2 text-primary">
            {icon}
          </div>
        ) : (
          <div className="rounded-[8px] border border-border/60 bg-secondary/24 p-2 text-accent">
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
