import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Calendar,
  CheckCircle2,
  Clock3,
  FolderTree,
  UserRound,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AppPageHeader } from "@/components/product/app-page-header";
import { MobilePageHeader } from "@/components/product/mobile/mobile-primitives";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import { DashboardBottomSection } from "./dashboard-bottom-section";
import { DashboardTimeframePicker } from "./dashboard-timeframe-picker";
import {
  buildChartDisplayPeriods,
  buildChartBuckets,
  buildChartTicks,
  buildMostFrequentRecipient,
  buildMetricComparisons,
  buildReviewQueueCard,
  buildTransactionsHref,
  buildUncategorizedTransactionsHref,
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
} from "./dashboard-view-model";
import {
  dashboardMetricIconClassName,
  dashboardPanelClassName,
  dashboardPrimaryActionClassName,
  dashboardSmallActionClassName,
  dashboardTopCardActionSlotClassName,
  dashboardTopCardAttentionDetailSectionClassName,
  dashboardTopCardAttentionClassName,
  dashboardTopCardBodyClassName,
  dashboardTopCardClassName,
  dashboardTopCardDetailSectionClassName,
  dashboardTopCardEntityValueClassName,
  dashboardTopCardHeaderClassName,
  dashboardTopCardHelperClassName,
  dashboardTopCardLabelClassName,
  dashboardTopCardLeadStackClassName,
  dashboardTopCardMetaClassName,
  dashboardTopCardValueClassName,
} from "./dashboard-style";

const chartLabelBandRem = 2.8;
const chartTooltipBandRem = 3.5;
const chartHeightClass = "h-[22rem] sm:h-[24rem] xl:h-[26rem]";
const chartPlotInsetTopRem = 0.85;
const chartTooltipWidthRem = 13.5;

function getChartTrackOffset(ratio: number) {
  return `calc(${ratio * 100}% - ${ratio * chartPlotInsetTopRem}rem)`;
}

function getChartTooltipAlignment(index: number, total: number) {
  if (total <= 2 || index <= 1) {
    return "left";
  }

  if (index >= total - 2) {
    return "right";
  }

  return "center";
}

function getChartBarHeight(height: number) {
  if (height <= 0) {
    return "0";
  }

  return `max(1px, ${height}%)`;
}

