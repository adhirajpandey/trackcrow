import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import {
  buildChartTicks,
  formatPeriodLabel,
  getCategoryShare,
  getPeakPeriod,
  getPeriodLabelStep,
  getTopCategoryInsight,
} from "./dashboard-view-model";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const compactCurrencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

const numberFormatter = new Intl.NumberFormat("en-IN");

function formatCurrency(value: number) {
  return currencyFormatter.format(value);
}

function formatCompactCurrency(value: number) {
  return compactCurrencyFormatter.format(value);
}

function formatNumber(value: number) {
  return numberFormatter.format(value);
}

function formatPeriod(period: string) {
  if (/^\d{4}-\d{2}$/.test(period)) {
    const [year, month] = period.split("-");
    return new Intl.DateTimeFormat("en-IN", {
      month: "short",
      year: "numeric",
    }).format(new Date(Number(year), Number(month) - 1, 1));
  }

  return period;
}

export function DashboardPageView({ data }: { data: DashboardPageData }) {
  const hasTransactions = data.summary.transactionCount > 0;
  const maxCategorySpend = Math.max(
    ...data.spendingByCategory.map((item) => item.totalSpend),
    1
  );
  const maxPeriodSpend = Math.max(
    ...data.spendingByPeriod.map((item) => item.totalSpend),
    1
  );
  const periodLabelStep = getPeriodLabelStep(data.spendingByPeriod.length);
  const peakPeriod = getPeakPeriod(data.spendingByPeriod);
  const topCategoryInsight = getTopCategoryInsight(
    data.spendingByCategory,
    data.summary.totalSpend
  );
  const chartTicks = buildChartTicks(maxPeriodSpend);
  const currentPeriod =
    data.spendingByPeriod[data.spendingByPeriod.length - 1] ?? null;

  return (
    <div className="space-y-6">
      <section className="border-b border-border pb-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                Dashboard
              </p>
              <div className="inline-flex min-h-9 items-center gap-2 border border-border bg-card px-3 text-sm text-secondary-foreground">
                <span>{data.rangeLabel}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <h1 className="mt-4 max-w-2xl text-4xl font-bold leading-tight sm:text-5xl">
              Spending command center
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
              Server-rendered totals from the dashboard service, arranged for fast
              weekly review instead of raw metric dumping.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[18rem]">
            <div className="border border-border bg-card px-4 py-4 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                Range
              </p>
              <p className="mt-3 text-lg font-semibold text-foreground">
                {data.rangeLabel}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                Current dashboard snapshot
              </p>
            </div>
            {peakPeriod ? (
              <div className="border border-border bg-card px-4 py-4 text-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
                  Peak month
                </p>
                <p className="mt-3 text-lg font-semibold text-foreground">
                  {formatPeriod(peakPeriod.period)}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {formatCurrency(peakPeriod.totalSpend)}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {data.status === "error" ? (
        <section className="border border-destructive/70 bg-destructive/10 p-4 text-sm text-foreground">
          {data.message}
        </section>
      ) : null}

      <section className="space-y-4 border border-border bg-muted/35 p-4 lg:p-5">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1.3fr_0.95fr_0.95fr_1.1fr]">
          <MetricCard
            label="Total spend"
            value={formatCurrency(data.summary.totalSpend)}
            helper={`${formatNumber(data.summary.transactionCount)} transactions`}
            tone="primary"
          />
          <MetricCard
            label="Average spend"
            value={formatCurrency(data.summary.averageSpend)}
            helper="Per transaction"
            tone="secondary"
          />
          <MetricCard
            label="Categorized"
            value={`${formatNumber(data.summary.categorizedCount)}`}
            helper={`${formatNumber(data.summary.uncategorizedCount)} uncategorized`}
            tone="secondary"
          />
          <InsightCard
            label="Top category"
            title={topCategoryInsight?.category ?? "No category yet"}
            helper={
              topCategoryInsight
                ? `${topCategoryInsight.share}% of spend across ${formatNumber(
                    topCategoryInsight.transactionCount
                  )} transactions`
                : "No spend yet"
            }
            detail={
              topCategoryInsight
                ? formatCurrency(topCategoryInsight.totalSpend)
                : null
            }
          />
        </div>

        {!hasTransactions ? (
          <section className="border border-dashed border-border bg-card p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              No transactions
            </p>
            <h2 className="mt-3 text-2xl font-bold">Dashboard data will appear here.</h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
              Add or import transactions through the existing API-backed flows and
              this page will render totals, categories, and period trends.
            </p>
          </section>
        ) : (
          <section className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
            <Card className="min-w-0">
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle>Spending by category</CardTitle>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Ranked by total spend across the current range.
                  </p>
                </div>
                {topCategoryInsight ? (
                  <div className="rounded-sm border border-border bg-muted/50 px-3 py-2 text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                      Largest
                    </p>
                    <p className="mt-2 text-sm font-semibold text-foreground">
                      {topCategoryInsight.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {topCategoryInsight.share}% share
                    </p>
                  </div>
                ) : null}
              </CardHeader>
              <CardContent className="space-y-5">
                {data.spendingByCategory.map((item) => {
                  const share = getCategoryShare(
                    item.totalSpend,
                    data.summary.totalSpend
                  );

                  return (
                    <div key={item.category} className="space-y-2.5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-card-foreground">
                            {item.category}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {formatNumber(item.transactionCount)} transactions · {share}% of
                            spend
                          </p>
                        </div>
                        <span className="font-mono text-sm text-muted-foreground">
                          {formatCurrency(item.totalSpend)}
                        </span>
                      </div>
                      <div className="h-2 bg-secondary">
                        <div
                          className="h-2 bg-primary"
                          style={{
                            width: `${Math.max(
                              6,
                              (item.totalSpend / maxCategorySpend) * 100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card className="min-w-0">
              <CardHeader className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <CardTitle>Spending over time</CardTitle>
                    <p className="mt-2 text-sm text-muted-foreground">
                      Peak month and recent run-rate in the current range.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-right lg:w-[15rem]">
                    <ChartSummary
                      label="Peak"
                      value={
                        peakPeriod
                          ? formatCompactCurrency(peakPeriod.totalSpend)
                          : "-"
                      }
                      helper={peakPeriod ? formatPeriod(peakPeriod.period) : "No data"}
                    />
                    <ChartSummary
                      label="Latest"
                      value={
                        currentPeriod
                          ? formatCompactCurrency(currentPeriod.totalSpend)
                          : "-"
                      }
                      helper={currentPeriod ? formatPeriod(currentPeriod.period) : "No data"}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="min-w-0">
                <div className="grid gap-4 xl:grid-cols-[3.5rem_minmax(0,1fr)]">
                  <div className="relative h-80">
                    {chartTicks.map((tick) => (
                      <div
                        key={tick.ratio}
                        className="absolute inset-x-0 flex items-center"
                        style={{ bottom: `${tick.ratio * 100}%` }}
                      >
                        <span className="text-[10px] leading-none text-muted-foreground">
                          {formatCompactCurrency(tick.value)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="relative h-80 border border-border/70 bg-muted/50 px-4 pb-4 pt-6">
                    <div
                      className="grid h-full min-w-0 items-end gap-2"
                      style={{
                        gridTemplateColumns: `repeat(${Math.max(
                          data.spendingByPeriod.length,
                          1
                        )}, minmax(0, 1fr))`,
                      }}
                    >
                      {data.spendingByPeriod.map((item, index) => {
                        const label = formatPeriodLabel(item.period);
                        const isPeak = peakPeriod?.period === item.period;
                        const showLabel =
                          index === 0 ||
                          index === data.spendingByPeriod.length - 1 ||
                          index % periodLabelStep === 0;

                        return (
                          <div
                            key={item.period}
                            className="flex min-w-0 flex-col items-center justify-end gap-2"
                          >
                            <div className="flex h-60 w-full items-end bg-secondary/95">
                              <div
                                className={
                                  isPeak
                                    ? "w-full bg-primary shadow-[0_0_20px_rgba(250,255,105,0.18)]"
                                    : "w-full bg-primary/92"
                                }
                                style={{
                                  height: `${Math.max(
                                    6,
                                    (item.totalSpend / maxPeriodSpend) * 100
                                  )}%`,
                                }}
                                title={`${formatPeriod(item.period)}: ${formatCurrency(
                                  item.totalSpend
                                )}`}
                              />
                            </div>
                            <span className="flex min-h-9 items-start justify-center text-center text-[11px] leading-tight text-muted-foreground">
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
                          </div>
                        );
                      })}
                    </div>

                    {peakPeriod ? (
                      <div className="absolute right-4 top-4 border border-primary/30 bg-background/95 px-3 py-2 text-xs text-foreground">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
                          Peak
                        </p>
                        <p className="mt-1 font-semibold">
                          {formatPeriod(peakPeriod.period)}
                        </p>
                        <p className="mt-1 text-muted-foreground">
                          {formatCompactCurrency(peakPeriod.totalSpend)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}
      </section>
    </div>
  );
}

function MetricCard({
  label,
  value,
  helper,
  tone,
}: {
  label: string;
  value: string;
  helper: string;
  tone: "primary" | "secondary";
}) {
  return (
    <Card className={tone === "primary" ? "bg-card" : "bg-card/88"}>
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p
          className={
            tone === "primary"
              ? "break-words text-4xl font-bold leading-tight text-primary"
              : "break-words text-3xl font-semibold leading-tight text-foreground"
          }
        >
          {value}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
      </CardContent>
    </Card>
  );
}

function InsightCard({
  label,
  title,
  helper,
  detail,
}: {
  label: string;
  title: string;
  helper: string;
  detail: string | null;
}) {
  return (
    <Card className="bg-card/88">
      <CardHeader>
        <CardTitle>{label}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="break-words text-3xl font-bold leading-tight text-primary">
          {title}
        </p>
        <p className="mt-2 text-sm text-muted-foreground">{helper}</p>
        {detail ? <p className="mt-4 text-sm font-mono text-foreground/85">{detail}</p> : null}
      </CardContent>
    </Card>
  );
}

function ChartSummary({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="border border-border bg-muted/45 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-primary">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{helper}</p>
    </div>
  );
}
