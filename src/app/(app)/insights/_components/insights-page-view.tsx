"use client";

import { CalendarDays, Clock3, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppPageHeader } from "@/components/product/app-page-header";
import { MobilePageHeader } from "@/components/product/mobile/mobile-primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { InsightsPageData, InsightsTab } from "@/server/page-data/insights-page-data";

import { dashboardPanelClassName } from "@/app/(app)/dashboard/_components/dashboard-style";
import { DashboardMobileTimePeriodRow, DashboardTimeframePicker } from "@/app/(app)/dashboard/_components/dashboard-timeframe-picker";
import { segmentClassName, segmentItemClassName } from "@/app/(app)/dashboard/_components/dashboard-ui";
import {
  buildCalendarDays,
  formatCurrency,
  formatDashboardRangeLabel,
  formatNumber,
  formatShare,
  getCalendarRange,
  getComparisonLabel,
  getRangeName,
  getRangeShortName,
  pluralize,
} from "@/app/(app)/dashboard/_components/dashboard-view-model";

import { InsightsCalendar } from "./insights-calendar";
import { InsightsPatterns } from "./insights-patterns";
import { InsightsRecipients } from "./insights-recipients";

const TABS: Array<{ value: InsightsTab; label: string; icon: typeof CalendarDays; key: string }> = [
  { value: "calendar", label: "Calendar", icon: CalendarDays, key: "c" },
  { value: "recipients", label: "Recipients", icon: Users, key: "r" },
  { value: "patterns", label: "Patterns", icon: Clock3, key: "p" },
];

const TAB_HINTS: Record<InsightsTab, string> = {
  calendar: "When money went out. Pick a day to see its transactions.",
  recipients: "Who money went to, and how often.",
  patterns: "Your habits by weekday and time of day.",
};

