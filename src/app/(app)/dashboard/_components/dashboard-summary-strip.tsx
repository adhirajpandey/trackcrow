"use client";

import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import {
  dashboardAttentionPanelClassName,
  dashboardPanelClassName,
  dashboardTopCardHelperClassName,
  dashboardTopCardLabelClassName,
  dashboardTopCardMetaClassName,
  dashboardTopCardValueClassName,
} from "./dashboard-style";
import { InfoTip } from "./dashboard-ui";
import {
  formatCurrency,
  formatNumber,
  formatShare,
  getComparisonLabel,
  median,
  pluralize,
  type CalendarDay,
  type CalendarRange,
} from "./dashboard-view-model";

export function DashboardSummaryStrip({
  data,
  calendar,
  days,
  uncategorizedAmount,
  onReview,
}: {
  data: DashboardPageData;
  calendar: CalendarRange;
  days: CalendarDay[];
  uncategorizedAmount: number;
  onReview: () => void;
}) {
  const elapsed = days.filter((day) => !day.future);
  const total = data.summary.totalSpend;
  const typical = median(elapsed.map((day) => day.total));
  const average = elapsed.length ? total / elapsed.length : 0;
  const activeDays = elapsed.filter((day) => day.count > 0).length;
  const comparison = data.comparison;
  const comparisonLabel = comparison ? getComparisonLabel(comparison, calendar) : null;
  const delta = comparison ? Math.round(total) - Math.round(comparison.summary.totalSpend) : null;
  const reviewCount = data.summary.uncategorizedCount;

  const cell = "flex min-w-0 flex-col p-4 sm:p-5";
  const label = (text: string, info: string) => (
    <div className="flex min-h-8 items-center gap-1.5">
      <p className={dashboardTopCardLabelClassName}>{text}</p>
      <InfoTip label={text}>{info}</InfoTip>
    </div>
  );

  return (
    <section aria-label="Summary" className="grid gap-3 lg:grid-cols-[minmax(0,3fr)_minmax(0,1.15fr)]">
      <div className={cn(dashboardPanelClassName, "grid grid-cols-2 sm:grid-cols-[1.4fr_1fr_1fr]")}>
        <div className={cn(cell, "col-span-2 border-b-2 border-border sm:col-span-1 sm:border-b-0 sm:border-r-2")}>
          {label("TOTAL SPENT", "Every payment recorded in this range, including transfers to people and investments.")}
          <p className={cn(dashboardTopCardValueClassName, "mt-1")}>{formatCurrency(total)}</p>
          {comparison && delta !== null && comparisonLabel ? (
            <>
              <p className={cn(dashboardTopCardMetaClassName, "mt-1.5 text-foreground")}>
                {delta === 0 ? `Same as ${comparisonLabel}` : `${delta > 0 ? "↑" : "↓"} ${formatCurrency(Math.abs(delta))} ${delta > 0 ? "more" : "less"} than ${comparisonLabel}`}
              </p>
              <p className={cn(dashboardTopCardHelperClassName, "mt-0.5")}>
                {comparisonLabel.replace(/^the /, "").replace(/^./, (letter) => letter.toUpperCase())}: {formatCurrency(comparison.summary.totalSpend)}
              </p>
            </>
          ) : (
            <p className={cn(dashboardTopCardHelperClassName, "mt-1.5")}>Across {pluralize(elapsed.length, "day")}.</p>
          )}
        </div>
        <div className={cn(cell, "border-r-2 border-border")}>
          {label("TYPICAL DAY", "The median day, counting days with no payments: half the days in this range were below it. One big payment doesn’t move it the way it moves the average.")}
          <p className={cn(dashboardTopCardValueClassName, "mt-1")}>{formatCurrency(typical)}</p>
          <p className={cn(dashboardTopCardMetaClassName, "mt-1.5")}>Median day</p>
          <p className={cn(dashboardTopCardHelperClassName, "mt-0.5")}>
            {typical === 0 && average > 0
              ? `Most days had no payments. Average ${formatCurrency(average)}.`
              : `Average ${formatCurrency(average)}${average > typical * 1.5 ? ", lifted by a few big days" : ""}`}
          </p>
        </div>
        <div className={cell}>
          {label("TRANSACTIONS", "Recorded payments in this range, and how many days had at least one.")}
          <p className={cn(dashboardTopCardValueClassName, "mt-1")}>{formatNumber(data.summary.transactionCount)}</p>
          <p className={cn(dashboardTopCardHelperClassName, "mt-1.5")}>On {activeDays} of {pluralize(elapsed.length, "day")}</p>
        </div>
      </div>
      <div className={cn(reviewCount ? dashboardAttentionPanelClassName : dashboardPanelClassName, cell, "justify-between gap-3")}>
        <div>
          {label("TO REVIEW", "Transactions without a category. Categorizing them makes your totals and rules accurate.")}
          {reviewCount ? (
            <>
              <p className={cn(dashboardTopCardValueClassName, "mt-1")}>{formatNumber(reviewCount)}</p>
              <p className={cn(dashboardTopCardHelperClassName, "mt-1.5 text-foreground")}>
                Uncategorized: {formatCurrency(uncategorizedAmount)}, {formatShare(uncategorizedAmount, total)}% of total spent
              </p>
            </>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-base font-bold">
              <Check className="h-5 w-5 text-primary" aria-hidden />
              {data.summary.transactionCount ? "Everything is categorized" : "Nothing to review"}
            </p>
          )}
        </div>
        {reviewCount ? (
          <Button variant="secondary" className="w-full sm:w-fit" onClick={onReview}>
            <span className="font-bold">Review uncategorized</span>
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Button>
        ) : null}
      </div>
    </section>
  );
}
