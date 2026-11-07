"use client";

import { ArrowDownWideNarrow, ArrowRight, ChevronDown, ChevronRight, ExternalLink, Pencil, Search, X } from "lucide-react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import type { CategoryOption } from "@/common/types";
import { tidyRecipientName } from "@/common/recipient-name";
import { toast } from "@/components/ui/sonner";
import { ApiClientError, apiPatch } from "@/lib/api/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardCategorize } from "@/features/dashboard/mutations";
import { useDashboardTransactions } from "@/features/dashboard/queries";
import { cn } from "@/lib/utils";
import type { DashboardRecipientActivity, DashboardTransactionDto } from "@/server/page-data/dashboard-page-data";

import { dashboardInnerTableClassName, dashboardPanelClassName, dashboardTableHeaderClassName, dashboardTopCardLabelClassName } from "@/app/(app)/dashboard/_components/dashboard-style";
import { CategoryMenu, CategoryPill, focusRing, InfoTip, PanelNote } from "@/app/(app)/dashboard/_components/dashboard-ui";
import {
  addDays,
  addMonths,
  buildTransactionsHref,
  dayOfWeek,
  daysBetween,
  formatCurrency,
  formatDayFull,
  formatDayShort,
  formatIstTime,
  formatMonthYear,
  formatShare,
  median,
  pluralize,
  toIstDay,
  type CalendarRange,
} from "@/app/(app)/dashboard/_components/dashboard-view-model";

type Sort = "total" | "count" | "days";
type Filter = "all" | "regulars" | "one-offs" | "uncategorized";
const PAGE = 12;
const REGULAR_DAYS = 4;
const COLUMNS = "md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_104px_170px]";

type RhythmUnit = "day" | "week" | "month";

/** Ticks for the "days paid" strip: days up to about six weeks, weeks up to about six months, then months. */
function buildRhythmBuckets(calendar: CalendarRange) {
  const span = daysBetween(calendar.start, calendar.end) + 1;
  const unit: RhythmUnit = span <= 45 ? "day" : span <= 186 ? "week" : "month";
  const buckets: Array<{ key: string; label: string }> = [];
  if (unit === "month") {
    for (let month = `${calendar.start.slice(0, 7)}-01`; month <= calendar.end; month = addMonths(month, 1)) {
      buckets.push({ key: month, label: formatMonthYear(month) });
    }
  } else {
    const step = unit === "week" ? 7 : 1;
    for (let day = unit === "week" ? addDays(calendar.start, -dayOfWeek(calendar.start)) : calendar.start; day <= calendar.end; day = addDays(day, step)) {
      buckets.push({ key: day, label: unit === "week" ? `Week of ${formatDayFull(day)}` : formatDayFull(day) });
    }
  }
  return { buckets, unit };
}

function bucketKey(day: string, unit: RhythmUnit) {
  return unit === "month" ? `${day.slice(0, 7)}-01` : unit === "week" ? addDays(day, -dayOfWeek(day)) : day;
}

const isRegular = (recipient: DashboardRecipientActivity) => recipient.days.length >= REGULAR_DAYS;
const paidDays = (recipient: DashboardRecipientActivity) => recipient.days.map(([day]) => day).sort();

/** "23 Jul", with the year only when it differs from the range's last day. */
function formatPaidDay(day: string, rangeEnd: string) {
  return day.slice(0, 4) === rangeEnd.slice(0, 4) ? formatDayShort(day) : formatDayFull(day);
}

/** A plain reading of the usual gap between payment days. */
function describeRhythm(days: string[]) {
  if (days.length < 2) return "Once";
  if (days.length === 2) return "Twice";
  const typical = median(days.slice(1).map((day, index) => daysBetween(days[index], day)));
  if (typical <= 1.5) return "Almost daily";
  if (typical <= 4) return "Every few days";
  if (typical <= 10) return "About weekly";
  if (typical <= 20) return "Every two weeks or so";
  if (typical <= 45) return "About monthly";
  return `About every ${Math.round(typical / 30)} months`;
}

