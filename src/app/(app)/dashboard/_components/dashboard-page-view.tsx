"use client";

import { ArrowRight, Check, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, type KeyboardEvent, type ReactNode } from "react";

import { tidyRecipientName } from "@/common/recipient-name";
import { AppPageHeader } from "@/components/product/app-page-header";
import { MobilePageHeader } from "@/components/product/mobile/mobile-primitives";
import { Button } from "@/components/ui/button";
import { useDashboardCategorize } from "@/features/dashboard/mutations";
import { cn } from "@/lib/utils";
import type { DashboardPageData, SpendingRange } from "@/server/page-data/dashboard-page-data";

import { MonthGrid } from "@/app/(app)/insights/_components/insights-calendar";

import { DashboardSummaryStrip } from "./dashboard-summary-strip";
import { dashboardPanelClassName } from "./dashboard-style";
import { DashboardMobileTimePeriodRow, DashboardTimeframePicker } from "./dashboard-timeframe-picker";
import { CategoryMenu, CategoryPill, focusRing, PanelNote } from "./dashboard-ui";
import {
  addDays,
  buildCalendarDays,
  buildWeeks,
  formatCompactCurrency,
  formatCurrency,
  formatDashboardRangeLabel,
  formatDayFull,
  formatDayShort,
  formatIstTime,
  formatMonthShort,
  formatNumber,
  formatShare,
  getCalendarRange,
  getRangeName,
  pluralize,
  toIstDay,
  type CalendarDay,
  type CalendarRange,
} from "./dashboard-view-model";

/** Link into Insights that keeps the dashboard's range. */
function insightsHref(range: SpendingRange, params: Record<string, string>) {
  const search = new URLSearchParams({ range: range.value, ...params });
  if (range.value === "custom" && range.startDate && range.endDate) {
    search.set("startDate", range.startDate);
    search.set("endDate", range.endDate);
  }
  return `/insights?${search.toString()}`;
}

function CardHeader({ title, sub, href, linkLabel }: { title: string; sub?: string; href?: string; linkLabel?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h2 className="text-base font-bold text-foreground">{title}</h2>
        {sub ? <p className="text-sm text-secondary-foreground">{sub}</p> : null}
      </div>
      {href && linkLabel ? (
        <Link href={href} className={cn("-my-1 inline-flex min-h-9 shrink-0 items-center gap-1 rounded-[6px] px-1.5 text-sm text-foreground underline-offset-4 hover:underline", focusRing)}>
          <span className="font-semibold">{linkLabel}</span>
          <ArrowRight className="h-3.5 w-3.5" aria-hidden />
        </Link>
      ) : null}
    </div>
  );
}

function Card({ children, className, label }: { children: ReactNode; className?: string; label: string }) {
  return <section aria-label={label} className={cn(dashboardPanelClassName, "flex flex-col p-4 sm:p-5", className)}>{children}</section>;
}

