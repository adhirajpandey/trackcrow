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
  ReceiptText,
  Sparkles,
  TriangleAlert,
  UserRound,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppPageHeader } from "@/components/product/app-page-header";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import { DashboardBottomSection } from "./dashboard-bottom-section";
import { DashboardTimeframePicker } from "./dashboard-timeframe-picker";
import {
  buildBiggestChangeCard,
  buildChartBuckets,
  buildChartTicks,
  buildMostFrequentRecipient,
  buildMetricComparisons,
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
  getAveragePeriodSpend,
  getKnownSpendTotal,
  getPeakPeriod,
  getPeriodLabelStep,
  getRangeParams,
  getTopCategoryInsight,
  getUncategorizedShare,
} from "./dashboard-view-model";
import {
  dashboardMetricIconClassName,
  dashboardPanelClassName,
  dashboardPrimaryActionClassName,
  dashboardSmallActionClassName,
  dashboardTopCardActionSlotClassName,
  dashboardTopCardAttentionClassName,
  dashboardTopCardClassName,
  dashboardTopCardEntityValueClassName,
  dashboardTopCardHeaderClassName,
  dashboardTopCardHelperClassName,
  dashboardTopCardLabelClassName,
  dashboardTopCardMetaClassName,
  dashboardTopCardValueClassName,
} from "./dashboard-style";

const chartLabelBandRem = 2.8;
const chartTopPaddingRem = 1.1;
const chartMinHeightClass = "min-h-[272px] sm:min-h-[288px]";

function getChartTrackOffset(ratio: number) {
  return `calc(${ratio * 100}% - ${ratio * chartTopPaddingRem}rem)`;
}

