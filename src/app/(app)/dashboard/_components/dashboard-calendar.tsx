"use client";

import { Check, ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type Ref } from "react";

import type { CategoryOption, TransactionRecord } from "@/common/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardCategorize } from "@/features/dashboard/mutations";
import { useDashboardTransactions } from "@/features/dashboard/queries";
import { cn } from "@/lib/utils";

import { dashboardPanelClassName, dashboardTopCardLabelClassName } from "./dashboard-style";
import { CategoryMenu, CategoryPill, focusRing, PanelNote } from "./dashboard-ui";
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
} from "./dashboard-view-model";

export function DashboardCalendarView({
  calendar,
  days,
  total,
  rangeName,
  today,
  selected,
  onSelect,
  categories,
}: {
  calendar: CalendarRange;
  days: CalendarDay[];
  total: number;
  rangeName: string;
  today: string;
  selected: string;
  onSelect: (day: string) => void;
  categories: CategoryOption[];
}) {
  const gridRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const byDay = useMemo(() => new Map(days.map((day) => [day.day, day])), [days]);
  const elapsed = days.filter((day) => !day.future);
  const top = [...elapsed].sort((a, b) => b.total - a.total).slice(0, 3);
  const topShare = total ? Math.round((top.reduce((sum, day) => sum + day.total, 0) / total) * 100) : 0;
  const selectedDay = byDay.get(selected) ?? byDay.get(calendar.end) ?? days[0];

  const pick = (day: string, fromKeyboard = false) => {
    const next = day < calendar.start ? calendar.start : day > calendar.end ? calendar.end : day;
    onSelect(next);
    if (fromKeyboard) {
      requestAnimationFrame(() => gridRef.current?.querySelector<HTMLElement>(`[data-day="${next}"]`)?.focus());
    } else if (window.matchMedia("(max-width: 1279px)").matches) {
      requestAnimationFrame(() => panelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
    }
  };
  const onKeyDown = (event: KeyboardEvent, day: string) => {
    const year = calendar.layout === "year";
    const steps: Record<string, number> = { ArrowLeft: year ? -7 : -1, ArrowRight: year ? 7 : 1, ArrowUp: year ? -1 : -7, ArrowDown: year ? 1 : 7 };
    if (event.key in steps) {
      event.preventDefault();
      pick(addDays(day, steps[event.key]), true);
    } else if (event.key === "Home") {
      event.preventDefault();
      pick(calendar.start, true);
    } else if (event.key === "End") {
      event.preventDefault();
      pick(calendar.end, true);
    }
  };

  return (
    <div id="dashboard-panel-calendar" role="tabpanel" aria-labelledby="dashboard-tab-calendar" className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
      <section className={cn(dashboardPanelClassName, "p-3 sm:p-5")}>
        <div className="mb-3 flex flex-col gap-2 px-1 sm:flex-row sm:items-center sm:justify-between sm:px-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Spending by day</h2>
            <p className="text-sm text-secondary-foreground">
              {calendar.layout === "year" ? "Each square is a day. Darker means more went out." : "Darker means more went out."}
            </p>
          </div>
          {top.length && top[0].total > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5">
              {topShare >= 40 ? (
                <>
                  <span className="font-hand text-[16px] leading-none text-destructive">{top.length} days = {topShare}% of {rangeName}</span>
                  {top.map((day) => <DayChip key={day.day} day={day.day} active={selected === day.day} onClick={() => pick(day.day)} />)}
                </>
              ) : (
                <>
                  <span className="font-hand text-[16px] leading-none text-destructive">biggest day</span>
                  <DayChip day={top[0].day} active={selected === top[0].day} onClick={() => pick(top[0].day)} suffix={formatCompactCurrency(top[0].total)} />
                </>
              )}
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
      </section>
      {selectedDay ? (
        <DayPanel
          ref={panelRef}
          day={selectedDay}
          today={today}
          rangeTotal={total}
          rangeName={rangeName}
          categories={categories}
          onPrev={selectedDay.day > calendar.start ? () => pick(addDays(selectedDay.day, -1), true) : null}
          onNext={selectedDay.day < calendar.end ? () => pick(addDays(selectedDay.day, 1), true) : null}
          onBack={() => gridRef.current?.querySelector<HTMLElement>(`[data-day="${selectedDay.day}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
        />
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
      className={cn("inline-flex min-h-8 items-center gap-1 rounded-[999px] border-2 border-border px-2.5 text-xs transition-colors", focusRing, active ? "bg-primary" : "bg-card hover:bg-[var(--paper-mint)]")}
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

function MonthGrid({ calendar, byDay, today, selected, onPick, onKeyDown }: GridProps & { today: string }) {
  const weeks = buildWeeks(calendar.start, calendar.gridEnd);
  const dense = byDay.size > 40;
  const weekTotals = weeks.map((week) => week.reduce((sum, day) => sum + (byDay.get(day)?.total ?? 0), 0));
  const maxWeek = Math.max(...weekTotals, 1);
  return (
    <div
      role="grid"
      aria-label="Spending per day"
      className={cn(
        "grid gap-1 sm:gap-1.5",
        dense ? "grid-cols-[34px_repeat(7,minmax(0,1fr))] sm:grid-cols-[40px_repeat(7,minmax(0,1fr))_88px]" : "grid-cols-7 sm:grid-cols-[repeat(7,minmax(0,1fr))_88px]"
      )}
    >
      <div role="row" className="contents">
        {dense ? <span aria-hidden /> : null}
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((name) => (
          <span key={name} role="columnheader" className="pb-1 text-center text-xs font-semibold text-secondary-foreground sm:pl-1 sm:text-left">{name}</span>
        ))}
        <span role="columnheader" className="hidden pb-1 text-right text-xs font-semibold text-secondary-foreground sm:block">Week</span>
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
                  tabIndex={isSelected ? 0 : -1}
                  disabled={day.future}
                  onClick={() => onPick(dayKey)}
                  onKeyDown={(event) => onKeyDown(event, dayKey)}
                  className={cn(
                    "relative flex min-w-0 flex-col justify-between rounded-[6px] border-2 text-left transition-[transform,box-shadow] disabled:cursor-default",
                    focusRing,
                    dense ? "h-10 p-1 sm:h-12 sm:p-1.5" : "h-[52px] p-1 sm:h-[84px] sm:p-2",
                    day.future ? "border-dashed border-border/30 bg-transparent" : cn(SPEND_TIERS[tier].className, "border-border hover:-translate-y-0.5 hover:shadow-[2px_3px_0_var(--foreground)]"),
                    ink ? "text-[#fffdf7]" : "text-[#171714]",
                    isSelected && "z-10 -translate-y-0.5 shadow-[3px_4px_0_var(--foreground)] ring-2 ring-foreground ring-offset-2 ring-offset-card hover:shadow-[3px_4px_0_var(--foreground)]"
                  )}
                >
                  <span className={cn("flex items-center justify-between text-xs font-bold leading-none sm:text-[13px]", day.future && "text-secondary-foreground/55")}>
                    <span>{Number(dayKey.slice(8))}</span>
                    {dayKey === today ? (
                      <span className="rounded-[4px] bg-destructive px-1 text-[9px] font-bold uppercase leading-[14px] tracking-[0.06em] text-white">Today</span>
                    ) : allCategorized ? (
                      <Check className={cn("h-3 w-3 sm:h-3.5 sm:w-3.5", ink ? "text-primary" : "text-[#1c7a4f]")} strokeWidth={3} aria-hidden />
                    ) : null}
                  </span>
                  {!day.future && day.total > 0 ? (
                    <span className={cn("self-end font-bold leading-none tabular-nums", dense ? "hidden text-xs sm:block" : "text-[10.5px] sm:text-[15px]")}>{formatCompactCurrency(day.total)}</span>
                  ) : null}
                </button>
              );
            })}
            <span className="hidden flex-col items-end justify-center gap-1 sm:flex" aria-label={`Week total ${formatCurrency(weekTotals[index])}`}>
              <span className="text-[13px] font-bold tabular-nums">{weekTotals[index] ? formatCompactCurrency(weekTotals[index]) : "–"}</span>
              <span className="h-1.5 w-full max-w-[72px] rounded-full bg-foreground/[0.08]" aria-hidden>
                <span className="block h-full rounded-full bg-foreground/70" style={{ width: `${(weekTotals[index] / maxWeek) * 100}%` }} />
              </span>
            </span>
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
                    className={cn("aspect-square rounded-[3px] border border-border transition-transform hover:scale-125", focusRing, SPEND_TIERS[getSpendTier(day.total)].className, isSelected && "z-10 scale-125 ring-2 ring-foreground ring-offset-1 ring-offset-card")}
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
      {showReviewed && reviewedDays ? (
        <li className="flex items-center gap-1">
          <Check className="h-3.5 w-3.5 text-[#1c7a4f]" strokeWidth={3} aria-hidden />
          Every transaction categorized ({pluralize(reviewedDays, "day")})
        </li>
      ) : null}
    </ul>
  );
}

function reference(transaction: TransactionRecord) {
  return transaction.reference ? ` ··${transaction.reference.slice(-4)}` : "";
}

function DayPanel({
  ref,
  day,
  today,
  rangeTotal,
  rangeName,
  categories,
  onPrev,
  onNext,
  onBack,
}: {
  ref: Ref<HTMLElement>;
  day: CalendarDay;
  today: string;
  rangeTotal: number;
  rangeName: string;
  categories: CategoryOption[];
  onPrev: (() => void) | null;
  onNext: (() => void) | null;
  onBack: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const hasTransactions = !day.future && day.count > 0;
  const query = useDashboardTransactions({ startDate: day.day, endDate: day.day }, { enabled: hasTransactions });
  const { categorize, pending } = useDashboardCategorize();
  const transactions = query.data?.transactions ?? [];
  const uncategorized = transactions.filter((transaction) => !transaction.categoryUuid);
  const maxAmount = Math.max(...transactions.map((transaction) => transaction.amount), 1);
  const navButton = cn("grid h-10 w-10 place-items-center rounded-[8px] border-2 border-border bg-card transition-colors hover:bg-secondary disabled:cursor-default disabled:opacity-35 disabled:hover:bg-card", focusRing);

  return (
    <section ref={ref} aria-label={`Transactions on ${formatDayFull(day.day)}`} className={cn(dashboardPanelClassName, "scroll-mt-4 xl:sticky xl:top-4 xl:flex xl:max-h-[calc(100vh-2rem)] xl:flex-col")}>
      <div className="flex shrink-0 items-start justify-between gap-3 border-b-2 border-border p-4 sm:p-5">
        <div className="min-w-0" aria-live="polite">
          <p className={dashboardTopCardLabelClassName}>{formatWeekday(day.day)}{day.day === today ? " · Today" : ""}</p>
          <h2 className="mt-1 text-[22px] font-extrabold leading-tight tracking-[-0.03em]">{formatDayFull(day.day)}</h2>
          {!day.future ? (
            <p className="mt-1 text-sm tabular-nums text-secondary-foreground">
              <strong className="font-bold text-foreground">{formatCurrency(day.total)}</strong> · {pluralize(day.count, "transaction")}
              {rangeTotal && day.total ? ` · ${formatShare(day.total, rangeTotal)}% of ${rangeName}’s total` : ""}
            </p>
          ) : null}
          <button type="button" onClick={onBack} className={cn("mt-1 inline-flex min-h-9 items-center rounded-[4px] text-sm text-secondary-foreground underline underline-offset-4 xl:hidden", focusRing)}>
            <span className="font-semibold">Back to calendar</span>
          </button>
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
        <PanelNote
          title="Couldn’t load this day’s transactions."
          action={<Button variant="secondary" size="sm" onClick={() => void query.refetch()}><span className="font-bold">Try again</span></Button>}
        />
      ) : query.isPending ? (
        <div className="space-y-3 p-4 sm:p-5" aria-busy="true" aria-label="Loading transactions">
          <Skeleton className="h-9 w-full rounded-[8px]" />
          {Array.from({ length: Math.min(day.count, 5) }, (_, index) => <Skeleton key={index} className="h-12 w-full rounded-[8px]" />)}
        </div>
      ) : (
        <>
          <div className="shrink-0 px-4 pt-4 sm:px-5">
            <div className="relative h-9" aria-hidden>
              <div className="absolute inset-x-0 top-1/2 border-t-2 border-border/15" />
              {[0, 6, 12, 18, 24].map((hour) => <span key={hour} className="absolute top-1/2 h-2 -translate-y-1/2 border-l-2 border-border/25" style={{ left: `${(hour / 24) * 100}%` }} />)}
              {transactions.map((transaction) => {
                const [hours, minutes] = formatIstTime(transaction.timestamp).split(":").map(Number);
                const size = 8 + 22 * Math.sqrt(transaction.amount / maxAmount);
                return (
                  <span
                    key={transaction.uuid}
                    className={cn("absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-border transition-transform", transaction.categoryUuid ? "bg-primary" : "bg-[#fff1bd]", hovered === transaction.uuid && "z-10 scale-125 ring-2 ring-foreground ring-offset-1 ring-offset-card")}
                    style={{ left: `${((hours * 60 + minutes) / 1440) * 100}%`, width: size, height: size }}
                  />
                );
              })}
            </div>
            <div className="mt-1 flex justify-between text-[11px] text-secondary-foreground tabular-nums" aria-hidden>
              <span>00:00</span><span>06:00</span><span>12:00</span><span>18:00</span><span>24:00</span>
            </div>
            <p className="mt-1.5 text-xs text-secondary-foreground">Time of day. Bigger dot, bigger amount; yellow is uncategorized.</p>
          </div>
          <ul className="mt-2 scroll-py-3 divide-y divide-border/15 px-4 pb-2 sm:px-5 xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
            {transactions.map((transaction) => (
              <li
                key={transaction.uuid}
                onMouseEnter={() => setHovered(transaction.uuid)}
                onMouseLeave={() => setHovered(null)}
                onFocus={() => setHovered(transaction.uuid)}
                onBlur={() => setHovered(null)}
                className="-mx-2 grid grid-cols-[46px_minmax(0,1fr)_auto] items-start gap-x-3 rounded-[6px] px-2 py-2.5 transition-colors hover:bg-[var(--paper-mint)]/60"
              >
                <span className="pt-0.5 text-xs text-secondary-foreground tabular-nums">{formatIstTime(transaction.timestamp)}</span>
                <span className="min-w-0">
                  <Link href={`/transactions/${transaction.uuid}`} className={cn("block rounded-[4px] text-sm font-semibold leading-5 text-foreground underline-offset-4 [overflow-wrap:anywhere] hover:underline", focusRing)}>
                    {transaction.recipientDisplayName}
                  </Link>
                  <span className="block text-xs text-secondary-foreground">{transaction.accountName ?? "No account"} · {transaction.type}{reference(transaction)}</span>
                  {transaction.remarks ? <span className="mt-0.5 block text-xs text-secondary-foreground">Note: {transaction.remarks}</span> : null}
                </span>
                <span className="flex flex-col items-end gap-1.5">
                  <span className="text-sm font-bold tabular-nums">{formatCurrency(transaction.amount)}</span>
                  <CategoryMenu
                    label={`Category for ${transaction.recipientDisplayName}`}
                    categories={categories}
                    current={transaction.categoryUuid ? { categoryUuid: transaction.categoryUuid, subcategoryUuid: transaction.subcategoryUuid } : null}
                    onPick={(choice) =>
                      void categorize({
                        transactions: [{ uuid: transaction.uuid, categoryUuid: transaction.categoryUuid, subcategoryUuid: transaction.subcategoryUuid }],
                        choice,
                        description: `${transaction.recipientDisplayName}, ${formatCurrency(transaction.amount)}`,
                      })
                    }
                    trigger={({ open, toggle, ref: triggerRef }) => (
                      <button
                        ref={triggerRef}
                        type="button"
                        aria-haspopup="menu"
                        aria-expanded={open}
                        disabled={pending}
                        onClick={toggle}
                        title={transaction.subcategory ? `${transaction.category} · ${transaction.subcategory}. Change category` : "Change category"}
                        className="group scroll-my-3 rounded-[999px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-wait"
                      >
                        <CategoryPill value={transaction.category} className="transition-[box-shadow,transform] group-hover:-translate-y-px group-hover:shadow-[1px_2px_0_var(--foreground)]" />
                      </button>
                    )}
                  />
                </span>
              </li>
            ))}
          </ul>
          {query.data && query.data.total > transactions.length ? (
            <p className="shrink-0 px-4 pb-3 text-sm sm:px-5">
              <Link href={buildTransactionsHref({ startDate: day.day, endDate: day.day })} className={cn("rounded-[4px] font-semibold underline underline-offset-4", focusRing)}>
                See all {query.data.total} in Transactions
              </Link>
            </p>
          ) : null}
          {uncategorized.length > 1 ? (
            <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-t-2 border-border bg-[var(--paper-yellow)] px-4 py-3 text-[#171714] sm:px-5">
              <div>
                <p className="text-sm">
                  <span className="font-bold">{pluralize(uncategorized.length, "uncategorized transaction")}</span> · {formatCurrency(uncategorized.reduce((sum, transaction) => sum + transaction.amount, 0))}
                </p>
                <p className="mt-0.5 text-xs">Set any exceptions on their own first. This applies only to what’s still uncategorized.</p>
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
                trigger={({ open, toggle, ref: triggerRef }) => (
                  <Button ref={triggerRef} variant="secondary" size="sm" aria-haspopup="menu" aria-expanded={open} disabled={pending} onClick={toggle}>
                    <span className="font-bold">{pending ? "Saving…" : `Set category for ${uncategorized.length}`}</span>
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </Button>
                )}
              />
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}