function RecipientStatus({ recipient }: { recipient: DashboardRecipientActivity }) {
  if (recipient.uncategorizedCount === recipient.transactionCount) return <CategoryPill value={null} />;
  if (recipient.uncategorizedCount) {
    return <CategoryPill value={null} label={`${recipient.uncategorizedCount} of ${recipient.transactionCount} uncategorized`} />;
  }
  if (recipient.categories.length > 1) {
    const label = recipient.categories.length === 2 ? `Mixed: ${recipient.categories.join(", ")}` : `Mixed: ${recipient.categories.length} categories`;
    return <CategoryPill value="Mixed" label={label} title={recipient.categories.join(", ")} className="bg-secondary/55" />;
  }
  return <CategoryPill value={recipient.categories[0] ?? null} />;
}

/** The category as inline text for the compact phone row; uncategorized stays highlighted. */
function RecipientStatusText({ recipient }: { recipient: DashboardRecipientActivity }) {
  if (recipient.uncategorizedCount) {
    const label = recipient.uncategorizedCount === recipient.transactionCount ? "Uncategorized" : `${recipient.uncategorizedCount} uncategorized`;
    return <span className="rounded-[4px] bg-[#fff1bd] px-1 font-semibold text-[#171714]">{label}</span>;
  }
  const label = recipient.categories.length > 1 ? "Mixed" : recipient.categories[0];
  return label ? <span title={recipient.categories.join(", ")} className="font-semibold text-foreground">{label}</span> : null;
}

function Rhythm({ recipient, buckets, unit, small = false }: { recipient: DashboardRecipientActivity; buckets: Array<{ key: string; label: string }>; unit: RhythmUnit; small?: boolean }) {
  const amounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const [day, amount] of recipient.days) map.set(bucketKey(day, unit), (map.get(bucketKey(day, unit)) ?? 0) + amount);
    return map;
  }, [recipient.days, unit]);
  const max = Math.max(...amounts.values(), 1);
  return (
    <span role="img" aria-label={`Paid on ${pluralize(recipient.days.length, "day")}`} className="flex items-end gap-[2px]">
      {buckets.map((bucket) => {
        const amount = amounts.get(bucket.key);
        return (
          <span
            key={bucket.key}
            title={amount ? `${bucket.label} · ${formatCurrency(amount)}` : bucket.label}
            className={cn("min-w-0 flex-1 rounded-[1.5px]", small ? "h-2.5" : "h-4", amount ? "bg-foreground" : unit === "day" && dayOfWeek(bucket.key) === 6 ? "bg-foreground/[0.14]" : "bg-foreground/[0.07]")}
            style={amount ? { opacity: 0.35 + 0.65 * Math.sqrt(amount / max) } : undefined}
          />
        );
      })}
    </span>
  );
}