export function InsightsPageView({ data, initialReviewOnly = false }: { data: InsightsPageData; initialReviewOnly?: boolean }) {
  const router = useRouter();
  const calendar = useMemo(() => getCalendarRange(data.range, data.today, data.days), [data.range, data.today, data.days]);
  const days = useMemo(() => buildCalendarDays(calendar, data.days), [calendar, data.days]);
  const meta = <span className="font-medium text-foreground">{formatDashboardRangeLabel(data.range, calendar)}</span>;
  const [tab, setTabState] = useState<InsightsTab>(data.tab);
  const [reviewOnly, setReviewOnly] = useState(initialReviewOnly);
  const viewsRef = useRef<HTMLDivElement>(null);
  const defaultDay = useMemo(() => {
    if (data.focusDay && data.focusDay >= calendar.start && data.focusDay <= calendar.end) return data.focusDay;
    if (data.range.value === "this-month" || calendar.end === data.today) return calendar.end;
    return [...days].filter((day) => !day.future).sort((a, b) => b.total - a.total)[0]?.day ?? calendar.end;
  }, [calendar.end, calendar.start, data.focusDay, data.range.value, data.today, days]);
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const setTab = useCallback((next: InsightsTab) => {
    setTabState(next);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", next);
    params.delete("day");
    params.delete("review");
    window.history.replaceState(null, "", `?${params.toString()}`);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey || target.closest("input, textarea, select, [contenteditable], [role=menu], [role=dialog]")) return;
      const match = TABS.find((entry) => entry.key === event.key);
      if (match) setTab(match.value);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setTab]);

  const comparison = data.comparison;
  const delta = comparison ? Math.round(data.summary.totalSpend) - Math.round(comparison.summary.totalSpend) : null;
  const picker = { value: data.range.value, startDate: data.range.startDate, endDate: data.range.endDate, path: "/insights", extraParams: { tab } };

  return (
    <div className="space-y-4">
      <MobilePageHeader eyebrow="Spend insights" title="Insights" meta={meta} />
      <div className="lg:hidden"><DashboardMobileTimePeriodRow {...picker} /></div>
      <div className="hidden lg:block">
        <AppPageHeader eyebrow="Spend insights" title="Insights" meta={meta} actions={<DashboardTimeframePicker {...picker} />} />
      </div>

      {data.status === "error" ? (
        <section role="alert" className="flex flex-col gap-3 rounded-[8px] border-2 border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{data.message}</p>
          <Button variant="secondary" size="sm" onClick={() => router.refresh()}><span className="font-bold">Try again</span></Button>
        </section>
      ) : (
        <>
          <section aria-label="Range summary" className={cn(dashboardPanelClassName, "flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3 sm:px-5")}>
            <p className="text-sm text-secondary-foreground">
              <strong className="text-lg font-extrabold tracking-[-0.02em] text-foreground tabular-nums">{formatCurrency(data.summary.totalSpend)}</strong>
              {" "}spent · {pluralize(data.summary.transactionCount, "transaction")}
            </p>
            {comparison && delta !== null ? (
              <p className="text-sm font-semibold text-foreground">
                {delta === 0 ? "Same as" : `${delta > 0 ? "↑" : "↓"} ${formatCurrency(Math.abs(delta))} ${delta > 0 ? "more than" : "less than"}`} {getComparisonLabel(comparison, calendar)}
              </p>
            ) : null}
            {data.summary.uncategorizedCount ? (
              <button
                type="button"
                onClick={() => {
                  setTab("recipients");
                  setReviewOnly(true);
                  requestAnimationFrame(() => viewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
                }}
                className="inline-flex min-h-9 items-center gap-1.5 rounded-[999px] border-2 border-border bg-[#fff1bd] px-3 text-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:ml-auto"
              >
                <span className="font-bold">{formatNumber(data.summary.uncategorizedCount)} uncategorized</span>
                <span className="text-secondary-foreground">· {formatShare(data.uncategorizedAmount, data.summary.totalSpend)}% of spend</span>
              </button>
            ) : null}
          </section>

          <div ref={viewsRef} className="scroll-mt-4 space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div role="tablist" aria-label="Insights view" className={cn(segmentClassName, "grid w-full grid-cols-3 sm:inline-flex sm:w-auto")}>
                {TABS.map(({ value, label, icon: Icon, key }) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    id={`insights-tab-${value}`}
                    aria-selected={tab === value}
                    aria-controls={`insights-panel-${value}`}
                    aria-keyshortcuts={key.toUpperCase()}
                    onClick={() => setTab(value)}
                    className={cn(segmentItemClassName(tab === value), "inline-flex items-center justify-center gap-2 px-2 sm:px-4")}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden />
                    <span className="font-semibold">{label}</span>
                  </button>
                ))}
              </div>
              <p className="hidden text-sm text-secondary-foreground sm:block">
                {TAB_HINTS[tab]}
                <span className="hidden text-xs lg:inline"> Press <kbd className="rounded-[4px] border border-border/45 px-1 font-sans">C</kbd>, <kbd className="rounded-[4px] border border-border/45 px-1 font-sans">R</kbd> or <kbd className="rounded-[4px] border border-border/45 px-1 font-sans">P</kbd>.</span>
              </p>
            </div>
            {tab === "calendar" ? (
              <InsightsCalendar
                calendar={calendar}
                days={days}
                total={data.summary.totalSpend}
                rangeName={getRangeName(data.range, calendar)}
                rangeShortName={getRangeShortName(data.range, calendar)}
                today={data.today}
                selected={selectedDay}
                onSelect={setSelectedDay}
                categories={data.categoryOptions}
              />
            ) : tab === "recipients" ? (
              <InsightsRecipients
                calendar={calendar}
                recipients={data.recipients}
                largest={data.largestTransactions}
                categories={data.categoryOptions}
                reviewOnly={reviewOnly}
                onReviewOnlyChange={setReviewOnly}
                onPickDay={(day) => {
                  setSelectedDay(day);
                  setTab("calendar");
                }}
              />
            ) : (
              <InsightsPatterns patterns={data.patterns} days={days} />
            )}
          </div>
        </>
      )}
    </div>
  );
}