export function DashboardPageView({ data }: { data: DashboardPageData }) {
  const hasTransactions = data.summary.transactionCount > 0;
  const knownSpendTotal = getKnownSpendTotal(data.spendingByCategory);
  const topCategoryInsight = getTopCategoryInsight(
    data.spendingByCategory,
    knownSpendTotal
  );
  const chartDisplayPeriods = buildChartDisplayPeriods({
    range: data.range,
    periods: data.spendingByPeriod,
  });
  const chartTicks = buildChartTicks(
    Math.max(...chartDisplayPeriods.map((item) => item.totalSpend), 1)
  );
  const chartMax = chartTicks[chartTicks.length - 1]?.value ?? 0;
  const periodLabelStep = getPeriodLabelStep(chartDisplayPeriods.length);
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
    periods: chartDisplayPeriods,
    peakPeriod,
    latestPeriod,
    chartMax,
    periodLabelStep,
    granularity: data.range.granularity,
  });
  const mostFrequentRecipient = buildMostFrequentRecipient({
    recipients: data.frequentRecipients,
  });

  return (
    <div className="space-y-3.5">
      <MobilePageHeader
        eyebrow="Spend operations"
        title="Dashboard"
        meta={
          <>
            <span className="font-medium text-foreground">{displayRange}</span>
            <Calendar className="h-3.5 w-3.5 text-secondary-foreground/80" />
          </>
        }
      />
      <div className="lg:hidden">
        <DashboardTimeframePicker
          value={data.range.value}
          startDate={data.range.startDate}
          endDate={data.range.endDate}
        />
      </div>
      <div className="hidden lg:block">
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
      </div>

      {data.status === "error" ? (
        <section className="rounded-[8px] border border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          {data.message}
        </section>
      ) : null}

      <section className="grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
        <div className="order-1">
          <ReviewQueueHero card={reviewQueue} />
        </div>
        <div className="order-2">
          <MetricCard
            href={buildTransactionsHref(rangeParams)}
            label="Total spent"
            value={formatCompactCurrency(data.summary.totalSpend, { style: "kpi" })}
            emphasis={metricComparisons.totalSpend}
            emphasisTone={getSpendComparisonTone(
              data.summary.totalSpend,
              data.comparison?.summary.totalSpend
            )}
            details={[
              { label: "Booked spend", value: formatCurrency(data.summary.totalSpend) },
              {
                label: "Transactions",
                value: formatNumber(data.summary.transactionCount),
              },
            ]}
            actionLabel="View transactions"
            icon={<Wallet className="h-4.5 w-4.5" />}
          />
        </div>
        <div className="order-3">
          <TopCategoryCard
            category={topCategoryInsight}
            emptyHref={
              data.summary.uncategorizedCount > 0
                ? buildUncategorizedTransactionsHref(data.range)
                : buildTransactionsHref(rangeParams)
            }
            href={
              topCategoryInsight
                ? buildTransactionsHref({
                    ...rangeParams,
                    category: topCategoryInsight.category,
                  })
                : "/transactions"
            }
          />
        </div>
        <div className="order-4">
          <MostFrequentRecipientCard recipient={mostFrequentRecipient} />
        </div>
      </section>

      <section className="grid gap-3">
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
          displayRange={displayRange}
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

function MetricCard({
  href,
  label,
  value,
  emphasis,
  emphasisTone,
  details,
  actionLabel,
  icon,
}: {
  href: string;
  label: string;
  value: string;
  emphasis: string;
  emphasisTone?: "default" | "positive" | "negative";
  details: Array<{ label: string; value: string }>;
  actionLabel?: string;
  icon: ReactNode;
}) {
  return (
    <TopDashboardCardFrame>
      <TopDashboardCardHeader label={label} icon={icon} />
      <TopDashboardCardBody
        lead={
          <DashboardTopCardMetric
            value={value}
            valueTone="default"
            emphasis={emphasis}
            emphasisTone={emphasisTone}
          />
        }
        details={<TopCardDetailList items={details} />}
        action={
          actionLabel ? <SecondaryCardAction href={href} label={actionLabel} /> : undefined
        }
      />
    </TopDashboardCardFrame>
  );
}

function MostFrequentRecipientCard({
  recipient,
}: {
  recipient: ReturnType<typeof buildMostFrequentRecipient>;
}) {
  const recipientHref = recipient?.href ?? "/recipients";

  return (
    <TopDashboardCardFrame>
      <TopDashboardCardHeader
        label="Most frequent recipient"
        icon={<UserRound className="h-4 w-4" />}
      />
      {recipient ? (
        <TopDashboardCardBody
          lead={
            <DashboardTopCardMetric
              value={recipient.recipient}
              emphasis={`${formatNumber(recipient.paymentCount)} payments this period`}
              emphasisTone="strong"
              entity
            />
          }
          details={
            <TopCardDetailList
              items={[
                {
                  label: "Total amount",
                  value: formatCurrency(recipient.totalAmount),
                },
                {
                  label: "Recommendation",
                  value: recipient.helper,
                },
              ]}
            />
          }
          action={
            <SecondaryCardAction
              href={recipientHref}
              label={recipient.action === "Create rule" ? "Create rule" : "View recipient"}
            />
          }
        />
      ) : (
        <TopDashboardCardBody
          lead={
            <DashboardTopCardMetric
              value="No repeated recipients yet"
              emphasis="Repeated payments will appear here."
              emphasisTone="muted"
              entity
            />
          }
          action={<SecondaryCardAction href={recipientHref} label="View recipients" />}
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

  return (
    <TopDashboardCardFrame tone="attention">
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
        tone="attention"
        lead={
          <DashboardTopCardMetric
            value={formatNumber(card.totalReviewCount)}
            valueTone="accent"
            emphasis={
              card.hasItems
                ? "Transaction review workload"
                : "No transaction review backlog"
            }
            emphasisTone="strong"
          />
        }
        details={
          <TopCardDetailList
            tone="attention"
            items={[
              {
                label: "Need category",
                value: formatNumber(needsCategoryTask?.count ?? 0),
              },
              {
                label: "Large transactions",
                value: formatNumber(largeTransactionsTask?.count ?? 0),
              },
              {
                label: "Possible rules",
                value: formatNumber(ruleMatchesTask?.count ?? 0),
              },
            ]}
          />
        }
        action={
          <Button
            asChild
            variant="ghost"
            className={cn(
              dashboardPrimaryActionClassName,
              "w-full border border-accent/35 bg-accent text-accent-foreground hover:border-accent/45 hover:bg-[#f6c251]"
            )}
          >
            <Link href={card.hasItems ? card.href : buildTransactionsHref({})}>
              {card.hasItems ? "Review now" : "View transactions"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        }
      />
    </TopDashboardCardFrame>
  );
}

function TopCategoryCard({
  category,
  href,
  emptyHref,
}: {
  category: ReturnType<typeof getTopCategoryInsight>;
  href: string;
  emptyHref: string;
}) {
  return (
    <TopDashboardCardFrame>
      <TopDashboardCardHeader
        label="Top known category"
        icon={<FolderTree className="h-4 w-4" />}
      />
      {category ? (
        <TopDashboardCardBody
          lead={
            <DashboardTopCardMetric
              value={category.category}
              valueTone="primary"
              emphasis={`${formatCurrency(category.totalSpend)} spent`}
              entity
            />
          }
          details={
            <TopCardDetailList
              items={[
                {
                  label: "Share of known spend",
                  value: `${category.share}%`,
                },
                {
                  label: "Top subcategory",
                  value: category.topSubcategory
                    ? `${category.topSubcategory.name} - ${formatCurrency(category.topSubcategory.totalSpend)}`
                    : "Not enough detail yet",
                },
              ]}
            />
          }
          action={<SecondaryCardAction href={href} label="View category" />}
        />
      ) : (
        <TopDashboardCardBody
          lead={
            <DashboardTopCardMetric
              value="No known category yet"
              emphasis="Known spend only"
              entity
            />
          }
          details={
            <p className={dashboardTopCardHelperClassName}>
              Categorize transactions to surface leaders.
            </p>
          }
          action={<SecondaryCardAction href={emptyHref} label="Categorize" />}
        />
      )}
    </TopDashboardCardFrame>
  );
}

function TopDashboardCardFrame({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "attention";
}) {
  return (
    <article
      className={tone === "attention" ? dashboardTopCardAttentionClassName : dashboardTopCardClassName}
    >
      {children}
    </article>
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
  lead,
  details,
  action,
  tone = "default",
}: {
  lead: ReactNode;
  details?: ReactNode;
  action?: ReactNode;
  tone?: "default" | "attention";
}) {
  return (
    <div className={dashboardTopCardBodyClassName}>
      {lead}
      {details ? (
        <div
          className={
            tone === "attention"
              ? dashboardTopCardAttentionDetailSectionClassName
              : dashboardTopCardDetailSectionClassName
          }
        >
          {details}
        </div>
      ) : null}
      {action ? <div className={dashboardTopCardActionSlotClassName}>{action}</div> : null}
    </div>
  );
}

function TopCardDetailList({
  items,
  tone = "default",
}: {
  items: Array<{ label: string; value: string }>;
  tone?: "default" | "attention";
}) {
  return (
    <div className="space-y-2.5">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 text-sm leading-5"
        >
          <span
            className={cn(
              "text-secondary-foreground",
              tone === "attention" && "text-secondary-foreground/95"
            )}
          >
            {item.label}
          </span>
          <span className="max-w-[16ch] text-right font-medium text-foreground overflow-wrap-anywhere">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function DashboardTopCardMetric({
  value,
  emphasis,
  valueTone = "default",
  emphasisTone = "default",
  entity = false,
}: {
  value: string;
  emphasis?: string;
  valueTone?: "default" | "primary" | "accent";
  emphasisTone?: "default" | "primary" | "strong" | "muted" | "positive" | "negative";
  entity?: boolean;
}) {
  return (
    <div className={dashboardTopCardLeadStackClassName}>
      <p
        className={cn(
          entity ? dashboardTopCardEntityValueClassName : dashboardTopCardValueClassName,
          valueTone === "default" && "text-foreground",
          valueTone === "primary" && "text-primary",
          valueTone === "accent" && "text-accent"
        )}
      >
        {value}
      </p>
      {emphasis ? (
        <p
          className={cn(
            dashboardTopCardMetaClassName,
            emphasisTone === "default" && "text-secondary-foreground",
            emphasisTone === "primary" && "text-primary/90",
            emphasisTone === "strong" && "text-foreground",
            emphasisTone === "muted" && "text-secondary-foreground",
            emphasisTone === "positive" && "text-destructive",
            emphasisTone === "negative" && "text-primary"
          )}
        >
          {emphasis}
        </p>
      ) : null}
    </div>
  );
}

function getSpendComparisonTone(current: number, previous: number | null | undefined) {
  if (previous === null || previous === undefined || current === previous) {
    return "default";
  }

  return current > previous ? "positive" : "negative";
}

function SecondaryCardAction({
  href,
  label,
  tone = "secondary",
}: {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
}) {
  return (
    <Button
      asChild
      variant="secondary"
      className={cn(
        dashboardSmallActionClassName,
        "w-full text-sm sm:w-fit",
        tone === "primary"
          ? "border-primary/18 bg-primary/8 text-primary hover:bg-primary/12"
          : "border-border/45 bg-background/10 text-secondary-foreground hover:border-border/70 hover:text-foreground"
      )}
    >
      <Link href={href}>
        {label}
        <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
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
  displayRange,
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
  displayRange: string;
}) {
  const legendByLabel = new Map(chartLegendItems.map((item) => [item.label, item.className]));
  const chartColumnsTemplate = `repeat(${Math.max(chartBuckets.length, 1)}, minmax(0, 1fr))`;

  return (
    <Card className={dashboardPanelClassName}>
      <CardHeader className="space-y-3 pb-2">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <CardTitle className="text-[1rem] font-semibold normal-case tracking-normal text-foreground">
              Spending trend
            </CardTitle>
            <p className="mt-1 text-sm leading-5 text-secondary-foreground">
              Daily spend across {displayRange}.
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
          <div className="rounded-[8px] border border-border/35 bg-[linear-gradient(180deg,rgba(10,17,14,0.62),rgba(8,13,11,0.76))] px-4 py-4 sm:px-5">
            <div
              className={cn(
                "grid min-w-0 grid-cols-[3.15rem_minmax(0,1fr)] gap-2.5 sm:gap-3",
                chartHeightClass
              )}
            >
              <div
                className="grid h-full min-h-0"
                style={{
                  gridTemplateRows: `${chartTooltipBandRem}rem minmax(0,1fr) ${chartLabelBandRem}rem`,
                }}
              >
                <div />
                <div
                  className="relative min-h-0"
                  style={{ paddingTop: `${chartPlotInsetTopRem}rem` }}
                >
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

              <div
                className="relative grid min-w-0"
                style={{
                  gridTemplateRows: `${chartTooltipBandRem}rem minmax(0,1fr) ${chartLabelBandRem}rem`,
                }}
              >
                <div className="min-h-0" />
                <div
                  className="relative min-h-0"
                  style={{ paddingTop: `${chartPlotInsetTopRem}rem` }}
                >
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
                    {chartBuckets.map((bucket, index) => (
                      <Link
                        key={bucket.period}
                        href={bucket.href ?? "#"}
                        className={cn(
                          "group relative flex h-full min-w-0 items-end rounded-md focus-visible:outline-none",
                          bucket.href
                            ? "focus-visible:ring-2 focus-visible:ring-primary/70"
                            : "pointer-events-none cursor-default opacity-75"
                        )}
                        aria-label={bucket.ariaLabel}
                        tabIndex={bucket.href ? undefined : -1}
                      >
                        <span
                          className={cn(
                            "pointer-events-none absolute bottom-[calc(100%+0.75rem)] z-20 hidden",
                            "group-hover:block group-focus-visible:block"
                          )}
                          style={{
                            width: `${chartTooltipWidthRem}rem`,
                            ...(getChartTooltipAlignment(index, chartBuckets.length) === "left"
                              ? { left: 0 }
                              : getChartTooltipAlignment(index, chartBuckets.length) === "right"
                                ? { right: 0 }
                                : { left: "50%", transform: "translateX(-50%)" }),
                          }}
                        >
                          <span className="block rounded-[8px] border border-border/70 bg-[linear-gradient(180deg,rgba(28,39,33,0.98),rgba(18,27,22,0.98))] px-3 py-2 text-left shadow-[0_16px_40px_rgba(0,0,0,0.32)] backdrop-blur-sm">
                            <span className="text-[11px] font-semibold text-foreground">
                              {bucket.tooltip.title}
                            </span>
                            <span className="mt-1 block text-sm font-semibold text-foreground tabular-nums">
                              {bucket.tooltip.amountLabel}
                            </span>
                            <span className="mt-1 block text-[11px] leading-4 text-secondary-foreground">
                              {bucket.tooltip.transactionLabel}
                            </span>
                          </span>
                          <span
                            className={cn(
                              "mt-1 block h-2.5 w-2.5 rotate-45 border-b border-r border-border/70 bg-[rgb(18,27,22)]",
                              getChartTooltipAlignment(index, chartBuckets.length) === "left" &&
                                "ml-5",
                              getChartTooltipAlignment(index, chartBuckets.length) === "center" &&
                                "mx-auto",
                              getChartTooltipAlignment(index, chartBuckets.length) === "right" &&
                                "mr-5 ml-auto"
                            )}
                          />
                        </span>
                        <span className="flex h-full w-full items-end rounded-[3px] bg-secondary/10 px-[1px] pb-[1px]">
                          <span
                            className={cn(
                              "w-full rounded-[2px] transition-[background-color,filter,transform] duration-150 group-hover:-translate-y-0.5 group-hover:brightness-110 group-focus-visible:-translate-y-0.5 group-focus-visible:brightness-110",
                              bucket.isFuture &&
                                "bg-secondary/22 group-hover:translate-y-0 group-hover:brightness-100 group-focus-visible:translate-y-0 group-focus-visible:brightness-100",
                              bucket.isPlaceholder &&
                                !bucket.isFuture &&
                                "bg-primary/35",
                              bucket.isPeak && "bg-accent",
                              bucket.isLatest && !bucket.isPeak && "bg-info",
                              !bucket.isPeak &&
                                !bucket.isLatest &&
                                !bucket.isFuture &&
                                !bucket.isPlaceholder &&
                                "bg-primary/90"
                            )}
                            style={{ height: getChartBarHeight(bucket.height) }}
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
                            <span className="block text-[9px] text-secondary-foreground">
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
        <p className="text-[11px] font-medium text-secondary-foreground">
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
