"use client";

import { Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from "react";

import type { CategoryOption, TransactionRecord } from "@/common/types";
import { tidyRecipientName } from "@/common/recipient-name";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardCategorize } from "@/features/dashboard/mutations";
import { useDashboardTransactions } from "@/features/dashboard/queries";
import { cn } from "@/lib/utils";

import { dashboardPanelClassName, dashboardTopCardLabelClassName } from "@/app/(app)/dashboard/_components/dashboard-style";
import { CategoryMenu, CategoryPill, focusRing, PanelNote, useMediaQuery } from "@/app/(app)/dashboard/_components/dashboard-ui";
import {
  addDays,
  buildTransactionsHref,
  buildWeeks,
  formatCompactCurrency,
  formatCurrency,
  formatDayFull,
  formatDayShort,
  formatIstTime,
  formatMonthInitial,
  formatMonthShort,
  formatShare,
  formatWeekday,
  getSpendTier,
  pluralize,
  SPEND_TIERS,
  type CalendarDay,
  type CalendarRange,
} from "@/app/(app)/dashboard/_components/dashboard-view-model";

const DESKTOP_QUERY = "(min-width: 1280px)";

export function InsightsCalendar({
  calendar,
  days,
  total,
  rangeName,
  rangeShortName,
  today,
  selected,
  onSelect,
  categories,
}: {
  calendar: CalendarRange;
  days: CalendarDay[];
  total: number;
  rangeName: string;
  rangeShortName: string;
  today: string;
  selected: string;
  onSelect: (day: string) => void;
  categories: CategoryOption[];
}) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const [sheetOpen, setSheetOpen] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);
  const byDay = useMemo(() => new Map(days.map((day) => [day.day, day])), [days]);
  const elapsed = days.filter((day) => !day.future);
  const top = [...elapsed].sort((a, b) => b.total - a.total).slice(0, 3);
  const topShare = total ? Math.round((top.reduce((sum, day) => sum + day.total, 0) / total) * 100) : 0;
  const selectedDay = byDay.get(selected) ?? byDay.get(calendar.end) ?? days[0];

  const pick = (day: string, fromKeyboard = false) => {
    const next = day < calendar.start ? calendar.start : day > calendar.end ? calendar.end : day;
    onSelect(next);
    if (fromKeyboard) requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus());
    else if (!isDesktop) setSheetOpen(true);
  };
  const step = (amount: number) => onSelect(addDays(selectedDay.day, amount));
  const onKeyDown = (event: KeyboardEvent, day: string) => {
    const year = calendar.layout === "year";
    const steps: Record<string, number> = { ArrowLeft: year ? -7 : -1, ArrowRight: year ? 7 : 1, ArrowUp: year ? -1 : -7, ArrowDown: year ? 1 : 7 };
    if (event.key in steps) {
      event.preventDefault();
      pick(addDays(day, steps[event.key]), true);
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      pick(event.key === "Home" ? calendar.start : calendar.end, true);
    } else if (event.key === "Enter" && !isDesktop) {
      setSheetOpen(true);
    }
  };

  const detailProps = selectedDay
    ? {
        day: selectedDay,
        today,
        rangeTotal: total,
        rangeShortName,
        categories,
        onPrev: selectedDay.day > calendar.start ? () => step(-1) : null,
        onNext: selectedDay.day < calendar.end ? () => step(1) : null,
      }
    : null;

  return (
    <div id="insights-panel-calendar" role="tabpanel" aria-labelledby="insights-tab-calendar" className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className={cn(dashboardPanelClassName, "p-3 sm:p-5")}>
        <div className="mb-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Spending by day</h2>
            <p className="hidden text-sm text-secondary-foreground sm:block">
              {calendar.layout === "year" ? "Each square is a day. Darker means more went out." : "Darker means more went out."}
            </p>
          </div>
          {top.length && top[0].total > 0 ? (
            <div className="flex min-w-0 flex-col gap-1.5 sm:flex-row sm:items-center">
              <span className="font-hand text-[16px] leading-none text-destructive">
                {topShare >= 40 ? `${top.length} days = ${topShare}% of ${rangeName}` : "biggest day"}
              </span>
              <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none]">
                {(topShare >= 40 ? top : top.slice(0, 1)).map((day) => (
                  <DayChip key={day.day} day={day.day} active={selected === day.day} onClick={() => pick(day.day)} suffix={topShare >= 40 ? undefined : formatCompactCurrency(day.total)} />
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <div ref={gridRef}>
          {calendar.layout === "year" ? (
            <YearGrid calendar={calendar} byDay={byDay} days={days} selected={selected} onPick={pick} onKeyDown={onKeyDown} />
          ) : (
            <MonthGrid calendar={calendar} byDay={byDay} today={today} selected={selected} onPick={pick} onKeyDown={onKeyDown} />
          )}
        </div>
        <Legend days={days} showReviewed={calendar.layout === "month"} />
        {!isDesktop && selectedDay && !selectedDay.future ? (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className={cn("mt-3 flex w-full items-center justify-between gap-3 rounded-[8px] border-2 border-border bg-[var(--paper-mint)] px-3 py-2.5 text-left transition-colors hover:bg-primary/40 xl:hidden", focusRing)}
          >
            <span className="min-w-0">
              <span className="block text-sm font-bold">{formatWeekday(selectedDay.day).slice(0, 3)}, {formatDayShort(selectedDay.day)}</span>
              <span className="block text-xs text-secondary-foreground tabular-nums">{formatCurrency(selectedDay.total)} · {pluralize(selectedDay.count, "transaction")}</span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 text-sm font-bold">View <ChevronUp className="h-4 w-4" aria-hidden /></span>
          </button>
        ) : null}
      </section>

      {detailProps && isDesktop ? (
        <section aria-label={`Transactions on ${formatDayFull(detailProps.day.day)}`} className={cn(dashboardPanelClassName, "xl:sticky xl:top-4 xl:flex xl:max-h-[calc(100vh-2rem)] xl:flex-col")}>
          <DayDetails {...detailProps} />
        </section>
      ) : null}
      {detailProps && !isDesktop ? (
        <Drawer open={sheetOpen} onOpenChange={setSheetOpen} shouldScaleBackground={false}>
          <DrawerContent aria-describedby={undefined} className="max-h-[86vh]">
            <DayDetails {...detailProps} sheet />
          </DrawerContent>
        </Drawer>
      ) : null}
    </div>
  );
}

function DayChip({ day, active, onClick, suffix }: { day: string; active: boolean; onClick: () => void; suffix?: string }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn("inline-flex min-h-8 shrink-0 items-center gap-1 rounded-[999px] border-2 border-border px-2.5 text-xs transition-colors", focusRing, active ? "bg-primary" : "bg-card hover:bg-[var(--paper-mint)]")}
    >
      <span className="font-bold">{formatDayShort(day)}</span>
      {suffix ? <span className="text-secondary-foreground">{suffix}</span> : null}
    </button>
  );
}

function cellLabel(day: CalendarDay) {
  return `${formatWeekday(day.day)}, ${formatDayFull(day.day)}${day.future ? ", still to come" : `: ${formatCurrency(day.total)}, ${pluralize(day.count, "transaction")}`}`;
}

type GridProps = {
  calendar: CalendarRange;
  byDay: Map<string, CalendarDay>;
  selected: string;
  onPick: (day: string) => void;
  onKeyDown: (event: KeyboardEvent, day: string) => void;
};

/** `tabStop` is the day that takes Tab focus when no day is selected, as in the compact dashboard grid. */
export function MonthGrid({ calendar, byDay, today, selected, onPick, onKeyDown, compact = false, tabStop }: GridProps & { today: string; compact?: boolean; tabStop?: string }) {
  const weeks = buildWeeks(calendar.start, calendar.gridEnd);
  const dense = byDay.size > 40;
  const weekTotals = weeks.map((week) => week.reduce((sum, day) => sum + (byDay.get(day)?.total ?? 0), 0));
  const maxWeek = Math.max(...weekTotals, 1);
  const showWeeks = !compact;
  return (
    <div
      role="grid"
      aria-label="Spending per day"
      className={cn(
        "grid gap-1 sm:gap-1.5",
        dense
          ? cn("grid-cols-[34px_repeat(7,minmax(0,1fr))]", showWeeks && "sm:grid-cols-[40px_repeat(7,minmax(0,1fr))_88px]")
          : cn("grid-cols-7", showWeeks && "sm:grid-cols-[repeat(7,minmax(0,1fr))_88px]")
      )}
    >
      <div role="row" className="contents">
        {dense ? <span aria-hidden /> : null}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name) => (
          <span key={name} role="columnheader" className={cn("pb-1 text-center text-xs font-semibold text-secondary-foreground", !compact && "sm:pl-1 sm:text-left")}>{compact ? name[0] : name}</span>
        ))}
        {showWeeks ? <span role="columnheader" className="hidden pb-1 text-right text-xs font-semibold text-secondary-foreground sm:block">Week</span> : null}
      </div>
      {weeks.map((week, index) => {
        const monthStart = week.find((day) => day.endsWith("-01") && byDay.has(day)) ?? (index === 0 ? calendar.start : null);
        return (
          <div key={week[0]} role="row" className="contents">
            {dense ? <span className="pt-1 text-[11px] font-bold uppercase tracking-[0.08em] text-secondary-foreground">{monthStart ? formatMonthShort(monthStart) : ""}</span> : null}
            {week.map((dayKey) => {
              const day = byDay.get(dayKey);
              if (!day) return <span key={dayKey} role="gridcell" aria-hidden />;
              const tier = getSpendTier(day.total);
              const isSelected = dayKey === selected;
              const ink = tier === 4 && !day.future;
              const allCategorized = day.count > 0 && day.uncategorizedCount === 0;
              return (
                <button
                  key={dayKey}
                  type="button"
                  data-day={dayKey}
                  role="gridcell"
                  aria-selected={isSelected}
                  aria-current={dayKey === today ? "date" : undefined}
                  aria-label={cellLabel(day)}
                  title={day.future ? "Still to come" : undefined}
                  tabIndex={isSelected || (!selected && dayKey === tabStop) ? 0 : -1}
                  disabled={day.future}
                  onClick={() => onPick(dayKey)}
                  onKeyDown={(event) => onKeyDown(event, dayKey)}
                  className={cn(
                    "relative flex min-w-0 flex-col justify-between rounded-[6px] border-2 text-left transition-[transform,box-shadow] disabled:cursor-default",
                    focusRing,
                    compact ? "h-9 p-1 sm:h-10" : dense ? "h-10 p-1 sm:h-12 sm:p-1.5" : "h-[52px] p-1 sm:h-[84px] sm:p-2",
                    day.future ? "border-dashed border-border/30 bg-transparent" : cn(SPEND_TIERS[tier].className, "border-border hover:-translate-y-0.5 hover:shadow-[2px_3px_0_var(--foreground)]"),
                    ink ? "text-[#fffdf7]" : "text-[#171714]",
                    isSelected && "z-10 -translate-y-0.5 shadow-[3px_4px_0_var(--foreground)] ring-[3px] ring-foreground ring-offset-2 ring-offset-card hover:shadow-[3px_4px_0_var(--foreground)]",
                    isSelected && ink && "outline outline-2 -outline-offset-[6px] outline-[#fffdf7]"
                  )}
                >
                  <span className={cn("flex items-center justify-between text-xs font-bold leading-none sm:text-[13px]", day.future && "text-secondary-foreground/55")}>
                    {dayKey === today ? (
                      <span
                        title="Today"
                        className={cn(
                          "-ml-0.5 -mt-0.5 grid place-items-center rounded-full tabular-nums",
                          compact ? "h-5 w-5 text-[11px]" : "h-5 w-5 text-[11px] sm:h-6 sm:w-6 sm:text-[13px]",
                          ink ? "bg-[#fffdf7] text-[#171714]" : "bg-[#171714] text-[#fffdf7]"
                        )}
                      >
                        {Number(dayKey.slice(8))}
                      </span>
                    ) : (
                      <span>{Number(dayKey.slice(8))}</span>
                    )}
                    {allCategorized && !compact ? (
                      <Check className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", ink ? "text-primary" : "text-[#1c7a4f]")} strokeWidth={3} aria-hidden />
                    ) : null}
                  </span>
                  {!day.future && day.total > 0 && !compact ? (
                    <span className={cn("self-end font-bold leading-none tabular-nums", dense ? "hidden text-xs sm:block" : "text-[10.5px] sm:text-[15px]")}>{formatCompactCurrency(day.total)}</span>
                  ) : null}
                </button>
              );
            })}
            {showWeeks ? (
              <span className="hidden flex-col items-end justify-center gap-1 sm:flex" aria-label={`Week total ${formatCurrency(weekTotals[index])}`}>
                <span className="text-[13px] font-bold tabular-nums">{weekTotals[index] ? formatCompactCurrency(weekTotals[index]) : "–"}</span>
                <span className="h-1.5 w-full max-w-[72px] rounded-full bg-foreground/[0.08]" aria-hidden>
                  <span className="block h-full rounded-full bg-foreground/70" style={{ width: `${(weekTotals[index] / maxWeek) * 100}%` }} />
                </span>
              </span>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function YearGrid({ calendar, byDay, days, selected, onPick, onKeyDown }: GridProps & { days: CalendarDay[] }) {
  const scroller = useRef<HTMLDivElement>(null);
  const columns = buildWeeks(calendar.start, calendar.gridEnd);
  const months = useMemo(() => {
    const totals = new Map<string, number>();
    for (const day of days) if (!day.future) totals.set(day.day.slice(0, 7), (totals.get(day.day.slice(0, 7)) ?? 0) + day.total);
    return [...totals.entries()];
  }, [days]);
  const maxMonth = Math.max(...months.map(([, total]) => total), 1);
  useEffect(() => {
    const element = scroller.current;
    if (element && element.scrollWidth > element.clientWidth) element.scrollTo({ left: element.scrollWidth });
  }, []);
  return (
    <div>
      <p className="mb-2 text-xs text-secondary-foreground sm:hidden">← Swipe for earlier months</p>
      <div ref={scroller} className="-mx-1 overflow-x-auto px-1 pb-2">
        <div
          role="grid"
          aria-label="Spending per day"
          className="grid min-w-[calc(var(--weeks)*19px+30px)] gap-[3px] sm:min-w-[calc(var(--weeks)*11px+30px)]"
          style={{ "--weeks": columns.length, gridTemplateColumns: `30px repeat(${columns.length}, minmax(0,1fr))`, gridTemplateRows: "16px repeat(7, auto)" } as CSSProperties}
        >
          <span aria-hidden />
          {columns.map((column, index) => {
            const monthStart = column.find((day) => day.endsWith("-01") && byDay.has(day)) ?? (index === 0 ? calendar.start : null);
            return <span key={column[0]} aria-hidden className="whitespace-nowrap text-[11px] font-bold text-secondary-foreground">{monthStart ? formatMonthShort(monthStart) : ""}</span>;
          })}
          {[0, 1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} role="row" className="contents">
              <span className="flex items-center text-[10px] leading-none text-secondary-foreground" aria-hidden>{["Mon", "", "Wed", "", "Fri", "", "Sun"][row]}</span>
              {columns.map((column) => {
                const dayKey = column[row];
                const day = byDay.get(dayKey);
                if (!day || day.future) return <span key={dayKey} role="gridcell" aria-hidden className="aspect-square" />;
                const isSelected = dayKey === selected;
                return (
                  <button
                    key={dayKey}
                    type="button"
                    data-day={dayKey}
                    role="gridcell"
                    aria-selected={isSelected}
                    aria-label={cellLabel(day)}
                    title={`${formatDayFull(dayKey)} · ${formatCurrency(day.total)}`}
                    tabIndex={isSelected ? 0 : -1}
                    onClick={() => onPick(dayKey)}
                    onKeyDown={(event) => onKeyDown(event, dayKey)}
                    className={cn("aspect-square rounded-[3px] border border-border transition-transform hover:scale-125", focusRing, SPEND_TIERS[getSpendTier(day.total)].className, isSelected && "z-10 scale-125 ring-2 ring-destructive ring-offset-1 ring-offset-card")}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
      <div className="mt-3 border-t-2 border-dashed border-border/45 pt-3">
        <p className="text-xs font-semibold text-secondary-foreground">By month</p>
        <div className="mt-2 grid gap-1.5" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0,1fr))` }}>
          {months.map(([month, total]) => (
            <div key={month} className="flex min-w-0 flex-col items-center gap-1" title={`${formatMonthShort(`${month}-01`)} ${month.slice(0, 4)}: ${formatCurrency(total)}`}>
              <div className="flex h-14 w-full items-end justify-center">
                <span className="block w-full max-w-[28px] rounded-t-[3px] border-2 border-b-0 border-border bg-primary" style={{ height: `${Math.max(4, (total / maxMonth) * 100)}%` }} />
              </div>
              <span className="text-[11px] font-semibold text-secondary-foreground">{formatMonthInitial(`${month}-01`)}</span>
              {months.length <= 13 ? <span className="hidden text-[11px] font-bold tabular-nums sm:block">{formatCompactCurrency(total)}</span> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Legend({ days, showReviewed }: { days: CalendarDay[]; showReviewed: boolean }) {
  const reviewedDays = days.filter((day) => day.count > 0 && day.uncategorizedCount === 0).length;
  return (
    <ul aria-label="Legend" className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t-2 border-dashed border-border/45 pt-3 text-xs text-secondary-foreground">
      {SPEND_TIERS.map((tier) => (
        <li key={tier.label} className="flex items-center gap-1.5">
          <span className={cn("h-3 w-3 rounded-[3px] border border-border", tier.className)} aria-hidden />
          {tier.label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="grid h-4 w-4 place-items-center rounded-full bg-[#171714] text-[9px] font-bold text-[#fffdf7]" aria-hidden>7</span>
        Today
      </li>
      {showReviewed && reviewedDays ? (
        <li className="flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-[#1c7a4f]" strokeWidth={3} aria-hidden />
          Fully categorized ({pluralize(reviewedDays, "day")})
        </li>
      ) : null}
    </ul>
  );
}

const LANE_OFFSETS = [0, -1, 1, -2, 2];

/** Places each payment on the 24-hour strip, moving dots that would overlap into lanes above and below. */
function layoutDots(transactions: TransactionRecord[]) {
  const maxAmount = Math.max(...transactions.map((transaction) => transaction.amount), 1);
  const placed: Array<{ transaction: TransactionRecord; left: number; size: number; lane: number }> = [];
  for (const transaction of [...transactions].sort((a, b) => a.timestamp.localeCompare(b.timestamp))) {
    const [hours, minutes] = formatIstTime(transaction.timestamp).split(":").map(Number);
    const left = ((hours * 60 + minutes) / 1440) * 100;
    const size = 8 + 20 * Math.sqrt(transaction.amount / maxAmount);
    const lane = LANE_OFFSETS.find((candidate) => placed.every((dot) => dot.lane !== candidate || Math.abs(dot.left - left) > 6)) ?? 0;
    placed.push({ transaction, left, size, lane });
  }
  return placed;
}

function DayDetails({
  day,
  today,
  rangeTotal,
  rangeShortName,
  categories,
  onPrev,
  onNext,
  sheet = false,
}: {
  day: CalendarDay;
  today: string;
  rangeTotal: number;
  rangeShortName: string;
  categories: CategoryOption[];
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  sheet?: boolean;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const hasTransactions = !day.future && day.count > 0;
  const query = useDashboardTransactions({ startDate: day.day, endDate: day.day }, { enabled: hasTransactions });
  const { categorize, pending } = useDashboardCategorize();
  const transactions = query.data?.transactions ?? [];
  const uncategorized = transactions.filter((transaction) => !transaction.categoryUuid);
  const dots = layoutDots(transactions);
  const lanes = Math.max(0, ...dots.map((dot) => Math.abs(dot.lane)));
  const navButton = cn("grid h-10 w-10 place-items-center rounded-[8px] border-2 border-border bg-card transition-colors hover:bg-secondary disabled:cursor-default disabled:opacity-35 disabled:hover:bg-card", focusRing);
  const Title = sheet ? DrawerTitle : "h2";

  return (
    <>
      <div className={cn("flex shrink-0 items-start justify-between gap-3 border-b-2 border-border", sheet ? "px-4 pb-3 pt-2" : "p-4 sm:p-5")}>
        <div className="min-w-0" aria-live="polite">
          <p className={dashboardTopCardLabelClassName}>{formatWeekday(day.day)}{day.day === today ? " · Today" : ""}</p>
          <Title className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.03em]">{formatDayFull(day.day)}</Title>
          {!day.future ? (
            <p className="mt-1 text-sm tabular-nums text-secondary-foreground">
              <strong className="font-bold text-foreground">{formatCurrency(day.total)}</strong> · {pluralize(day.count, "transaction")}
              {rangeTotal && day.total ? ` · ${formatShare(day.total, rangeTotal)}% of ${rangeShortName}` : ""}
            </p>
          ) : null}
          {sheet ? <DrawerDescription className="sr-only">Transactions on this day, with their categories.</DrawerDescription> : null}
        </div>
        <div className="flex shrink-0 gap-1.5">
          <button type="button" aria-label="Previous day" disabled={!onPrev} onClick={onPrev ?? undefined} className={navButton}><ChevronLeft className="h-4 w-4" /></button>
          <button type="button" aria-label="Next day" disabled={!onNext} onClick={onNext ?? undefined} className={navButton}><ChevronRight className="h-4 w-4" /></button>
        </div>
      </div>

      {day.future ? (
        <PanelNote title="Still to come" body="This day hasn’t happened yet." />
      ) : !hasTransactions ? (
        <PanelNote title="No transactions" body="Nothing went out on this day." />
      ) : query.isError ? (
        <PanelNote title="Couldn’t load this day’s transactions." action={<Button variant="secondary" size="sm" onClick={() => void query.refetch()}><span className="font-bold">Try again</span></Button>} />
      ) : query.isPending ? (
        <div className="space-y-3 p-4 sm:p-5" aria-busy="true" aria-label="Loading transactions">
          <Skeleton className="h-9 w-full rounded-[8px]" />
          {Array.from({ length: Math.min(day.count, 5) }, (_, index) => <Skeleton key={index} className="h-12 w-full rounded-[8px]" />)}
        </div>
      ) : (
        <>
          <div className="shrink-0 px-4 pt-3 sm:px-5">
            <div className="relative" style={{ height: 36 + lanes * 44 }} aria-hidden>
              <div className="absolute inset-x-0 top-1/2 border-t-2 border-border/15" />
              {[0, 6, 12, 18, 24].map((hour) => <span key={hour} className="absolute top-1/2 h-2 -translate-y-1/2 border-l-2 border-border/25" style={{ left: `${(hour / 24) * 100}%` }} />)}
              {dots.map(({ transaction, left, size, lane }) => (
                <span
                  key={transaction.uuid}
                  className={cn("absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-border transition-transform", transaction.categoryUuid ? "bg-primary" : "bg-[#fff1bd]", hovered === transaction.uuid && "z-10 scale-125 ring-2 ring-foreground ring-offset-1 ring-offset-card")}
                  style={{ left: `clamp(${size / 2}px, ${left}%, calc(100% - ${size / 2}px))`, top: `calc(50% + ${lane * 22}px)`, width: size, height: size }}
                />
              ))}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-secondary-foreground tabular-nums" aria-hidden>
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
          </div>
          <ul className={cn("mt-1 scroll-py-3 divide-y divide-border/15 px-4 pb-2 sm:px-5", sheet ? "min-h-0 flex-1 overflow-y-auto" : "xl:min-h-0 xl:flex-1 xl:overflow-y-auto")}>
            {transactions.map((transaction) => (
              <TransactionRow
                key={transaction.uuid}
                transaction={transaction}
                categories={categories}
                pending={pending}
                onHover={setHovered}
                onPick={(choice) =>
                  void categorize({
                    transactions: [{ uuid: transaction.uuid, categoryUuid: transaction.categoryUuid, subcategoryUuid: transaction.subcategoryUuid }],
                    choice,
                    description: `${tidyRecipientName(transaction.recipientDisplayName)}, ${formatCurrency(transaction.amount)}`,
                  })
                }
              />
            ))}
          </ul>
          {query.data && query.data.total > transactions.length ? (
            <p className="shrink-0 px-4 pb-3 text-sm sm:px-5">
              <Link href={buildTransactionsHref({ startDate: day.day, endDate: day.day })} className={cn("rounded-[4px] font-semibold underline underline-offset-4", focusRing)}>See all {query.data.total} in Transactions</Link>
            </p>
          ) : null}
          {uncategorized.length > 1 ? (
            <div className="flex shrink-0 items-center justify-between gap-3 border-t-2 border-border bg-[var(--paper-yellow)] px-4 py-3 text-[#171714] sm:px-5">
              <div className="min-w-0">
                <p className="text-sm"><span className="font-bold">{uncategorized.length} uncategorized</span> · {formatCurrency(uncategorized.reduce((sum, transaction) => sum + transaction.amount, 0))}</p>
                <p className="mt-0.5 text-xs">Set exceptions first; this changes only uncategorized ones.</p>
              </div>
              <CategoryMenu
                label={`Applies to the ${uncategorized.length} uncategorized transactions on ${formatDayShort(day.day)}.`}
                categories={categories}
                current={null}
                onPick={(choice) =>
                  void categorize({
                    transactions: uncategorized.map((transaction) => ({ uuid: transaction.uuid, categoryUuid: null, subcategoryUuid: null })),
                    choice,
                    description: `${pluralize(uncategorized.length, "transaction")} on ${formatDayShort(day.day)}`,
                  })
                }
                trigger={({ open, toggle, ref }) => (
                  <Button ref={ref} variant="secondary" size="sm" aria-haspopup="menu" aria-expanded={open} disabled={pending} onClick={toggle} className="shrink-0">
                    <span className="font-bold">{pending ? "Saving…" : `Set all ${uncategorized.length}`}</span>
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </Button>
                )}
              />
            </div>
          ) : null}
        </>
      )}
    </>
  );
}

function TransactionRow({
  transaction,
  categories,
  pending,
  onHover,
  onPick,
}: {
  transaction: TransactionRecord;
  categories: CategoryOption[];
  pending: boolean;
  onHover: (uuid: string | null) => void;
  onPick: Parameters<typeof CategoryMenu>[0]["onPick"];
}) {
  const name = tidyRecipientName(transaction.recipientDisplayName);
  return (
    <li
      onMouseEnter={() => onHover(transaction.uuid)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onHover(transaction.uuid)}
      onBlur={() => onHover(null)}
      className="-mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-[6px] px-2 py-2.5 transition-colors hover:bg-[var(--paper-mint)]/60"
    >
      <Link href={`/transactions/${transaction.uuid}`} title={transaction.recipientDisplayName} className={cn("min-w-0 truncate rounded-[4px] text-sm font-semibold text-foreground underline-offset-4 hover:underline", focusRing)}>
        {name}
      </Link>
      <span className="text-right text-sm font-bold tabular-nums">{formatCurrency(transaction.amount)}</span>
      <span className="min-w-0 truncate text-xs text-secondary-foreground tabular-nums">
        {formatIstTime(transaction.timestamp)} · {transaction.accountName ?? "No account"} · {transaction.type}
        {transaction.reference ? ` ··${transaction.reference.slice(-4)}` : ""}
        {transaction.remarks ? ` · ${transaction.remarks}` : ""}
      </span>
      <CategoryMenu
        label={`Category for ${name}`}
        categories={categories}
        current={transaction.categoryUuid ? { categoryUuid: transaction.categoryUuid, subcategoryUuid: transaction.subcategoryUuid } : null}
        onPick={onPick}
        trigger={({ open, toggle, ref }) => (
          <button
            ref={ref}
            type="button"
            aria-haspopup="menu"
            aria-expanded={open}
            disabled={pending}
            onClick={toggle}
            title={transaction.subcategory ? `${transaction.category} · ${transaction.subcategory}. Change category` : "Change category"}
            className="group justify-self-end rounded-[999px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-wait"
          >
            <CategoryPill value={transaction.category} className="min-h-7 px-2 text-[11px] transition-[box-shadow,transform] group-hover:-translate-y-px group-hover:shadow-[1px_2px_0_var(--foreground)]" />
          </button>
        )}
      />
    </li>
  );
}

