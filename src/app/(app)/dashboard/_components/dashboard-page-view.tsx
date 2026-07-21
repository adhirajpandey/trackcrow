import Link from "next/link";
import type { ReactNode } from "react";
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
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
import { DashboardCardInfo } from "./dashboard-card-info";
import {
  DashboardMobileTimePeriodRow,
  DashboardTimeframePicker,
} from "./dashboard-timeframe-picker";
import {
  buildChartDisplayPeriods,
  buildChartBuckets,
  buildChartTicks,
  buildComparisonPresentation,
  buildMostFrequentRecipient,
  buildTransactionsHref,
  buildUncategorizedTransactionsHref,
  buildWhatChangedSummary,
  chartLegendItems,
  formatCompactCurrency,
  formatCurrency,
  formatDashboardDateRange,
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
  dashboardSmallActionClassName,
  dashboardTopCardActionSlotClassName,
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

const chartHeightClass = "h-[15.5rem] sm:h-[24rem] xl:h-[26rem]";
const chartPlotInsetTopRem = 0.85;
const chartTooltipWidthRem = 13.5;

const dashboardCardDescriptions = {
  totalSpent:
    "Booked spending and transaction count for the selected timeframe, compared with the matching prior period.",
  biggestCategory:
    "The highest-spend categorised category for the selected timeframe. Uncategorised transactions are excluded.",
  topRecipient:
    "The recipient paid most often in the selected timeframe, including its total amount and rule recommendation.",
} as const;

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
  const changeSummary = buildWhatChangedSummary({
    summary: data.summary,
    comparison: data.comparison,
    periods: data.spendingByPeriod,
  });
  const displayRange = formatDashboardRangeLabel(data.range);
  const displayDateRange = formatDashboardDateRange(data.range);
  const spendComparison = buildComparisonPresentation(
    data.summary.totalSpend,
    data.comparison
  );
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
    <div className="space-y-4">
      <MobilePageHeader
        eyebrow="Spend operations"
        title="Dashboard"
        meta={<span className="font-medium text-foreground">{displayRange}</span>}
      />
      <div className="lg:hidden">
        <DashboardMobileTimePeriodRow
          value={data.range.value}
          startDate={data.range.startDate}
          endDate={data.range.endDate}
        />
      </div>
      <div className="hidden lg:block">
        <AppPageHeader
          eyebrow="Spend operations"
          title="Dashboard"
          meta={<span className="font-medium text-foreground">{displayRange}</span>}
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

      <section className="grid auto-rows-fr items-stretch gap-3 md:grid-cols-2 2xl:grid-cols-3">
        <div className="dashboard-reveal order-1 h-full">
          <MetricCard
            href={buildTransactionsHref(rangeParams)}
            label="TOTAL SPENT"
            description={dashboardCardDescriptions.totalSpent}
            value={formatCompactCurrency(data.summary.totalSpend, { style: "kpi" })}
            emphasis={spendComparison.full}
            emphasisTone={spendComparison.tone}
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
        <div className="dashboard-reveal order-2 h-full">
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
        <div className="dashboard-reveal order-3 h-full">
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
          displayRange={displayDateRange}
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
  description,
  value,
  emphasis,
  emphasisTone,
  details,
  actionLabel,
  icon,
}: {
  href: string;
  label: string;
  description: string;
  value: string;
  emphasis: string;
  emphasisTone?: "neutral" | "increase" | "decrease";
  details: Array<{ label: string; value: string }>;
  actionLabel?: string;
  icon: ReactNode;
}) {
  return (
    <TopDashboardCardFrame tone="mint">
      <TopDashboardCardHeader label={label} description={description} icon={icon} />
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
    <TopDashboardCardFrame tone="lilac">
      <TopDashboardCardHeader
        label="TOP RECIPIENT"
        description={dashboardCardDescriptions.topRecipient}
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
                  mobileValue:
                    recipient.action === "Create rule" ? "Rule candidate" : undefined,
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
    <TopDashboardCardFrame tone="blush">
      <TopDashboardCardHeader
        label="BIGGEST CATEGORY"
        description={dashboardCardDescriptions.biggestCategory}
        icon={<FolderTree className="h-4 w-4" />}
      />
      {category ? (
        <TopDashboardCardBody
          lead={
            <DashboardTopCardMetric
              value={category.category}
              valueTone="default"
              emphasis={`${formatCurrency(category.totalSpend)} spent`}
              entity
            />
          }
          details={
            <TopCardDetailList
              items={[
                {
                  label: "Share of categorised spend",
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
              value="No categorised spending yet"
              emphasis="Categorise transactions to reveal this insight."
              entity
            />
          }
          details={
            <p className={dashboardTopCardHelperClassName}>
              Categorise transactions to see your biggest category.
            </p>
          }
          action={<SecondaryCardAction href={emptyHref} label="Categorise" />}
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
  tone?: "default" | "mint" | "blush" | "lilac";
}) {
  return (
    <article
      className={cn(
        dashboardTopCardClassName,
        tone === "mint" && "bg-[var(--paper-mint)]",
        tone === "blush" && "bg-[var(--paper-blush)]",
        tone === "lilac" && "bg-[var(--paper-lilac)]"
      )}
    >
      {children}
    </article>
  );
}

function TopDashboardCardHeader({
  label,
  description,
  icon,
}: {
  label: string;
  description: string;
  icon: ReactNode;
}) {
  return (
    <div className={dashboardTopCardHeaderClassName}>
      <div className="flex min-w-0 items-center gap-2">
        <p className={dashboardTopCardLabelClassName}>
          {label}
        </p>
        <DashboardCardInfo label={label} description={description} />
      </div>
      <span
        className={cn(
          dashboardMetricIconClassName,
          "absolute right-0 top-0 border-border bg-card text-foreground"
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
}: {
  lead: ReactNode;
  details?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className={dashboardTopCardBodyClassName}>
      {lead}
      {details ? (
        <div className={dashboardTopCardDetailSectionClassName}>
          {details}
        </div>
      ) : null}
      {action ? <div className={dashboardTopCardActionSlotClassName}>{action}</div> : null}
    </div>
  );
}

function TopCardDetailList({
  items,
}: {
  items: Array<{ label: string; value: string; mobileValue?: string }>;
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      {items.map((item) => (
        <div
          key={`${item.label}-${item.value}`}
          className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 text-sm leading-5"
        >
          <span className="text-secondary-foreground">
            {item.label}
          </span>
          <span className="max-w-[16ch] text-right font-medium text-foreground overflow-wrap-anywhere">
            {item.mobileValue ? (
              <>
                <span className="sm:hidden">{item.mobileValue}</span>
                <span className="hidden sm:inline">{item.value}</span>
              </>
            ) : (
              item.value
            )}
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
  valueTone?: "default" | "primary";
  emphasisTone?:
    | "default"
    | "primary"
    | "strong"
    | "muted"
    | "neutral"
    | "increase"
    | "decrease";
  entity?: boolean;
}) {
  return (
    <div className={dashboardTopCardLeadStackClassName}>
      <p
        className={cn(
          entity ? dashboardTopCardEntityValueClassName : dashboardTopCardValueClassName,
          valueTone === "default" && "text-foreground",
          valueTone === "primary" && "text-primary",
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
            emphasisTone === "neutral" && "text-secondary-foreground",
            emphasisTone === "increase" && "text-destructive",
            emphasisTone === "decrease" && "text-primary"
          )}
        >
          {emphasis}
        </p>
      ) : null}
    </div>
  );
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
  const periodsShowingSecondaryLabel = new Set<string>();
  let lastVisibleSecondaryLabel: string | null = null;

  for (const bucket of chartBuckets) {
    if (
      bucket.showLabel &&
      bucket.label.secondary &&
      bucket.label.secondary !== lastVisibleSecondaryLabel
    ) {
      periodsShowingSecondaryLabel.add(bucket.period);
      lastVisibleSecondaryLabel = bucket.label.secondary;
    }
  }

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
          <div className="grid grid-cols-2 gap-1.5 xl:min-w-[386px] xl:grid-cols-4">
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
            <SummaryChip
              label={changeSummary.title}
              value={changeSummary.value}
              tone={changeSummary.tone}
            />
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
          <div className="rounded-[8px] border-2 border-border bg-[#fffaf0] py-3 pr-2.5 pl-0.5 sm:px-5 sm:py-4">
            <div
              className={cn(
                "grid min-w-0 grid-cols-[2.25rem_minmax(0,1fr)] gap-1 sm:grid-cols-[3.15rem_minmax(0,1fr)] sm:gap-3",
                chartHeightClass
              )}
            >
              <div
                className="grid h-full min-h-0 [grid-template-rows:0_minmax(0,1fr)_2.8rem] sm:[grid-template-rows:3.5rem_minmax(0,1fr)_2.8rem]"
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
                className="relative grid min-w-0 [grid-template-rows:0_minmax(0,1fr)_2.8rem] sm:[grid-template-rows:3.5rem_minmax(0,1fr)_2.8rem]"
              >
                <div className="min-h-0" />
                <div
                  className="relative min-h-0"
                  style={{ paddingTop: `${chartPlotInsetTopRem}rem` }}
                >
                  {chartTicks.map((tick) => (
                    <div
                      key={`grid-${tick.ratio}-${tick.value}`}
                      className="pointer-events-none absolute inset-x-0 border-t border-dashed border-border/25"
                      style={{ bottom: getChartTrackOffset(tick.ratio) }}
                    />
                  ))}
                  {averagePeriodSpend > 0 && chartMax > 0 ? (
                    <div
                      className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-[#2b9b69]/55"
                      style={{ bottom: getChartTrackOffset(averagePeriodSpend / chartMax) }}
                    >
                      <span className="absolute -top-4 right-0 bg-[#fffaf0] pl-1 text-[9px] font-semibold uppercase tracking-[0.08em] text-[#237b54]">
                        Avg
                      </span>
                    </div>
                  ) : null}

                  <div
                    className="grid h-full min-w-0 items-end gap-0.5 sm:gap-2 sm:pr-2"
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
                          <span className="block rounded-[8px] border-2 border-border bg-card px-3 py-2 text-left shadow-[3px_4px_0_var(--foreground)]">
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
                              "mt-1 block h-2.5 w-2.5 rotate-45 border-b-2 border-r-2 border-border bg-card",
                              getChartTooltipAlignment(index, chartBuckets.length) === "left" &&
                                "ml-5",
                              getChartTooltipAlignment(index, chartBuckets.length) === "center" &&
                                "mx-auto",
                              getChartTooltipAlignment(index, chartBuckets.length) === "right" &&
                                "mr-5 ml-auto"
                            )}
                          />
                        </span>
                        <span className="flex h-full w-full items-end">
                          <span
                            className={cn(
                              "mx-auto w-full max-w-5 rounded-t-[3px] transition-[background-color,filter,transform] duration-150 group-hover:-translate-y-0.5 group-hover:brightness-110 group-focus-visible:-translate-y-0.5 group-focus-visible:brightness-110",
                              bucket.isFuture &&
                                "bg-secondary/22 group-hover:translate-y-0 group-hover:brightness-100 group-focus-visible:translate-y-0 group-focus-visible:brightness-100",
                              bucket.isPlaceholder &&
                                !bucket.isFuture &&
                                "bg-primary/40",
                              bucket.isPeak && "border border-border bg-accent",
                              bucket.isLatest && !bucket.isPeak && "bg-info",
                              !bucket.isPeak &&
                                !bucket.isLatest &&
                                !bucket.isFuture &&
                                !bucket.isPlaceholder &&
                                "border border-border bg-primary"
                            )}
                            style={{ height: getChartBarHeight(bucket.height) }}
                          />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div
                  className="grid min-w-0 gap-0.5 sm:gap-2 sm:pr-2"
                  style={{ gridTemplateColumns: chartColumnsTemplate }}
                >
                  {chartBuckets.map((bucket, index) => (
                    <div
                      key={`label-${bucket.period}`}
                      className={cn(
                        "flex items-start justify-center pt-1.5 text-center text-[10px] font-medium leading-[1.15] text-secondary-foreground/85 sm:px-1",
                        index === 0 && "justify-start text-left",
                        index === chartBuckets.length - 1 && "justify-end text-right"
                      )}
                    >
                      {bucket.showLabel ? (
                        <span>
                          <span className="block">{bucket.label.primary}</span>
                          {bucket.label.secondary &&
                          periodsShowingSecondaryLabel.has(bucket.period) ? (
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
  tone?: "neutral" | "primary" | "accent" | "info" | "increase" | "decrease";
  dotClassName?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-[8px] border-2 border-border bg-card px-3 py-2",
        tone === "primary" && "bg-[var(--paper-mint)]",
        tone === "accent" && "bg-[#fff4d4]",
        tone === "info" && "bg-[#edf5ff]",
        tone === "increase" && "bg-[var(--paper-blush)]",
        tone === "decrease" && "bg-[var(--paper-mint)]"
      )}
    >
      <div className="flex items-center gap-2">
        {dotClassName ? <span className={cn("h-2.5 w-2.5 rounded-full", dotClassName)} /> : null}
        <p className="text-[11px] font-medium text-secondary-foreground">
          {label}
        </p>
      </div>
      <p
        className={cn(
          "mt-1 text-[13px] font-semibold text-foreground tabular-nums",
          tone === "increase" && "text-destructive",
          tone === "decrease" && "text-primary"
        )}
      >
        {value}
      </p>
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
    <div className="rounded-[8px] border-2 border-dashed border-border bg-secondary/45 p-4">
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