export function InsightsRecipients({
  calendar,
  recipients,
  largest,
  categories,
  reviewOnly,
  onReviewOnlyChange,
  onPickDay,
}: {
  calendar: CalendarRange;
  recipients: DashboardRecipientActivity[];
  largest: DashboardTransactionDto[];
  categories: CategoryOption[];
  reviewOnly: boolean;
  onReviewOnlyChange: (value: boolean) => void;
  onPickDay: (day: string) => void;
}) {
  const [sort, setSort] = useState<Sort>("total");
  const [query, setQuery] = useState("");
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [baseFilter, setBaseFilter] = useState<Exclude<Filter, "uncategorized">>("all");
  const filter: Filter = reviewOnly ? "uncategorized" : baseFilter;
  const { buckets, unit } = useMemo(() => buildRhythmBuckets(calendar), [calendar]);
  const keyOf = (recipient: DashboardRecipientActivity) => recipient.recipientUuid ?? `label:${recipient.recipient}`;
  const grandTotal = recipients.reduce((sum, recipient) => sum + recipient.totalAmount, 0);
  const maxTotal = Math.max(...recipients.map((recipient) => recipient.totalAmount), 1);

  const sorted = useMemo(
    () =>
      [...recipients].sort((left, right) =>
        sort === "total"
          ? right.totalAmount - left.totalAmount
          : sort === "count"
            ? right.transactionCount - left.transactionCount || right.totalAmount - left.totalAmount
            : right.days.length - left.days.length || right.totalAmount - left.totalAmount
      ),
    [recipients, sort]
  );
  const counts: Record<Filter, number> = {
    all: recipients.length,
    regulars: recipients.filter(isRegular).length,
    "one-offs": recipients.filter((recipient) => recipient.transactionCount === 1).length,
    uncategorized: recipients.filter((recipient) => recipient.uncategorizedCount > 0).length,
  };
  const matchesFilter = (recipient: DashboardRecipientActivity) =>
    filter === "regulars"
      ? isRegular(recipient)
      : filter === "one-offs"
        ? recipient.transactionCount === 1
        : filter === "uncategorized"
          ? recipient.uncategorizedCount > 0 || keyOf(recipient) === openKey
          : true;
  const search = query.trim().toLowerCase();
  const filtered = sorted.filter((recipient) => matchesFilter(recipient) && (!search || recipient.recipient.toLowerCase().includes(search) || tidyRecipientName(recipient.recipient).toLowerCase().includes(search)));
  const shown = showAll || search ? filtered : filtered.slice(0, PAGE);
  const regulars = [...recipients].filter(isRegular).sort((left, right) => right.days.length - left.days.length).slice(0, 5);
  const allCategorized = filter === "uncategorized" && !counts.uncategorized;
  const range = `${formatDayShort(calendar.start)} to ${formatDayShort(calendar.end)}`;

  const pickFilter = (next: Filter) => {
    onReviewOnlyChange(next === "uncategorized");
    if (next !== "uncategorized") setBaseFilter(next);
  };
  const filterNote =
    filter === "regulars"
      ? { title: "No regulars in this period", body: `Regulars are recipients paid on ${REGULAR_DAYS} or more days.` }
      : filter === "one-offs"
        ? { title: "No one-off payments", body: "Everyone here was paid more than once." }
        : { title: "No recipients in this period", body: "Recipients appear once a transaction is recorded." };

  return (
    <div id="insights-panel-recipients" role="tabpanel" aria-labelledby="insights-tab-recipients" className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className={cn(dashboardPanelClassName, "p-4 sm:p-5")}>
        <div className="space-y-2">
          <div className="flex gap-2">
            <label className="relative block min-w-0 flex-1">
              <span className="sr-only">Search recipients</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" aria-hidden />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search recipients"
                className={cn("h-11 w-full rounded-[8px] border-2 border-border bg-card pl-9 text-[15px] text-foreground placeholder:text-secondary-foreground", query ? "pr-10" : "pr-3", focusRing)}
              />
              {query ? (
                <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className={cn("absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[6px] text-secondary-foreground hover:bg-secondary hover:text-foreground", focusRing)}>
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </label>
            <label className="relative inline-flex shrink-0 items-center">
              <span className="sr-only">Sort recipients</span>
              <ArrowDownWideNarrow className="pointer-events-none absolute left-2.5 h-4 w-4 text-secondary-foreground" aria-hidden />
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as Sort)}
                className={cn("h-11 cursor-pointer appearance-none rounded-[8px] border-2 border-border bg-card pl-8 pr-7 text-sm font-semibold text-foreground hover:bg-secondary", focusRing)}
              >
                <option value="total">Amount</option>
                <option value="count">Payments</option>
                <option value="days">Days paid</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 h-4 w-4 text-secondary-foreground" aria-hidden />
            </label>
          </div>
          <div role="radiogroup" aria-label="Show" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 py-1 [scrollbar-width:none]">
            {([["all", "All"], ["regulars", "Regulars"], ["one-offs", "One-offs"], ["uncategorized", "Uncategorized"]] as const).map(([value, label]) => {
              const active = filter === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => pickFilter(value)}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-[999px] border-2 px-3 text-sm transition-colors",
                    focusRing,
                    active ? (value === "uncategorized" ? "border-border bg-[#fff1bd] text-[#171714]" : "border-border bg-primary text-[#171714]") : "border-border/35 bg-card text-secondary-foreground hover:border-border hover:text-foreground"
                  )}
                >
                  <span className="font-semibold">{label}</span>
                  {value !== "all" ? <span className={cn("tabular-nums", active ? "font-bold" : "text-xs")}>{counts[value]}</span> : null}
                </button>
              );
            })}
          </div>
        </div>

        <div className={cn(dashboardInnerTableClassName, "mt-4")}>
          <div className={cn(dashboardTableHeaderClassName, "hidden md:grid", COLUMNS)}>
            <span>Showing {Math.min(shown.length, filtered.length)} of {pluralize(filtered.length, "recipient")}</span>
            <span className="flex items-center gap-1">
              Days paid
              <InfoTip label="Days paid">{`One tick per ${unit}, ${range}. A filled tick means a payment then; darker means more was paid.`}</InfoTip>
            </span>
            <span className="text-right">Amount</span>
            <span className="text-right">Category</span>
          </div>
          {allCategorized ? (
            <PanelNote title="Everything here is categorized" body="Nothing in this range is waiting for a category." />
          ) : !filtered.length ? (
            search ? (
              <PanelNote
                title={`No recipients match “${query.trim()}”`}
                body="Check the spelling, or search part of the name."
                action={<Button variant="secondary" size="sm" onClick={() => setQuery("")}><span className="font-bold">Clear search</span></Button>}
              />
            ) : (
              <PanelNote title={filterNote.title} body={filterNote.body} />
            )
          ) : (
            <ul className="divide-y-2 divide-border/15">
              {shown.map((recipient) => {
                const key = keyOf(recipient);
                const open = openKey === key;
                const name = tidyRecipientName(recipient.recipient);
                const share = formatShare(recipient.totalAmount, grandTotal);
                const lastDay = formatPaidDay(paidDays(recipient).at(-1) ?? calendar.end, calendar.end);
                const meta = `${pluralize(recipient.transactionCount, "payment")} · ${recipient.transactionCount === 1 ? lastDay : `last ${lastDay}`}`;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenKey(open ? null : key)}
                      className={cn(
                        "block w-full px-4 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5 md:grid md:items-center md:gap-x-4 md:py-3.5",
                        COLUMNS,
                        open ? "bg-[var(--paper-mint)]" : "hover:bg-secondary/35"
                      )}
                    >
                      {/* Phone: two lines and a share bar. */}
                      <span className="block md:hidden">
                        <span className="flex items-baseline gap-2">
                          <ChevronRight className={cn("h-4 w-4 shrink-0 self-center text-secondary-foreground transition-transform", open && "rotate-90")} aria-hidden />
                          <span title={recipient.recipient} className="min-w-0 flex-1 truncate text-sm font-semibold leading-5 text-foreground">{name}</span>
                          <span className="shrink-0 text-sm font-bold tabular-nums">{formatCurrency(recipient.totalAmount)}</span>
                        </span>
                        <span className="mt-0.5 block truncate pl-6 text-xs text-secondary-foreground tabular-nums">
                          <RecipientStatusText recipient={recipient} />
                          {recipient.uncategorizedCount || recipient.categories.length ? " · " : ""}
                          {meta}
                        </span>
                        <span className="mt-1 flex items-center gap-2 pl-6">
                          <span aria-hidden className="block h-1 flex-1 overflow-hidden rounded-full bg-foreground/[0.08]">
                            <span className="block h-full rounded-full bg-foreground/60" style={{ width: `${(recipient.totalAmount / maxTotal) * 100}%` }} />
                          </span>
                          <span className="w-9 shrink-0 text-right text-[11px] text-secondary-foreground tabular-nums">{share}%</span>
                        </span>
                      </span>
                      {/* Desktop: table cells. */}
                      <span className="hidden min-w-0 md:block">
                        <span className="flex items-center gap-1.5">
                          <ChevronRight className={cn("h-4 w-4 shrink-0 text-secondary-foreground transition-transform", open && "rotate-90")} aria-hidden />
                          <span title={recipient.recipient} className="min-w-0 truncate text-sm font-semibold leading-5 text-foreground">{name}</span>
                        </span>
                        <span className="block pl-[22px] text-xs text-secondary-foreground tabular-nums">{meta}</span>
                      </span>
                      <span className="hidden md:block"><Rhythm recipient={recipient} buckets={buckets} unit={unit} /></span>
                      <span className="hidden text-right md:block">
                        <span className="block text-sm font-bold tabular-nums">{formatCurrency(recipient.totalAmount)}</span>
                        <span className="block text-xs text-secondary-foreground tabular-nums">{share}% of spend</span>
                      </span>
                      <span className="hidden justify-end md:flex"><RecipientStatus recipient={recipient} /></span>
                    </button>
                    {open ? <RecipientDetail recipient={recipient} calendar={calendar} buckets={buckets} unit={unit} share={share} categories={categories} onPickDay={onPickDay} /> : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        {!search && !showAll && filtered.length > PAGE && !allCategorized ? (
          <Button variant="secondary" size="sm" className="mt-4" onClick={() => setShowAll(true)}>
            <span className="font-bold">Show all {pluralize(filtered.length, "recipient")}</span>
          </Button>
        ) : null}
      </section>

      <aside className="grid gap-4">
        {/* Phones get the Regulars filter chip instead of this panel. */}
        <section className={cn(dashboardPanelClassName, "hidden p-4 sm:p-5 md:block")}>
          <div className="flex min-h-8 items-center gap-1.5">
            <h2 className="text-base font-bold">Regulars</h2>
            <InfoTip label="Regulars">{`Recipients paid on ${REGULAR_DAYS} or more days in this range.`}</InfoTip>
          </div>
          <ul className="mt-2 divide-y-2 divide-border/15">
            {regulars.map((recipient) => (
              <li key={keyOf(recipient)} className="py-2.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span title={recipient.recipient} className="min-w-0 truncate text-sm font-semibold">{tidyRecipientName(recipient.recipient)}</span>
                  <span className="shrink-0 text-xs text-secondary-foreground tabular-nums">{recipient.days.length} days · {formatCurrency(recipient.totalAmount)}</span>
                </div>
                <div className="mt-1.5"><Rhythm recipient={recipient} buckets={buckets} unit={unit} small /></div>
              </li>
            ))}
            {!regulars.length ? <li className="py-3 text-sm text-secondary-foreground">{`No one was paid on ${REGULAR_DAYS} or more days.`}</li> : null}
          </ul>
        </section>
        <section className={cn(dashboardPanelClassName, "p-4 sm:p-5")}>
          <h2 className="text-base font-bold">Largest single payments</h2>
          <ul className="mt-2 divide-y-2 divide-border/15">
            {largest.map((transaction) => (
              <li key={transaction.uuid}>
                <button type="button" onClick={() => onPickDay(toIstDay(transaction.timestamp))} className={cn("-mx-2 flex w-[calc(100%+16px)] items-center justify-between gap-3 rounded-[6px] px-2 py-2.5 text-left transition-colors hover:bg-[var(--paper-mint)]", focusRing)}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{tidyRecipientName(transaction.recipient)}</span>
                    <span className="inline-flex items-center gap-1 text-xs text-secondary-foreground">
                      {formatDayFull(toIstDay(transaction.timestamp))} <ArrowRight className="h-3 w-3" aria-hidden /> see the day
                    </span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">{formatCurrency(transaction.amount)}</span>
                </button>
              </li>
            ))}
            {!largest.length ? <li className="py-3 text-sm text-secondary-foreground">No payments in this period.</li> : null}
          </ul>
        </section>
      </aside>
    </div>
  );
}

function RecipientStats({ recipient, share, rangeEnd }: { recipient: DashboardRecipientActivity; share: string; rangeEnd: string }) {
  const days = paidDays(recipient);
  const first = days[0];
  const last = days.at(-1);
  const stats: Array<{ label: string; value: string; note?: string }> = [
    { label: "Share of spend", value: `${share}%` },
    { label: "Average payment", value: formatCurrency(recipient.totalAmount / Math.max(recipient.transactionCount, 1)) },
    { label: "Last paid", value: last ? formatPaidDay(last, rangeEnd) : "—", note: first && first !== last ? `First ${formatPaidDay(first, rangeEnd)}` : undefined },
    { label: "How often", value: describeRhythm(days), note: days.length === 2 ? `${pluralize(daysBetween(days[0], days[1]), "day")} apart` : `Paid on ${pluralize(days.length, "day")}` },
  ];
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div key={stat.label} className="min-w-0">
          <dt className={dashboardTopCardLabelClassName}>{stat.label}</dt>
          <dd className="mt-0.5 text-[15px] font-bold leading-5 text-foreground tabular-nums">{stat.value}</dd>
          {stat.note ? <dd className="text-xs text-secondary-foreground tabular-nums">{stat.note}</dd> : null}
        </div>
      ))}
    </dl>
  );
}