export function DashboardPageView({ data }: { data: DashboardPageData }) {
  const hasTransactions = data.summary.transactionCount > 0;
  const knownSpendTotal = getKnownSpendTotal(data.spendingByCategory);
  const topCategoryInsight = getTopCategoryInsight(
    data.spendingByCategory,
    knownSpendTotal
  );
  const chartTicks = buildChartTicks(
    Math.max(...data.spendingByPeriod.map((item) => item.totalSpend), 1)
  );
  const chartMax = chartTicks[chartTicks.length - 1]?.value ?? 0;
  const periodLabelStep = getPeriodLabelStep(data.spendingByPeriod.length);
  const peakPeriod = getPeakPeriod(data.spendingByPeriod);
  const latestPeriod = data.spendingByPeriod[data.spendingByPeriod.length - 1] ?? null;
  const averagePeriodSpend = getAveragePeriodSpend(data.spendingByPeriod);
  const rangeParams = getRangeParams(data.range);
  const reviewQueue = buildReviewQueueCard({
    summary: data.summary,
    importHealth: data.importHealth,
    largeTransactionCount: data.largeTransactionCount,
    recipients: data.frequentRecipients,
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
    periods: data.spendingByPeriod,
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
  const mostFrequentRecipient = buildMostFrequentRecipient({
    recipients: data.frequentRecipients,
  });

  return (
    <div className="space-y-3.5">
      <AppPageHeader
        eyebrow="Spend operations"
        title="Dashboard"
        meta={
          <>
            <span className="font-medium text-foreground">{displayRange}</span>
            <Calendar className="h-3.5 w-3.5 text-secondary-foreground/80" />
          </>
        }
        actions={
          <DashboardTimeframePicker
            value={data.range.value}
            startDate={data.range.startDate}
            endDate={data.range.endDate}
          />
        }
      />

      {data.status === "error" ? (
        <section className="rounded-[8px] border border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {data.message}
        </section>
      ) : null}

      {reviewQueue.hasItems ? (
        <ReviewAlertBar
          uncategorizedShare={uncategorizedShare}
          reviewHref={buildTransactionsHref({
            ...rangeParams,
            status: "uncategorized",
          })}
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
          icon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        />
        <ReviewQueueHero card={reviewQueue} />
        <MetricCard
          href={
            topCategoryInsight
              ? buildTransactionsHref({
                  ...rangeParams,
                  category: topCategoryInsight.category,
                })
              : "/transactions"
          }
          label="Top known category"
          value={
            topCategoryInsight
              ? formatCurrency(topCategoryInsight.totalSpend)
              : "No known category yet"
          }
          helper={
            topCategoryInsight
              ? topCategoryInsight.category
              : "Categorize transactions to see your top category."
          }
          comparison={
            topCategoryInsight
              ? `${topCategoryInsight.share}% of categorized spend`
              : "Known spend only"
          }
          tone="secondary"
          icon={<ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />}
        />
        <MostFrequentRecipientCard recipient={mostFrequentRecipient} />
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
        />
        <RightRail
          needsCategoryCount={data.summary.uncategorizedCount}
          needsCategoryAmount={
            data.spendingByCategory.find((item) => item.category === "Uncategorized")
              ?.totalSpend ?? 0
          }
          needsCategoryHref={buildTransactionsHref({
            ...rangeParams,
            status: "uncategorized",
          })}
          biggestChange={biggestChange}
          suggestedRules={suggestedRules}
        />
      </section>

      <DashboardBottomSection
        data={data}
        displayRange={displayRange}
        topCategory={topCategoryInsight?.category ?? null}
      />
    </div>
  );
}

function ReviewAlertBar({
  uncategorizedShare,
  reviewHref,
}: {
  uncategorizedShare: number;
  reviewHref: string;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-[8px] border border-accent/22 bg-[linear-gradient(90deg,rgba(242,184,75,0.12),rgba(242,184,75,0.06))] px-4 py-3 text-sm lg:flex-row lg:items-center lg:justify-between">
      <div className="flex items-center gap-3">
        <TriangleAlert className="h-4 w-4 shrink-0 text-accent" />
        <div>
          <p className="font-semibold text-foreground">Insights are limited</p>
          <p className="text-secondary-foreground">
            {uncategorizedShare}% of this period is uncategorized. Review these
            transactions to improve category totals, trends, and rules.
          </p>
        </div>
      </div>
      <Link
        href={reviewHref}
        className={cn(
          dashboardSmallActionClassName,
          "shrink-0 border border-accent/35 bg-accent px-4 font-semibold text-accent-foreground transition-colors hover:brightness-105"
        )}
      >
        Review uncategorized
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
  icon,
}: {
  href: string;
  label: string;
  value: string;
  helper: string;
  comparison: string;
  tone: "primary" | "secondary";
  icon: ReactNode;
}) {
  return (
    <TopDashboardCardFrame href={href} accentBorder={tone === "primary"}>
      <TopDashboardCardHeader label={label} icon={icon} />
      <TopDashboardCardBody
        primaryValue={
          <p
            className={cn(
              dashboardTopCardValueClassName,
              tone === "primary" ? "text-primary" : "text-foreground"
            )}
          >
            {value}
          </p>
        }
        secondaryValue={<p className={dashboardTopCardMetaClassName}>{comparison}</p>}
        helper={<p className={dashboardTopCardHelperClassName}>{helper}</p>}
      />
    </TopDashboardCardFrame>
  );
}

function MostFrequentRecipientCard({
  recipient,
}: {
  recipient: ReturnType<typeof buildMostFrequentRecipient>;
}) {
  return (
    <TopDashboardCardFrame href={recipient?.href ?? "/recipients"}>
      <TopDashboardCardHeader
        label="Most frequent recipient"
        icon={<UserRound className="h-4 w-4" />}
      />
      {recipient ? (
        <TopDashboardCardBody
          primaryValue={
            <p className={cn(dashboardTopCardEntityValueClassName, "text-primary")}>
              {recipient.recipient}
            </p>
          }
          secondaryValue={
            <p className={dashboardTopCardMetaClassName}>
              {formatNumber(recipient.paymentCount)} payments, {formatCurrency(recipient.totalAmount)}
            </p>
          }
          helper={<p className={dashboardTopCardHelperClassName}>{recipient.helper}</p>}
          action={
            recipient.action === "Create rule" ? (
              <span
                className={cn(
                  dashboardSmallActionClassName,
                  "border border-primary/24 text-primary"
                )}
              >
                Create rule
              </span>
            ) : null
          }
        />
      ) : (
        <TopDashboardCardBody
          primaryValue={
            <p className={cn(dashboardTopCardEntityValueClassName, "text-foreground")}>
              No repeated recipients yet
            </p>
          }
          helper={
            <p className={dashboardTopCardHelperClassName}>
              Repeated payments will appear here.
            </p>
          }
        />
      )}
    </TopDashboardCardFrame>
  );
}

function ReviewQueueHero({
  card,
}: {
  card: ReturnType<typeof buildReviewQueueCard>;
}) {
  const needsCategoryTask = card.tasks.find((task) => task.label === "Need category");
  const largeTransactionsTask = card.tasks.find((task) => task.label === "Large transactions");
  const ruleMatchesTask = card.tasks.find((task) => task.label === "Possible rule matches");
  const importIssuesTask = card.tasks.find((task) => task.label === "Import issues");

  return (
    <TopDashboardCardFrame
      href={card.hasItems ? card.href : buildTransactionsHref({})}
      attention
    >
      <TopDashboardCardHeader
        label="Needs review"
        labelTone="accent"
        icon={
          card.hasItems ? (
            <Clock3 className="h-4.5 w-4.5" />
          ) : (
            <CheckCircle2 className="h-4.5 w-4.5" />
          )
        }
        iconTone="accent"
      />
      <TopDashboardCardBody
        primaryValue={
          <p className={cn(dashboardTopCardValueClassName, "text-accent")}>
            {formatNumber(card.totalReviewCount)}
            <span className="ml-1.5 text-base text-foreground">
              transactions need review
            </span>
          </p>
        }
        secondaryValue={
          <div className="space-y-1.5 text-sm leading-5 text-foreground">
            <p>{formatNumber(needsCategoryTask?.count ?? 0)} need category</p>
            <p>{formatNumber(largeTransactionsTask?.count ?? 0)} large transactions</p>
            <p>{formatNumber(ruleMatchesTask?.count ?? 0)} possible rule matches</p>
            {importIssuesTask && importIssuesTask.count > 0 ? (
              <p>{formatNumber(importIssuesTask.count)} import issues</p>
            ) : null}
          </div>
        }
        action={
          <span
            className={cn(
              dashboardPrimaryActionClassName,
              "w-full gap-2 border border-accent/35 bg-accent text-accent-foreground transition-colors hover:brightness-105"
            )}
          >
            {card.hasItems ? "Review now" : "View transactions"}
            <ArrowRight className="h-4 w-4" />
          </span>
        }
      />
    </TopDashboardCardFrame>
  );
}

function TopDashboardCardFrame({
  children,
  href,
  attention = false,
  accentBorder = false,
}: {
  children: ReactNode;
  href: string;
  attention?: boolean;
  accentBorder?: boolean;
}) {
  return (
    <Link
      href={href}
      className={cn(
        attention ? dashboardTopCardAttentionClassName : dashboardTopCardClassName,
        accentBorder && "border-primary/16"
      )}
    >
      {children}
    </Link>
  );
}

function TopDashboardCardHeader({
  label,
  icon,
  labelTone = "default",
  iconTone = "default",
}: {
  label: string;
  icon: ReactNode;
  labelTone?: "default" | "accent";
  iconTone?: "default" | "accent";
}) {
  return (
    <div className={dashboardTopCardHeaderClassName}>
      <p
        className={cn(
          dashboardTopCardLabelClassName,
          labelTone === "accent" && "text-accent"
        )}
      >
        {label}
      </p>
      <span
        className={cn(
          dashboardMetricIconClassName,
          iconTone === "accent"
            ? "border border-accent/22 bg-accent/10 text-accent"
            : "border border-primary/12 bg-primary/6 text-primary/85"
        )}
      >
        {icon}
      </span>
    </div>
  );
}

function TopDashboardCardBody({
  primaryValue,
  secondaryValue,
  helper,
  action,
}: {
  primaryValue: ReactNode;
  secondaryValue?: ReactNode;
  helper?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {primaryValue}
      {secondaryValue}
      {helper}
      <div className={dashboardTopCardActionSlotClassName}>
        {action ?? <div className="min-h-9" />}
      </div>
    </div>
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
          dashboardPanelClassName,
          "group px-4 py-4 transition-colors hover:border-accent/25",
          "bg-[linear-gradient(180deg,rgba(33,28,12,0.66),rgba(18,18,12,0.94))]"
        )}
      >
        <RailHeader
          icon={<TriangleAlert className="h-4 w-4 text-accent" />}
          label="Needs category"
        />
        <p className="mt-2 text-[1.05rem] font-semibold text-foreground">
          {formatNumber(needsCategoryCount)} transactions still need a category.
        </p>
        <p className="mt-1 text-sm text-secondary-foreground">
          {formatCurrency(needsCategoryAmount)} across {formatNumber(needsCategoryCount)}{" "}
          transactions
        </p>
      </Link>

      <Link
        href={biggestChange.href ?? "#"}
        className={cn(dashboardPanelClassName, "group px-4 py-4 transition-colors hover:border-primary/18")}
      >
        <RailHeader
          icon={<Sparkles className="h-4 w-4 text-primary" />}
          label={biggestChange.label}
        />
        <p className="mt-2 text-[1.05rem] font-semibold text-primary">
          {biggestChange.value}
        </p>
        <p className="mt-1 text-sm text-secondary-foreground">{biggestChange.helper}</p>
      </Link>

      <div className={cn(dashboardPanelClassName, "px-4 py-4")}>
        <RailHeader
          icon={<ReceiptText className="h-4 w-4 text-info" />}
          label="Rule suggestions"
        />
        <p className="mt-2 text-sm text-secondary-foreground">
          {suggestedRules.length > 0
            ? `${suggestedRules.length} suggestions based on repeated recipients.`
            : "Suggestions appear once repeated recipients emerge in this period."}
        </p>
        {suggestedRules.length > 0 ? (
          <div className="mt-3 space-y-2 text-sm">
            {suggestedRules.map((rule) => (
              <div key={rule.recipient} className="flex items-center justify-between gap-3">
                <span className="truncate text-foreground">{rule.recipient}</span>
                <Link href={rule.href} className="shrink-0 text-primary">
                  {rule.action}
                </Link>
              </div>
            ))}
          </div>
        ) : null}
        <Link
          href="/categories"
          className={cn(
            dashboardPrimaryActionClassName,
            "mt-4 w-full justify-between border border-border/55 bg-background/18 text-foreground transition-colors hover:bg-secondary/22"
          )}
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
  const chartColumnsTemplate = `repeat(${Math.max(chartBuckets.length, 1)}, minmax(0, 1fr))`;
  const chartRowsTemplate = `minmax(0, 1fr) ${chartLabelBandRem}rem`;

  return (
    <Card className={dashboardPanelClassName}>
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-[1rem] font-semibold normal-case tracking-normal text-foreground">
              Spending trend
            </CardTitle>
            <p className="mt-1 text-sm leading-5 text-secondary-foreground">
              Compare daily spending across this period and spot anomalies quickly.
            </p>
          </div>
          <div className="grid gap-1.5 sm:grid-cols-2 xl:min-w-[386px] xl:grid-cols-4">
            <SummaryChip
              label="Daily average"
              value={formatCompactCurrency(averagePeriodSpend, { style: "chart" })}
              tone="primary"
              dotClassName={legendByLabel.get("Normal")}
            />
            <SummaryChip
              label="Highest day"
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
              label="Latest day"
              value={
                latestPeriod
                  ? formatCompactCurrency(latestPeriod.totalSpend, { style: "chart" })
                  : "No data"
              }
              helper={latestPeriod ? formatPeriod(latestPeriod.period) : undefined}
              tone="info"
              dotClassName={legendByLabel.get("Latest")}
            />
            <SummaryChip label="Vs previous period" value={changeSummary.value} />
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
          <div className="overflow-hidden rounded-[8px] border border-border/35 bg-[linear-gradient(180deg,rgba(10,17,14,0.62),rgba(8,13,11,0.76))] px-4 py-4 sm:px-5">
            <div
              className={cn(
                "grid min-w-0 grid-cols-[3.15rem_minmax(0,1fr)] gap-2.5 sm:gap-3",
                chartMinHeightClass
              )}
            >
              <div className="grid h-full min-h-0" style={{ gridTemplateRows: chartRowsTemplate }}>
                <div className="relative min-h-0" style={{ paddingTop: `${chartTopPaddingRem}rem` }}>
                  {chartTicks.map((tick) => (
                    <div
                      key={`${tick.ratio}-${tick.value}`}
                      className="absolute right-0 translate-y-1/2 text-right text-[11px] font-medium text-secondary-foreground/80 tabular-nums"
                      style={{ bottom: getChartTrackOffset(tick.ratio) }}
                    >
                      {formatCompactCurrency(tick.value, { style: "chart" })}
                    </div>
                  ))}
                </div>
                <div />
              </div>

              <div className="grid min-w-0" style={{ gridTemplateRows: chartRowsTemplate }}>
                <div className="relative min-h-0" style={{ paddingTop: `${chartTopPaddingRem}rem` }}>
                  {chartTicks.map((tick) => (
                    <div
                      key={`grid-${tick.ratio}-${tick.value}`}
                      className="pointer-events-none absolute inset-x-0 border-t border-border/14"
                      style={{ bottom: getChartTrackOffset(tick.ratio) }}
                    />
                  ))}
                  {averagePeriodSpend > 0 && chartMax > 0 ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 border-t border-dashed border-primary/22"
                      style={{ bottom: getChartTrackOffset(averagePeriodSpend / chartMax) }}
                    />
                  ) : null}

                  <div
                    className="grid h-full min-w-0 items-end gap-1.5 pr-1 sm:gap-2 sm:pr-2"
                    style={{ gridTemplateColumns: chartColumnsTemplate }}
                  >
                    {chartBuckets.map((bucket) => (
                      <Link
                        key={bucket.period}
                        href={bucket.href}
                        className="group relative flex h-full min-w-0 items-end rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
                        aria-label={bucket.ariaLabel}
                      >
                        <span className="pointer-events-none absolute bottom-full left-1/2 z-10 hidden w-44 -translate-x-1/2 -translate-y-2 rounded-[8px] border border-border/70 bg-popover px-3 py-2 text-center text-sm text-popover-foreground shadow-lg group-hover:block group-focus-visible:block">
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
                        <span className="flex h-full w-full items-end rounded-[3px] bg-secondary/10 px-[1px] pb-[1px]">
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
                      </Link>
                    ))}
                  </div>
                </div>

                <div
                  className="grid min-w-0 gap-1.5 pr-1 sm:gap-2 sm:pr-2"
                  style={{ gridTemplateColumns: chartColumnsTemplate }}
                >
                  {chartBuckets.map((bucket) => (
                    <div
                      key={`label-${bucket.period}`}
                      className="flex items-center justify-center px-1 pt-1.5 text-center text-[10px] font-medium leading-[1.15] text-secondary-foreground/85"
                    >
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
                    </div>
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
