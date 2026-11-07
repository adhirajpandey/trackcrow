"use client";

import { useMemo, useState } from "react";

import { tidyRecipientName } from "@/common/recipient-name";
import { cn } from "@/lib/utils";
import type { DashboardPatternCell } from "@/server/page-data/dashboard-page-data";

import { dashboardPanelClassName, dashboardTopCardLabelClassName } from "@/app/(app)/dashboard/_components/dashboard-style";
import { focusRing, InfoTip, PanelNote, segmentClassName, segmentItemClassName, useMediaQuery } from "@/app/(app)/dashboard/_components/dashboard-ui";
import { dayOfWeek, formatCompactCurrency, formatCurrency, formatShare, pluralize, type CalendarDay } from "@/app/(app)/dashboard/_components/dashboard-view-model";

type Metric = "count" | "amount";
type Totals = { totalSpend: number; transactionCount: number };
type Slot = Totals & { weekday: number; from: number; to: number; recipients: Array<Totals & { recipient: string }> };

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const PARTS = [
  { label: "Morning", from: 5, to: 12, hint: "05:00–12:00" },
  { label: "Afternoon", from: 12, to: 17, hint: "12:00–17:00" },
  { label: "Evening", from: 17, to: 22, hint: "17:00–22:00" },
  { label: "Late night", from: 22, to: 29, hint: "22:00–05:00" },
];
const SHADES = ["bg-card", "bg-[var(--paper-mint)]", "bg-[#bdeed3]", "bg-primary", "bg-[#2b9b69]", "bg-[#171714]"];

/** "09:00"; the end of the day reads "24:00". */
const clock = (hour: number) => `${String(hour === 24 ? 24 : hour % 24).padStart(2, "0")}:00`;
const measure = (totals: Totals, metric: Metric) => (metric === "count" ? totals.transactionCount : totals.totalSpend);

function buildSlots(patterns: DashboardPatternCell[], blockHours: number): Slot[][] {
  const grid: Slot[][] = Array.from({ length: 7 }, (_, weekday) =>
    Array.from({ length: 24 / blockHours }, (_, index) => ({ weekday, from: index * blockHours, to: (index + 1) * blockHours, totalSpend: 0, transactionCount: 0, recipients: [] }))
  );
  const recipientMaps = grid.map((row) => row.map(() => new Map<string, Totals>()));
  for (const cell of patterns) {
    const index = Math.floor(cell.hour / blockHours);
    const slot = grid[cell.weekday][index];
    slot.totalSpend += cell.totalSpend;
    slot.transactionCount += cell.transactionCount;
    for (const paid of cell.topRecipients) {
      const entry = recipientMaps[cell.weekday][index].get(paid.recipient) ?? { totalSpend: 0, transactionCount: 0 };
      entry.totalSpend += paid.totalSpend;
      entry.transactionCount += paid.transactionCount;
      recipientMaps[cell.weekday][index].set(paid.recipient, entry);
    }
  }
  grid.forEach((row, weekday) =>
    row.forEach((slot, index) => {
      slot.recipients = [...recipientMaps[weekday][index].entries()]
        .map(([recipient, totals]) => ({ recipient, ...totals }))
        .sort((a, b) => b.transactionCount - a.transactionCount || b.totalSpend - a.totalSpend)
        .slice(0, 3);
    })
  );
  return grid;
}