function RecipientDetail({
  recipient,
  calendar,
  buckets,
  unit,
  share,
  categories,
  onPickDay,
}: {
  recipient: DashboardRecipientActivity;
  calendar: CalendarRange;
  buckets: Array<{ key: string; label: string }>;
  unit: RhythmUnit;
  share: string;
  categories: CategoryOption[];
  onPickDay: (day: string) => void;
}) {
  const [rule, setRule] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const query = useDashboardTransactions(
    { startDate: calendar.start, endDate: calendar.end, recipientUuid: recipient.recipientUuid },
    { enabled: Boolean(recipient.recipientUuid) }
  );
  const { categorize, pending } = useDashboardCategorize();
  const transactions = query.data?.transactions ?? [];
  const uncategorized = transactions.filter((transaction) => !transaction.categoryUuid);
  // Only the first 100 load; bulk actions and their wording then cover the loaded ones.
  const total = query.data?.total ?? transactions.length;
  const partial = total > transactions.length;
  const shown = showAll ? transactions : transactions.slice(0, 6);
  const allHref = buildTransactionsHref({ startDate: calendar.start, endDate: calendar.end, ...(recipient.recipientUuid ? { recipientUuid: recipient.recipientUuid } : { q: recipient.recipient }) });
  // Rows repeat the category only when it differs from the recipient's single category.
  const usualCategory = recipient.categories.length === 1 ? recipient.categories[0] : null;
  const strip = (
    <div className="md:hidden">
      <p className={dashboardTopCardLabelClassName}>When you paid · by {unit}</p>
      <div className="mt-1.5"><Rhythm recipient={recipient} buckets={buckets} unit={unit} /></div>
      <div className="mt-1 flex justify-between text-[11px] text-secondary-foreground tabular-nums">
        <span>{unit === "month" ? formatMonthYear(buckets[0].key) : formatDayShort(buckets[0].key)}</span>
        <span>{unit === "month" ? formatMonthYear(buckets.at(-1)!.key) : formatDayShort(buckets.at(-1)!.key)}</span>
      </div>
    </div>
  );

  if (!recipient.recipientUuid) {
    return (
      <div className="space-y-4 border-t-2 border-border/15 bg-background/60 px-4 py-4 text-sm sm:px-5">
        <RecipientStats recipient={recipient} share={share} rangeEnd={calendar.end} />
        {strip}
        <Link href={allHref} className={cn("inline-block rounded-[4px] font-semibold underline underline-offset-4", focusRing)}>See these transactions in Transactions</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4 border-t-2 border-border/15 bg-background/60 px-4 pb-4 pt-3 sm:px-5">
      <RecipientNameBar recipientUuid={recipient.recipientUuid} name={recipient.recipient} />
      <RecipientStats recipient={recipient} share={share} rangeEnd={calendar.end} />
      {strip}
      {query.isError ? (
        <PanelNote title="Couldn’t load these transactions." action={<Button variant="secondary" size="sm" onClick={() => void query.refetch()}><span className="font-bold">Try again</span></Button>} />
      ) : query.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
          {Array.from({ length: Math.min(recipient.transactionCount, 4) }, (_, index) => <Skeleton key={index} className="h-9 w-full rounded-[8px]" />)}
        </div>
      ) : (
        <div>
          {uncategorized.length ? (
            <div className="mb-3 flex flex-col gap-3 rounded-[8px] border-2 border-border bg-[var(--paper-yellow)] p-3 text-[#171714] sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm">
                  <span className="font-bold">
                    {partial
                      ? `${uncategorized.length} uncategorized in the first ${transactions.length} of ${total}`
                      : `${uncategorized.length === transactions.length ? `All ${uncategorized.length}` : `${uncategorized.length} of ${transactions.length}`} uncategorized`}
                  </span>
                  {" · "}{formatCurrency(uncategorized.reduce((sum, transaction) => sum + transaction.amount, 0))}
                  {uncategorized.length < transactions.length ? ". Categorized ones keep their category." : ""}
                </p>
                <label className="mt-1.5 flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={rule} onChange={(event) => setRule(event.target.checked)} className="h-4 w-4 cursor-pointer accent-[#171714]" />
                  Also categorize future payments to {tidyRecipientName(recipient.recipient)}
                </label>
              </div>
              <CategoryMenu
                label={
                  partial
                    ? `Applies to the ${pluralize(uncategorized.length, "uncategorized transaction")} among the first ${transactions.length} loaded. Later ones stay as they are.`
                    : `Applies to ${pluralize(uncategorized.length, "uncategorized transaction")} to ${tidyRecipientName(recipient.recipient)}.`
                }
                categories={categories}
                current={null}
                onPick={(choice) =>
                  void categorize({
                    transactions: uncategorized.map((transaction) => ({ uuid: transaction.uuid, categoryUuid: null, subcategoryUuid: null })),
                    choice,
                    description: `${pluralize(uncategorized.length, "transaction")} to ${tidyRecipientName(recipient.recipient)}`,
                    rule: rule ? { recipientUuid: recipient.recipientUuid!, recipient: tidyRecipientName(recipient.recipient) } : null,
                  })
                }
                trigger={({ open, toggle, ref }) => (
                  <Button ref={ref} variant="secondary" size="sm" aria-haspopup="menu" aria-expanded={open} disabled={pending} onClick={toggle}>
                    <span className="font-bold">{pending ? "Saving…" : `Set category for ${uncategorized.length}`}</span>
                    <ChevronDown className="h-4 w-4" aria-hidden />
                  </Button>
                )}
              />
            </div>
          ) : null}
          <p className={dashboardTopCardLabelClassName}>
            Payments{usualCategory && !uncategorized.length ? ` · all ${usualCategory}` : ""}
          </p>
          <ul className="mt-1 divide-y divide-border/15">
            {shown.map((transaction) => {
              const day = toIstDay(transaction.timestamp);
              const account = `${transaction.accountName ?? "No account"}${transaction.reference ? ` ··${transaction.reference.slice(-4)}` : ""}`;
              return (
                <li key={transaction.uuid} className="flex items-center gap-3 py-2 text-sm tabular-nums">
                  <button type="button" onClick={() => onPickDay(day)} title={`See this day in the calendar · ${account}`} className={cn("min-w-0 flex-1 truncate rounded-[4px] text-left leading-5 underline-offset-4 hover:underline", focusRing)}>
                    <span className="font-semibold text-foreground">{formatPaidDay(day, calendar.end)}</span>
                    <span className="text-secondary-foreground"> · {formatIstTime(transaction.timestamp)}</span>
                    <span className="hidden text-secondary-foreground sm:inline"> · {account}</span>
                  </button>
                  {transaction.category !== usualCategory || !transaction.category ? (
                    <CategoryPill value={transaction.category} className="min-h-6 shrink-0 px-2 text-[11px]" />
                  ) : null}
                  <span className="w-20 shrink-0 text-right font-bold">{formatCurrency(transaction.amount)}</span>
                </li>
              );
            })}
          </ul>
          {transactions.length > 6 && !showAll ? (
            <button type="button" onClick={() => setShowAll(true)} className={cn("mt-1 inline-flex min-h-9 items-center rounded-[4px] text-sm underline underline-offset-4", focusRing)}>
              <span className="font-semibold">Show all {transactions.length} payments</span>
            </button>
          ) : null}
          {query.data && query.data.total > transactions.length ? (
            <p className="mt-2 text-sm text-secondary-foreground">
              Showing the first {transactions.length} of {query.data.total}.{" "}
              <Link href={allHref} className={cn("rounded-[4px] font-semibold text-foreground underline underline-offset-4", focusRing)}>See all in Transactions</Link>
            </p>
          ) : null}
        </div>
      )}
    </div>
  );
}

/** Rename and recipient-page actions. The stored name shows only when the display tidies it, and the field starts tidied. */
function RecipientNameBar({ recipientUuid, name }: { recipientUuid: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => tidyRecipientName(name));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const tidied = tidyRecipientName(name);

  const save = async () => {
    const next = value.trim();
    if (!next) return setError("Enter a name.");
    if (next === name) return setEditing(false);
    setSaving(true);
    setError(null);
    try {
      await apiPatch(`/api/recipients/${recipientUuid}`, { displayName: next });
      await queryClient.invalidateQueries({ queryKey: ["transactions"] });
      router.refresh();
      setEditing(false);
      toast({ tone: "success", title: "Recipient renamed", description: `Now shown as ${next}. Past and future payments use the new name.` });
    } catch (caught) {
      setError(caught instanceof ApiClientError && caught.status === 409 ? "Another recipient already has this name." : "Couldn’t rename. Try again.");
    } finally {
      setSaving(false);
    }
  };

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-x-1 text-sm">
        {tidied !== name ? (
          <p className="w-full text-xs text-secondary-foreground">
            Saved as <span className="font-medium text-foreground [overflow-wrap:anywhere]">{name}</span>. The list shows it tidied.
          </p>
        ) : null}
        <button type="button" onClick={() => setEditing(true)} className={cn("-ml-1.5 inline-flex min-h-9 items-center gap-1 rounded-[6px] px-1.5 underline underline-offset-4 hover:bg-secondary", focusRing)}>
          <Pencil className="h-3.5 w-3.5" aria-hidden />
          <span className="font-semibold">Rename</span>
        </button>
        <Link href={`/recipients/${recipientUuid}`} className={cn("inline-flex min-h-9 items-center gap-1 rounded-[6px] px-1.5 text-secondary-foreground underline underline-offset-4 hover:bg-secondary hover:text-foreground", focusRing)}>
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          <span className="font-semibold">Recipient page</span>
        </Link>
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row sm:items-start"
      onSubmit={(event) => {
        event.preventDefault();
        void save();
      }}
    >
      <label className="min-w-0 flex-1">
        <span className="sr-only">Recipient name</span>
        <input
          autoFocus
          value={value}
          maxLength={200}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setEditing(false);
          }}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `rename-error-${recipientUuid}` : undefined}
          className={cn("h-10 w-full rounded-[8px] border-2 border-border bg-card px-3 text-sm text-foreground", focusRing)}
        />
        {error ? <span id={`rename-error-${recipientUuid}`} role="alert" className="mt-1 block text-xs font-semibold text-destructive">{error}</span> : null}
      </label>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={saving}><span className="font-bold">{saving ? "Saving…" : "Save name"}</span></Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(false)}><span className="font-bold">Cancel</span></Button>
      </div>
    </form>
  );
}