export function DashboardPageView({ data }: { data: DashboardPageData }) {
  const router = useRouter();
  const calendar = useMemo(() => getCalendarRange(data.range, data.today, data.days), [data.range, data.today, data.days]);
  const days = useMemo(() => buildCalendarDays(calendar, data.days), [calendar, data.days]);
  const meta = <span className="font-medium text-foreground">{formatDashboardRangeLabel(data.range, calendar)}</span>;
  const picker = { value: data.range.value, startDate: data.range.startDate, endDate: data.range.endDate };
  const reviewHref = insightsHref(data.range, { tab: "recipients", review: "1" });

  return (
    <div className="space-y-4">
      <MobilePageHeader eyebrow="Spend operations" title="Dashboard" meta={meta} />
      <div className="lg:hidden"><DashboardMobileTimePeriodRow {...picker} /></div>
      <div className="hidden lg:block">
        <AppPageHeader eyebrow="Spend operations" title="Dashboard" meta={meta} actions={<DashboardTimeframePicker {...picker} />} />
      </div>

      {data.status === "error" ? (
        <section role="alert" className="flex flex-col gap-3 rounded-[8px] border-2 border-destructive/45 bg-destructive/10 px-4 py-3 text-sm text-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold">{data.message}</p>
          <Button variant="secondary" size="sm" onClick={() => router.refresh()}><span className="font-bold">Try again</span></Button>
        </section>
      ) : (
        <>
          <DashboardSummaryStrip data={data} calendar={calendar} days={days} uncategorizedAmount={data.uncategorizedAmount} onReview={() => router.push(reviewHref)} />

          {data.summary.transactionCount === 0 ? (
            <Card label="No transactions">
              <p className="text-base font-bold">No transactions in this period</p>
              <p className="mt-1 text-sm text-secondary-foreground">New payments appear here as your SMS are imported. Try a longer range to see earlier ones.</p>
            </Card>
          ) : (
            <>
              <div className="grid items-stretch gap-4 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
                <NeedsCategory data={data} reviewHref={reviewHref} className="lg:order-2" />
                <AtAGlance data={data} calendar={calendar} days={days} className="lg:order-1" />
              </div>
              <div className="grid items-start gap-4 lg:grid-cols-2">
                <TopRecipients data={data} />
                <Latest data={data} />
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function AtAGlance({ data, calendar, days, className }: { data: DashboardPageData; calendar: CalendarRange; days: CalendarDay[]; className?: string }) {
  const router = useRouter();
  const byDay = useMemo(() => new Map(days.map((day) => [day.day, day])), [days]);
  const elapsed = days.filter((day) => !day.future);
  const biggest = [...elapsed].sort((a, b) => b.total - a.total)[0];
  const quietDays = elapsed.filter((day) => day.count === 0).length;
  const weeks = buildWeeks(calendar.start, calendar.end).map((week) => ({ start: week[0], total: week.reduce((sum, day) => sum + (byDay.get(day)?.total ?? 0), 0) }));
  const busiestWeek = [...weeks].sort((a, b) => b.total - a.total)[0];
  const months = useMemo(() => {
    const totals = new Map<string, number>();
    for (const day of days) if (!day.future) totals.set(day.day.slice(0, 7), (totals.get(day.day.slice(0, 7)) ?? 0) + day.total);
    return [...totals.entries()];
  }, [days]);
  const maxMonth = Math.max(...months.map(([, total]) => total), 1);
  const openDay = (day: string) => router.push(insightsHref(data.range, { tab: "calendar", day }));
  // No day is selected here, so one day holds the Tab stop and arrow keys move focus between days.
  const tabStop = data.today < calendar.start ? calendar.start : data.today > calendar.end ? calendar.end : data.today;
  const moveFocus = (event: KeyboardEvent, day: string) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
    if (!(event.key in steps)) return;
    event.preventDefault();
    const grid = (event.currentTarget as HTMLElement).closest('[role="grid"]');
    grid?.querySelector<HTMLButtonElement>(`[data-day="${addDays(day, steps[event.key])}"]:not(:disabled)`)?.focus();
  };
  const name = getRangeName(data.range, calendar);

  return (
    <Card label="At a glance" className={className}>
      <CardHeader title={`${name.replace(/^./, (letter) => letter.toUpperCase())} at a glance`} sub="Tap a day to open it in Insights." href={insightsHref(data.range, { tab: "calendar" })} linkLabel="Calendar" />
      <div className="mt-4 grid gap-5 sm:grid-cols-[minmax(0,1fr)_170px] sm:items-center">
        {calendar.layout === "month" ? (
          <MonthGrid compact calendar={calendar} byDay={byDay} today={data.today} selected="" tabStop={tabStop} onPick={openDay} onKeyDown={moveFocus} />
        ) : (
          <div className="grid h-36 items-end gap-1.5" style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0,1fr))` }}>
            {months.map(([month, total]) => (
              <div key={month} className="flex h-full min-w-0 flex-col items-center justify-end gap-1" title={`${formatMonthShort(`${month}-01`)} ${month.slice(0, 4)}: ${formatCurrency(total)}`}>
                <span className="block w-full max-w-[26px] rounded-t-[3px] border-2 border-b-0 border-border bg-primary" style={{ height: `${Math.max(4, (total / maxMonth) * 85)}%` }} />
                <span className="text-[11px] font-semibold text-secondary-foreground">{formatMonthShort(`${month}-01`)[0]}</span>
              </div>
            ))}
          </div>
        )}
        <dl className="grid grid-cols-3 gap-3 sm:grid-cols-1 sm:gap-4">
          {biggest && biggest.total > 0 ? (
            <div>
              <dt className="text-xs font-semibold text-secondary-foreground">Biggest day</dt>
              <dd className="mt-0.5">
                <button type="button" onClick={() => openDay(biggest.day)} className={cn("rounded-[4px] text-left underline-offset-4 hover:underline", focusRing)}>
                  <span className="block text-base font-extrabold tabular-nums">{formatCompactCurrency(biggest.total)}</span>
                  <span className="block text-xs text-secondary-foreground">{formatDayShort(biggest.day)}</span>
                </button>
              </dd>
            </div>
          ) : null}
          {busiestWeek && busiestWeek.total > 0 ? (
            <div>
              <dt className="text-xs font-semibold text-secondary-foreground">Busiest week</dt>
              <dd className="mt-0.5"><span className="block text-base font-extrabold tabular-nums">{formatCompactCurrency(busiestWeek.total)}</span><span className="block text-xs text-secondary-foreground">From {formatDayShort(busiestWeek.start)}</span></dd>
            </div>
          ) : null}
          <div>
            <dt className="text-xs font-semibold text-secondary-foreground">Quiet days</dt>
            <dd className="mt-0.5"><span className="block text-base font-extrabold tabular-nums">{quietDays}</span><span className="block text-xs text-secondary-foreground">with no payments</span></dd>
          </div>
        </dl>
      </div>
    </Card>
  );
}

function NeedsCategory({ data, reviewHref, className }: { data: DashboardPageData; reviewHref: string; className?: string }) {
  const { categorize, pending } = useDashboardCategorize();
  const count = data.summary.uncategorizedCount;
  return (
    <Card label="Needs a category" className={cn("gap-3", className)}>
      <CardHeader
        title="Needs a category"
        sub={count ? `${formatNumber(count)} uncategorized · ${formatShare(data.uncategorizedAmount, data.summary.totalSpend)}% of spend. Largest first.` : undefined}
      />
      {data.needsCategory.length ? (
        <ul className="divide-y-2 divide-border/15">
          {data.needsCategory.map((transaction) => {
            const name = tidyRecipientName(transaction.recipient);
            return (
              <li key={transaction.uuid} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2.5">
                <Link href={`/transactions/${transaction.uuid}`} title={transaction.recipient} className={cn("min-w-0 truncate rounded-[4px] text-sm font-semibold underline-offset-4 hover:underline", focusRing)}>{name}</Link>
                <span className="text-right text-sm font-bold tabular-nums">{formatCurrency(transaction.amount)}</span>
                <span className="text-xs text-secondary-foreground tabular-nums">{formatDayFull(toIstDay(transaction.timestamp))} · {formatIstTime(transaction.timestamp)}</span>
                <CategoryMenu
                  label={`Category for ${name}`}
                  categories={data.categoryOptions}
                  current={null}
                  onPick={(choice) => void categorize({ transactions: [{ uuid: transaction.uuid, categoryUuid: null, subcategoryUuid: null }], choice, description: `${name}, ${formatCurrency(transaction.amount)}` })}
                  trigger={({ open, toggle, ref }) => (
                    <button ref={ref} type="button" aria-haspopup="menu" aria-expanded={open} disabled={pending} onClick={toggle} className="group justify-self-end rounded-[999px] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-wait">
                      <span className="inline-flex min-h-8 items-center gap-1 rounded-[999px] border-2 border-border bg-[#fff1bd] px-2.5 text-xs font-bold transition-[box-shadow,transform] group-hover:-translate-y-px group-hover:shadow-[1px_2px_0_var(--foreground)]">
                        Set category <ChevronDown className="h-3.5 w-3.5" aria-hidden />
                      </span>
                    </button>
                  )}
                />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 py-6 text-center">
          <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-border bg-primary"><Check className="h-5 w-5" strokeWidth={3} aria-hidden /></span>
          <p className="text-sm font-bold">Everything is categorized</p>
          <p className="text-sm text-secondary-foreground">New payments that need a category will show up here.</p>
        </div>
      )}
      {count > data.needsCategory.length ? (
        <Button asChild variant="secondary" className="mt-auto w-full">
          <Link href={reviewHref}><span className="font-bold">Review all {formatNumber(count)} in Insights</span><ArrowRight className="h-4 w-4" aria-hidden /></Link>
        </Button>
      ) : null}
    </Card>
  );
}

function TopRecipients({ data }: { data: DashboardPageData }) {
  const max = Math.max(...data.topRecipients.map((recipient) => recipient.totalAmount), 1);
  return (
    <Card label="Top recipients">
      <CardHeader title="Top recipients" sub="Where most of the money went." href={insightsHref(data.range, { tab: "recipients" })} linkLabel={`All ${formatNumber(data.recipientCount)}`} />
      {data.topRecipients.length ? (
        <ol className="mt-2 divide-y-2 divide-border/15">
          {data.topRecipients.map((recipient, index) => (
            <li key={recipient.recipientUuid ?? recipient.recipient} className="grid grid-cols-[20px_minmax(0,1fr)_auto] items-center gap-x-3 py-2.5">
              <span className="text-xs font-bold text-secondary-foreground tabular-nums">{index + 1}</span>
              <span className="min-w-0">
                {recipient.recipientUuid ? (
                  <Link href={`/recipients/${recipient.recipientUuid}`} title={recipient.recipient} className={cn("block truncate rounded-[4px] text-sm font-semibold underline-offset-4 hover:underline", focusRing)}>{tidyRecipientName(recipient.recipient)}</Link>
                ) : (
                  <span className="block truncate text-sm font-semibold">{tidyRecipientName(recipient.recipient)}</span>
                )}
                <span className="mt-1 block h-1.5 rounded-full bg-foreground/[0.07]" aria-hidden>
                  <span className="block h-full rounded-full bg-foreground/60" style={{ width: `${(recipient.totalAmount / max) * 100}%` }} />
                </span>
              </span>
              <span className="text-right">
                <span className="block text-sm font-bold tabular-nums">{formatCurrency(recipient.totalAmount)}</span>
                <span className="block text-xs text-secondary-foreground tabular-nums">{pluralize(recipient.transactionCount, "payment")}</span>
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <PanelNote title="No recipients yet" />
      )}
    </Card>
  );
}

function Latest({ data }: { data: DashboardPageData }) {
  return (
    <Card label="Latest transactions">
      <CardHeader title="Latest" sub="The most recent payments in this range." href="/transactions" linkLabel="All transactions" />
      {data.latestTransactions.length ? (
        <ul className="mt-2 divide-y-2 divide-border/15">
          {data.latestTransactions.map((transaction) => (
            <li key={transaction.uuid}>
              <Link href={`/transactions/${transaction.uuid}`} className={cn("-mx-2 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-[6px] px-2 py-2.5 transition-colors hover:bg-[var(--paper-mint)]", focusRing)}>
                <span title={transaction.recipient} className="min-w-0 truncate text-sm font-semibold">{tidyRecipientName(transaction.recipient)}</span>
                <span className="text-right text-sm font-bold tabular-nums">{formatCurrency(transaction.amount)}</span>
                <span className="text-xs text-secondary-foreground tabular-nums">{formatDayShort(toIstDay(transaction.timestamp))} · {formatIstTime(transaction.timestamp)}</span>
                <CategoryPill value={transaction.category} className="min-h-7 justify-self-end px-2 text-[11px]" />
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <PanelNote title="No transactions yet" />
      )}
    </Card>
  );
}
