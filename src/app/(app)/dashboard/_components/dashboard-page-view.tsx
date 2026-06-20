import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, BarChart3, CheckCircle2, Clock3 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import { DashboardTimeframePicker } from "./dashboard-timeframe-picker";
import {
  buildChartTicks,
  buildPeriodTransactionsHref,
  buildReviewQueueCard,
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

  return (
    <div className="space-y-6">
      <section className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-[11px] font-semibold uppercase text-primary">
                Dashboard
              </p>
              <DashboardTimeframePicker
                value={data.range.value}
                startDate={data.range.startDate}
                endDate={data.range.endDate}
              />
            </div>
            <h1 className="mt-4 max-w-2xl text-[32px] font-bold leading-tight text-foreground lg:text-4xl">
              Spending overview
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              See where your money went and what needs a quick check.
            </p>
          </div>
        </div>
      </section>

      {data.status === "error" ? (
        <section className="rounded-lg border border-destructive/70 bg-destructive/10 p-4 text-sm text-foreground">
          {data.message}
        </section>
      ) : null}

      <section className="space-y-4">
        <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
          <MetricLink
            href={buildTransactionsHref(rangeParams)}
            label="Total spent"
            value={formatCompactCurrency(data.summary.totalSpend)}
            helper={`${formatCurrency(data.summary.totalSpend)} across ${formatNumber(
              data.summary.transactionCount
            )} transactions`}
            tone="primary"
          />
          <MetricLink
            href={buildTransactionsHref(rangeParams)}
            label="Average spend"
            value={formatCompactCurrency(data.summary.averageSpend)}
            helper={`Across ${formatNumber(data.summary.transactionCount)} transactions`}
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
      className="group rounded-lg border border-accent/30 bg-card p-5 transition-colors hover:border-accent/55 hover:bg-secondary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-card-foreground">{card.title}</p>
        </div>
        {card.hasItems ? (
          <Clock3 className="h-4 w-4 text-accent" aria-hidden="true" />
        ) : (
          <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" />
        )}
      </div>
      <div className="mt-5 space-y-1.5">
        {card.lines.map((line, index) => (
          <p
            key={`${line}-${index}`}
            className={cn(
              "text-sm leading-5",
              index === 0 ? "font-semibold text-foreground" : "text-muted-foreground",
              !card.hasItems && index === 0 && "text-primary"
            )}
          >
            {line}
          </p>
        ))}
        {card.helper ? <p className="text-sm leading-5 text-muted-foreground">{card.helper}</p> : null}
      </div>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary">
        {card.action}
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
        "group rounded-lg border border-border bg-card p-5 transition-colors hover:border-input hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        tone === "primary" && "border-primary/35 bg-primary/5"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-card-foreground">{label}</p>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <p
        className={cn(
          "mt-5 break-words font-semibold leading-tight tabular-nums",
          tone === "primary" && "text-3xl text-primary",
          tone === "secondary" && "text-3xl text-foreground",
          tone === "insight" && "text-2xl text-foreground"
        )}
      >
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-muted-foreground">{helper}</p>
    </Link>
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
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Spending trend</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Compare spending across this period.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
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
          <div className="grid h-[360px] min-w-0 grid-cols-[4rem_minmax(0,1fr)] gap-3 rounded-lg border border-border/80 bg-muted/45 p-4">
            <div className="relative h-full pb-12 pt-2">
              {chartTicks.map((tick) => (
                <div
                  key={`${tick.ratio}-${tick.value}`}
                  className="absolute right-0 translate-y-1/2 text-right text-[11px] text-muted-foreground/90 tabular-nums"
                  style={{ bottom: `calc(3rem + ${tick.ratio * 100}% - ${tick.ratio * 3}rem)` }}
                >
                  {formatCompactCurrency(tick.value)}
                </div>
              ))}
            </div>
            <div className="relative min-w-0 pb-12 pt-2">
              {chartTicks.map((tick) => (
                <div
                  key={`grid-${tick.ratio}-${tick.value}`}
                  className="pointer-events-none absolute inset-x-0 border-t border-border/35"
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
                className="grid h-full min-w-0 items-end gap-1.5"
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
                      className="group relative flex h-full min-w-0 flex-col items-center justify-end gap-2 rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                      <span className="flex h-[calc(100%-3rem)] w-full items-end rounded-sm bg-secondary/75">
                        <span
                          className={cn(
                            "w-full rounded-sm transition-colors",
                            isPeak && "bg-accent shadow-[0_0_10px_rgba(242,184,75,0.18)]",
                            isLatest && !isPeak && "bg-info",
                            !isPeak && !isLatest && "bg-primary/80 group-hover:bg-primary"
                          )}
                          style={{
                            height: `${
                              chartMax > 0 ? Math.max(4, (item.totalSpend / chartMax) * 100) : 4
                            }%`,
                          }}
                        />
                      </span>
                      <span className="flex h-10 items-start justify-center text-center text-[11px] leading-tight text-muted-foreground/95">
                        {showLabel ? (
                          <span>
                            <span className="block">{label.primary}</span>
                            {label.secondary ? (
                              <span className="block text-[10px] text-muted-foreground">
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
    <div className="rounded-md border border-border bg-muted/60 px-3 py-2 text-right">
      <p className="text-[10px] font-semibold uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-[11px] font-semibold text-foreground tabular-nums">{content}</p>
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
        <CardTitle>Where your money went</CardTitle>
        <p className="mt-2 text-sm text-muted-foreground">
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
                      {isUncategorized ? <Badge tone="attention">Needs category</Badge> : null}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatNumber(item.transactionCount)} transactions {"\u00b7"} {share}% of spending
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
            <CardTitle>Largest transactions</CardTitle>
            <p className="mt-2 text-sm text-muted-foreground">
              Highest-value transactions in this period.
            </p>
          </div>
          <Link
            href={buildTransactionsHref({
              ...getRangeParams(range),
              sortBy: "amount",
              sortOrder: "desc",
            })}
            className="inline-flex min-h-9 shrink-0 items-center rounded-md border border-border bg-secondary px-3 text-sm font-semibold text-secondary-foreground transition-colors hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
              className="group flex items-start justify-between gap-3 rounded-md border border-border/70 bg-muted/45 px-3 py-3 transition-colors hover:border-input hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          {helper ? <p className="mt-1 text-sm text-muted-foreground">{helper}</p> : null}
        </div>
      </div>
    </div>
  );
}
