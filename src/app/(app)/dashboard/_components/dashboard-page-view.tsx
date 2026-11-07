"use client";

import { CalendarDays, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";

import { AppPageHeader } from "@/components/product/app-page-header";
import { MobilePageHeader } from "@/components/product/mobile/mobile-primitives";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { DashboardPageData } from "@/server/page-data/dashboard-page-data";

import { DashboardCalendarView } from "./dashboard-calendar";
import { DashboardPeopleView } from "./dashboard-people";
import { DashboardSummaryStrip } from "./dashboard-summary-strip";
import { DashboardMobileTimePeriodRow, DashboardTimeframePicker } from "./dashboard-timeframe-picker";
import { segmentClassName, segmentItemClassName } from "./dashboard-ui";
import {
  buildCalendarDays,
  formatDashboardRangeLabel,
  getCalendarRange,
  getRangeName,
} from "./dashboard-view-model";

type DashboardView = "calendar" | "people";
const VIEW_STORAGE_KEY = "trackcrow.dashboard.view";

function readStoredView(): DashboardView | null {
  try {
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    return stored === "calendar" || stored === "people" ? stored : null;
  } catch {
    return null;
  }
}

function subscribeToStoredView(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export function DashboardPageView({ data }: { data: DashboardPageData }) {
  const router = useRouter();
  const calendar = useMemo(() => getCalendarRange(data.range, data.today, data.days), [data.range, data.today, data.days]);
  const days = useMemo(() => buildCalendarDays(calendar, data.days), [calendar, data.days]);
  const rangeName = getRangeName(data.range, calendar);
  const meta = <span className="font-medium text-foreground">{formatDashboardRangeLabel(data.range, calendar)}</span>;
  const uncategorizedAmount = data.recipients.reduce((sum, recipient) => sum + recipient.uncategorizedAmount, 0);

  const storedView = useSyncExternalStore(subscribeToStoredView, readStoredView, () => null);
  const [chosenView, setChosenView] = useState<DashboardView | null>(null);
  const view: DashboardView = chosenView ?? storedView ?? "calendar";
  const [reviewOnly, setReviewOnly] = useState(false);
  const viewsRef = useRef<HTMLDivElement>(null);
  const defaultDay = useMemo(() => {
    if (data.range.value === "this-month" || calendar.end === data.today) return calendar.end;
    return [...days].filter((day) => !day.future).sort((a, b) => b.total - a.total)[0]?.day ?? calendar.end;
  }, [calendar.end, data.range.value, data.today, days]);
  const [selectedDay, setSelectedDay] = useState(defaultDay);

  const setView = useCallback((next: DashboardView) => {
    setChosenView(next);
    try {
      window.localStorage.setItem(VIEW_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable; the choice then lasts for this visit only.
    }
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (event.metaKey || event.ctrlKey || event.altKey || target.closest("input, textarea, select, [contenteditable], [role=menu], [role=dialog]")) return;
      if (event.key === "c") setView("calendar");
      if (event.key === "p") setView("people");
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setView]);

  const reviewUncategorized = () => {
    setView("people");
    setReviewOnly(true);
    requestAnimationFrame(() => viewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div className="space-y-4">
      <MobilePageHeader eyebrow="Spend operations" title="Dashboard" meta={meta} />
      <div className="lg:hidden">
        <DashboardMobileTimePeriodRow value={data.range.value} startDate={data.range.startDate} endDate={data.range.endDate} />
      </div>
      <div className="hidden lg:block">
        <AppPageHeader
          eyebrow="Spend operations"
          title="Dashboard"
          meta={meta}
          actions={<DashboardTimeframePicker value={data.range.value} startDate={data.range.startDate} endDate={data.range.endDate} />}
        />
      </div>

      {data.status === "error" ? (
        <section role="alert" className="flex flex-col gap-3 rounded-[8px] border-2 border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{data.message}</p>
          <Button variant="secondary" size="sm" onClick={() => router.refresh()}>
            <span className="font-bold">Try again</span>
          </Button>
        </section>
      ) : (
        <>
          <DashboardSummaryStrip data={data} calendar={calendar} days={days} uncategorizedAmount={uncategorizedAmount} onReview={reviewUncategorized} />

          {data.summary.transactionCount === 0 ? (
            <section className="rounded-[10px] border-2 border-border bg-card p-4 shadow-[4px_5px_0_var(--foreground)] sm:p-5">
              <p className="text-base font-bold">No transactions in this period</p>
              <p className="mt-1 text-sm text-secondary-foreground">New payments appear here as your SMS are imported. Try a longer range to see earlier ones.</p>
            </section>
          ) : null}

          <div ref={viewsRef} className="scroll-mt-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div role="tablist" aria-label="Dashboard view" className={segmentClassName}>
                {([["calendar", "Calendar", CalendarDays, "C"], ["people", "People", Users, "P"]] as const).map(([value, label, Icon, key]) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    id={`dashboard-tab-${value}`}
                    aria-selected={view === value}
                    aria-controls={`dashboard-panel-${value}`}
                    aria-keyshortcuts={key}
                    onClick={() => setView(value)}
                    className={cn(segmentItemClassName(view === value), "inline-flex items-center gap-2")}
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    <span className="font-semibold">{label}</span>
                  </button>
                ))}
              </div>
              <p className="text-sm text-secondary-foreground">
                {view === "calendar" ? "When money went out. Pick a day to see its transactions." : "Who money went to, and how often."}
                <span className="hidden text-xs lg:inline">
                  {" "}Press <kbd className="rounded-[4px] border border-border/45 px-1 font-sans">C</kbd> or <kbd className="rounded-[4px] border border-border/45 px-1 font-sans">P</kbd> to switch.
                </span>
              </p>
            </div>
            {view === "calendar" ? (
              <DashboardCalendarView
                calendar={calendar}
                days={days}
                total={data.summary.totalSpend}
                rangeName={rangeName}
                today={data.today}
                selected={selectedDay}
                onSelect={setSelectedDay}
                categories={data.categoryOptions}
              />
            ) : (
              <DashboardPeopleView
                calendar={calendar}
                recipients={data.recipients}
                largest={data.largestTransactions}
                categories={data.categoryOptions}
                reviewOnly={reviewOnly}
                onReviewOnlyChange={setReviewOnly}
                onPickDay={(day) => {
                  setSelectedDay(day);
                  setView("calendar");
                }}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