/** Weekday-by-time patterns: when payments happen, read either as how often or how much. */
export function InsightsPatterns({ patterns, days }: { patterns: DashboardPatternCell[]; days: CalendarDay[] }) {
  const [metric, setMetric] = useState<Metric>("count");
  const isWide = useMediaQuery("(min-width: 768px)");
  const blockHours = isWide ? 1 : 3;
  const grid = useMemo(() => buildSlots(patterns, blockHours), [patterns, blockHours]);
  const all = grid.flat();
  const totalPayments = all.reduce((sum, slot) => sum + slot.transactionCount, 0);
  const peak = [...all].sort((a, b) => measure(b, metric) - measure(a, metric))[0];
  const [chosen, setChosen] = useState<{ weekday: number; hour: number } | null>(null);
  const selected = chosen ? grid[chosen.weekday][Math.floor(chosen.hour / blockHours)] : peak;

  const max = Math.max(...all.map((slot) => measure(slot, metric)), 1);
  const shade = (slot: Totals) => {
    const value = measure(slot, metric);
    return value ? Math.min(SHADES.length - 1, 1 + Math.floor(Math.sqrt(value / max) * (SHADES.length - 1.01))) : 0;
  };
  const columns = grid[0].map((_, index) => grid.reduce((sum, row) => sum + measure(row[index], metric), 0));
  const maxColumn = Math.max(...columns, 1);
  const reading = useMemo(() => buildReading(patterns, days), [patterns, days]);

  if (!patterns.length) {
    return (
      <div id="insights-panel-patterns" role="tabpanel" aria-labelledby="insights-tab-patterns">
        <section className={dashboardPanelClassName}><PanelNote title="No patterns yet" body="Patterns appear once this range has a few transactions." /></section>
      </div>
    );
  }

  return (
    <div id="insights-panel-patterns" role="tabpanel" aria-labelledby="insights-tab-patterns" className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={cn(dashboardPanelClassName, "p-4 sm:p-5")}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-1.5 text-base font-bold text-foreground">
              When you pay
              <InfoTip label="When you pay">Each square is a weekday and time of day in IST. Darker means more payments, or more money, in that slot across the range. Tap a square for details.</InfoTip>
            </h2>
            <p className="text-sm text-secondary-foreground">{metric === "count" ? "How often you pay, by weekday and time." : "How much goes out, by weekday and time."} Tap a square for details.</p>
          </div>
          <div role="radiogroup" aria-label="Measure" className={segmentClassName}>
            {([["count", "How often"], ["amount", "How much"]] as const).map(([option, label]) => (
              <button key={option} type="button" role="radio" aria-checked={metric === option} onClick={() => setMetric(option)} className={cn(segmentItemClassName(metric === option), "whitespace-nowrap px-3")}>
                <span className="font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-[3px]" style={{ gridTemplateColumns: `34px repeat(${24 / blockHours}, minmax(0,1fr))` }}>
          <span aria-hidden />
          {grid[0].map((slot, index) => (
            <span key={index} aria-hidden className="text-center text-[10px] font-semibold text-secondary-foreground tabular-nums">
              {isWide ? (index % 3 === 0 ? String(slot.from).padStart(2, "0") : "") : clock(slot.from).slice(0, 2)}
            </span>
          ))}
          {grid.map((row, weekday) => (
            <div key={weekday} role="row" className="contents">
              <span className="flex items-center text-xs font-semibold text-secondary-foreground">{WEEKDAYS[weekday].slice(0, 3)}</span>
              {row.map((slot, index) => {
                const level = shade(slot);
                const isSelected = selected?.weekday === slot.weekday && selected.from === slot.from;
                const value = measure(slot, metric);
                return (
                  <button
                    key={index}
                    type="button"
                    aria-pressed={isSelected}
                    aria-label={`${WEEKDAYS[weekday]}, ${clock(slot.from)}–${clock(slot.to)}: ${slot.transactionCount ? `${pluralize(slot.transactionCount, "payment")}, ${formatCurrency(slot.totalSpend)}` : "no payments"}`}
                    title={`${WEEKDAYS[weekday]} ${clock(slot.from)}–${clock(slot.to)}`}
                    onClick={() => setChosen({ weekday, hour: slot.from })}
                    className={cn(
                      "grid place-items-center rounded-[4px] border text-[11px] font-bold tabular-nums transition-transform hover:z-10 hover:scale-110",
                      focusRing,
                      isWide ? "aspect-square" : "h-10",
                      level ? "border-border" : "border-border/20",
                      level >= 4 ? "text-[#fffdf7]" : "text-[#171714]",
                      SHADES[level],
                      isSelected && "z-10 scale-110 ring-2 ring-destructive ring-offset-1 ring-offset-card"
                    )}
                  >
                    {!isWide && value ? (metric === "count" ? value : formatCompactCurrency(value).replace("₹", "")) : null}
                  </button>
                );
              })}
            </div>
          ))}
          <span className="pt-1 text-[10px] font-semibold leading-tight text-secondary-foreground">All week</span>
          {columns.map((value, index) => (
            <span key={index} className="flex h-8 items-end pt-1" title={`${clock(grid[0][index].from)}–${clock(grid[0][index].to)}: ${metric === "count" ? pluralize(value, "payment") : formatCurrency(value)}`}>
              <span className="block w-full rounded-t-[2px] bg-foreground/60" style={{ height: `${Math.max(value ? 8 : 0, (value / maxColumn) * 100)}%` }} />
            </span>
          ))}
        </div>

        <ul aria-label="Legend" className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 border-t-2 border-dashed border-border/45 pt-3 text-xs text-secondary-foreground">
          <li>Less</li>
          {SHADES.map((className, index) => <li key={index}><span className={cn("block h-3 w-3 rounded-[3px] border", index ? "border-border" : "border-border/20", className)} aria-hidden /></li>)}
          <li>More</li>
          <li className="ml-auto">Times in IST</li>
        </ul>

        {selected ? <SlotDetail slot={selected} totalPayments={totalPayments} /> : null}
      </section>

      <section className={cn(dashboardPanelClassName, "p-4 sm:p-5")}>
          <h2 className="text-base font-bold">What stands out</h2>
          <ol className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
            {reading.notes.map((note) => (
              <li key={note.title} className="rounded-[8px] border-2 border-border bg-background/60 p-3">
                <p className={dashboardTopCardLabelClassName}>{note.title}</p>
                <p className="mt-1 text-[15px] font-bold leading-5">{note.headline}</p>
                <p className="mt-0.5 text-sm text-secondary-foreground">{note.detail}</p>
              </li>
            ))}
          </ol>
      </section>

      <div className="grid items-start gap-4 lg:grid-cols-2 xl:col-span-2">
        <section className={cn(dashboardPanelClassName, "p-4 sm:p-5")}>
          <h2 className="text-base font-bold">By weekday</h2>
          <p className="text-sm text-secondary-foreground">Bars show the average spend per occurrence, such as per Monday.</p>
          <ul className="mt-3 space-y-2.5">
            {reading.weekdays.map((weekday) => (
              <li key={weekday.name}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="font-semibold">{weekday.name}</span>
                  <span className="tabular-nums text-secondary-foreground">
                    {pluralize(weekday.transactionCount, "payment")} · <strong className="font-bold text-foreground">{formatCurrency(weekday.average)}</strong> avg
                  </span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/[0.08]">
                  <div className="h-full rounded-full bg-foreground/70" style={{ width: `${weekday.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
        <section className={cn(dashboardPanelClassName, "p-4 sm:p-5")}>
          <h2 className="text-base font-bold">Time of day</h2>
          <ul className="mt-3 space-y-2.5">
            {reading.parts.map((part) => (
              <li key={part.label}>
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span><span className="font-semibold">{part.label}</span> <span className="text-xs text-secondary-foreground">{part.hint}</span></span>
                  <span className="tabular-nums text-secondary-foreground"><strong className="font-bold text-foreground">{formatCurrency(part.totalSpend)}</strong> · {pluralize(part.transactionCount, "payment")}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-foreground/[0.08]">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${part.share}%` }} />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

function SlotDetail({ slot, totalPayments }: { slot: Slot; totalPayments: number }) {
  return (
    <div aria-live="polite" className="mt-4 rounded-[8px] border-2 border-border bg-[var(--paper-mint)] p-3 text-[#171714] sm:p-4">
      <p className={dashboardTopCardLabelClassName}>{WEEKDAYS[slot.weekday]}s · {clock(slot.from)}–{clock(slot.to)}</p>
      {slot.transactionCount ? (
        <>
          <dl className="mt-2 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Payments", String(slot.transactionCount)],
              ["Total", formatCurrency(slot.totalSpend)],
              ["Average", formatCurrency(slot.totalSpend / slot.transactionCount)],
              ["Of all payments", `${formatShare(slot.transactionCount, totalPayments)}%`],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold">{label}</dt>
                <dd className="text-lg font-extrabold leading-tight tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          {slot.recipients.length ? (
            <>
              <p className="mt-3 text-xs font-semibold">Who you paid then</p>
              <ul className="mt-1 divide-y divide-border/15">
                {slot.recipients.map((recipient) => (
                  <li key={recipient.recipient} className="flex items-baseline justify-between gap-3 py-1.5 text-sm">
                    <span title={recipient.recipient} className="min-w-0 truncate font-semibold">{tidyRecipientName(recipient.recipient)}</span>
                    <span className="shrink-0 tabular-nums">{pluralize(recipient.transactionCount, "payment")} · <strong className="font-bold">{formatCurrency(recipient.totalSpend)}</strong></span>
                  </li>
                ))}
              </ul>
            </>
          ) : null}
        </>
      ) : (
        <p className="mt-1 text-sm">No payments in this slot.</p>
      )}
    </div>
  );
}

function buildReading(patterns: DashboardPatternCell[], days: CalendarDay[]) {
  const windows = new Map<string, Totals & { weekday: number; from: number }>();
  for (const cell of patterns) {
    const from = Math.floor(cell.hour / 3) * 3;
    const key = `${cell.weekday}:${from}`;
    const window = windows.get(key) ?? { weekday: cell.weekday, from, totalSpend: 0, transactionCount: 0 };
    window.totalSpend += cell.totalSpend;
    window.transactionCount += cell.transactionCount;
    windows.set(key, window);
  }
  const peak = [...windows.values()].sort((a, b) => b.transactionCount - a.transactionCount || b.totalSpend - a.totalSpend)[0];

  const elapsed = days.filter((day) => !day.future);
  const occurrences = WEEKDAYS.map((_, weekday) => elapsed.filter((day) => dayOfWeek(day.day) === weekday).length);
  const weekdayTotals = WEEKDAYS.map((name, weekday) => {
    const cells = patterns.filter((cell) => cell.weekday === weekday);
    const totalSpend = cells.reduce((sum, cell) => sum + cell.totalSpend, 0);
    return { name, totalSpend, transactionCount: cells.reduce((sum, cell) => sum + cell.transactionCount, 0), average: occurrences[weekday] ? totalSpend / occurrences[weekday] : 0 };
  });
  const maxAverage = Math.max(...weekdayTotals.map((weekday) => weekday.average), 1);
  const weekdays = weekdayTotals.map((weekday) => ({ ...weekday, share: Math.round((weekday.average / maxAverage) * 100) }));
  const busiest = [...weekdays].sort((a, b) => b.transactionCount - a.transactionCount)[0];
  const quietest = [...weekdays].filter((weekday, index) => occurrences[index]).sort((a, b) => a.transactionCount - b.transactionCount || a.totalSpend - b.totalSpend)[0];

  const weekendDays = elapsed.filter((day) => dayOfWeek(day.day) >= 5);
  const weekdayDays = elapsed.filter((day) => dayOfWeek(day.day) < 5);
  const average = (list: CalendarDay[]) => (list.length ? list.reduce((sum, day) => sum + day.total, 0) / list.length : 0);
  const weekendAverage = average(weekendDays);
  const weekdayAverage = average(weekdayDays);

  const total = patterns.reduce((sum, cell) => sum + cell.totalSpend, 0);
  const totalPayments = patterns.reduce((sum, cell) => sum + cell.transactionCount, 0);
  const parts = PARTS.map((part) => {
    const cells = patterns.filter((cell) => {
      const hour = cell.hour < 5 ? cell.hour + 24 : cell.hour;
      return hour >= part.from && hour < part.to;
    });
    const totalSpend = cells.reduce((sum, cell) => sum + cell.totalSpend, 0);
    return { ...part, totalSpend, transactionCount: cells.reduce((sum, cell) => sum + cell.transactionCount, 0), share: total ? Math.round((totalSpend / total) * 100) : 0 };
  });
  const lateNight = parts[3];

  const notes: Array<{ title: string; headline: string; detail: string }> = [];
  if (peak) notes.push({ title: "Peak time", headline: `${WEEKDAYS[peak.weekday]}s, ${clock(peak.from)}–${clock(peak.from + 3)}`, detail: `${pluralize(peak.transactionCount, "payment")} in this slot, ${formatCurrency(peak.totalSpend)} in all.` });
  if (busiest?.transactionCount) notes.push({ title: "Busiest day", headline: busiest.name, detail: `${pluralize(busiest.transactionCount, "payment")}, ${formatCurrency(busiest.totalSpend)}.` });
  if (quietest && quietest.name !== busiest?.name) notes.push({ title: "Quietest day", headline: quietest.name, detail: `${pluralize(quietest.transactionCount, "payment")}, ${formatCurrency(quietest.totalSpend)}.` });
  if (weekendDays.length && weekdayDays.length) {
    notes.push({
      title: "Weekends",
      headline:
        weekendAverage > weekdayAverage * 1.15
          ? `${Math.round((weekendAverage / Math.max(weekdayAverage, 1) - 1) * 100)}% more per day than weekdays`
          : weekdayAverage > weekendAverage * 1.15
            ? `${Math.round((1 - weekendAverage / Math.max(weekdayAverage, 1)) * 100)}% less per day than weekdays`
            : "About the same as weekdays",
      detail: `Weekend days average ${formatCurrency(weekendAverage)}; weekdays ${formatCurrency(weekdayAverage)}.`,
    });
  }
  if (lateNight.transactionCount) notes.push({ title: "Late nights", headline: `${formatShare(lateNight.transactionCount, totalPayments)}% of payments between 22:00 and 05:00`, detail: `${pluralize(lateNight.transactionCount, "payment")}, ${formatCurrency(lateNight.totalSpend)}.` });

  return { notes, parts, weekdays };
}
