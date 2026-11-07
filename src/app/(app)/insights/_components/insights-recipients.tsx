"use client";

import { ArrowRight, Check, ChevronDown, ChevronRight, ExternalLink, Pencil, Search, X } from "lucide-react";
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

import { dashboardInnerTableClassName, dashboardPanelClassName, dashboardTableHeaderClassName } from "@/app/(app)/dashboard/_components/dashboard-style";
import { CategoryMenu, CategoryPill, focusRing, InfoTip, PanelNote, segmentClassName, segmentItemClassName } from "@/app/(app)/dashboard/_components/dashboard-ui";
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
  pluralize,
  toIstDay,
  type CalendarRange,
} from "@/app/(app)/dashboard/_components/dashboard-view-model";

type Sort = "total" | "count" | "days";
const PAGE = 12;
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
  const { buckets, unit } = useMemo(() => buildRhythmBuckets(calendar), [calendar]);
  const keyOf = (recipient: DashboardRecipientActivity) => recipient.recipientUuid ?? `label:${recipient.recipient}`;

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
  const search = query.trim().toLowerCase();
  const filtered = sorted.filter((recipient) => (!reviewOnly || recipient.uncategorizedCount > 0 || keyOf(recipient) === openKey) && (!search || recipient.recipient.toLowerCase().includes(search) || tidyRecipientName(recipient.recipient).toLowerCase().includes(search)));
  const shown = showAll || search ? filtered : filtered.slice(0, PAGE);
  const regulars = [...recipients].filter((recipient) => recipient.days.length >= 4).sort((left, right) => right.days.length - left.days.length).slice(0, 5);
  const allCategorized = reviewOnly && !recipients.some((recipient) => recipient.uncategorizedCount > 0);
  const range = `${formatDayShort(calendar.start)} to ${formatDayShort(calendar.end)}`;

  return (
    <div id="insights-panel-recipients" role="tabpanel" aria-labelledby="insights-tab-recipients" className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className={cn(dashboardPanelClassName, "p-4 sm:p-5")}>
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative block min-w-[220px] flex-1">
            <span className="sr-only">Search recipients</span>
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary-foreground" aria-hidden />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search recipients"
              className={cn("h-11 w-full rounded-[8px] border-2 border-border bg-card pl-10 pr-10 text-[15px] text-foreground placeholder:text-secondary-foreground", focusRing)}
            />
            {query ? (
              <button type="button" aria-label="Clear search" onClick={() => setQuery("")} className={cn("absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-[6px] text-secondary-foreground hover:bg-secondary hover:text-foreground", focusRing)}>
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </label>
          <button
            type="button"
            aria-pressed={reviewOnly}
            onClick={() => onReviewOnlyChange(!reviewOnly)}
            className={cn("inline-flex h-11 items-center gap-1.5 rounded-[8px] border-2 border-border px-3 text-sm transition-colors", focusRing, reviewOnly ? "bg-[#fff1bd] text-foreground" : "bg-card text-secondary-foreground hover:bg-secondary hover:text-foreground")}
          >
            {reviewOnly ? <Check className="h-4 w-4" strokeWidth={3} aria-hidden /> : null}
            <span className="font-semibold">Uncategorized only</span>
          </button>
          <div role="radiogroup" aria-label="Sort recipients" className={segmentClassName}>
            {([["total", "Amount", "Amount"], ["count", "Transactions", "Count"], ["days", "Days paid", "Days"]] as const).map(([value, label, short]) => (
              <button key={value} type="button" role="radio" aria-checked={sort === value} aria-label={`Sort by ${label.toLowerCase()}`} onClick={() => setSort(value)} className={cn(segmentItemClassName(sort === value), "whitespace-nowrap px-3 sm:px-4")}>
                <span className="font-semibold sm:hidden">{short}</span>
                <span className="hidden font-semibold sm:inline">{label}</span>
              </button>
            ))}
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
              <PanelNote title="No recipients in this period" body="Recipients appear once a transaction is recorded." />
            )
          ) : (
            <ul className="divide-y-2 divide-border/15">
              {shown.map((recipient) => {
                const key = keyOf(recipient);
                const open = openKey === key;
                return (
                  <li key={key}>
                    <button
                      type="button"
                      aria-expanded={open}
                      onClick={() => setOpenKey(open ? null : key)}
                      className={cn(
                        "grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:px-5",
                        COLUMNS,
                        open ? "bg-[var(--paper-mint)]" : "hover:bg-secondary/35"
                      )}
                    >
                      <span className="min-w-0">
                        <span className="flex items-center gap-1.5">
                          <ChevronRight className={cn("h-4 w-4 shrink-0 text-secondary-foreground transition-transform", open && "rotate-90")} aria-hidden />
                          <span title={recipient.recipient} className="text-sm font-semibold leading-5 text-foreground [overflow-wrap:anywhere]">{tidyRecipientName(recipient.recipient)}</span>
                        </span>
                        <span className="block pl-[22px] text-xs text-secondary-foreground tabular-nums">
                          {pluralize(recipient.transactionCount, "transaction")} on {pluralize(recipient.days.length, "day")}
                        </span>
                      </span>
                      <span className="order-3 col-span-2 md:order-none md:col-span-1"><Rhythm recipient={recipient} buckets={buckets} unit={unit} /></span>
                      <span className="text-right text-sm font-bold tabular-nums">{formatCurrency(recipient.totalAmount)}</span>
                      <span className="order-4 col-span-2 flex justify-start pl-[22px] md:order-none md:col-span-1 md:justify-end md:pl-0"><RecipientStatus recipient={recipient} /></span>
                    </button>
                    {open ? <RecipientDetail recipient={recipient} calendar={calendar} categories={categories} onPickDay={onPickDay} /> : null}
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
        <section className={cn(dashboardPanelClassName, "p-4 sm:p-5")}>
          <div className="flex min-h-8 items-center gap-1.5">
            <h2 className="text-base font-bold">Regulars</h2>
            <InfoTip label="Regulars">Recipients paid on 4 or more days in this range.</InfoTip>
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
            {!regulars.length ? <li className="py-3 text-sm text-secondary-foreground">No one was paid on 4 or more days.</li> : null}
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

function RecipientDetail({
  recipient,
  calendar,
  categories,
  onPickDay,
}: {
  recipient: DashboardRecipientActivity;
  calendar: CalendarRange;
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

  if (!recipient.recipientUuid) {
    return (
      <div className="border-t-2 border-border/15 bg-background/60 px-4 py-4 text-sm sm:px-5">
        <Link href={allHref} className={cn("rounded-[4px] font-semibold underline underline-offset-4", focusRing)}>See these transactions in Transactions</Link>
      </div>
    );
  }

  return (
    <div className="border-t-2 border-border/15 bg-background/60 px-4 pb-4 pt-3 sm:px-5">
      <RecipientNameBar recipientUuid={recipient.recipientUuid} name={recipient.recipient} />
      {query.isError ? (
        <PanelNote title="Couldn’t load these transactions." action={<Button variant="secondary" size="sm" onClick={() => void query.refetch()}><span className="font-bold">Try again</span></Button>} />
      ) : query.isPending ? (
        <div className="space-y-2" aria-busy="true" aria-label="Loading transactions">
          {Array.from({ length: Math.min(recipient.transactionCount, 4) }, (_, index) => <Skeleton key={index} className="h-9 w-full rounded-[8px]" />)}
        </div>
      ) : (
        <>
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
          <ul className="divide-y divide-border/15">
            {shown.map((transaction) => {
              const day = toIstDay(transaction.timestamp);
              return (
                <li key={transaction.uuid} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 py-2 text-sm tabular-nums sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:py-1.5">
                  <button type="button" onClick={() => onPickDay(day)} title="See this day in the calendar" className={cn("min-w-0 rounded-[4px] text-left leading-5 underline-offset-4 hover:underline sm:truncate", focusRing)}>
                    <span className="font-semibold text-foreground">{formatDayFull(day)}</span>
                    <span className="text-secondary-foreground">
                      <span className="hidden sm:inline"> · </span>
                      <br className="sm:hidden" />
                      {formatIstTime(transaction.timestamp)} · {transaction.accountName ?? "No account"}{transaction.reference ? ` ··${transaction.reference.slice(-4)}` : ""}
                    </span>
                  </button>
                  <CategoryPill value={transaction.category} className="order-3 min-h-7 justify-self-start px-2 sm:order-none sm:justify-self-auto" />
                  <span className="text-right font-bold sm:w-20">{formatCurrency(transaction.amount)}</span>
                </li>
              );
            })}
          </ul>
          {transactions.length > 6 && !showAll ? (
            <button type="button" onClick={() => setShowAll(true)} className={cn("mt-1 inline-flex min-h-9 items-center rounded-[4px] text-sm underline underline-offset-4", focusRing)}>
              <span className="font-semibold">Show all {transactions.length} transactions</span>
            </button>
          ) : null}
          {query.data && query.data.total > transactions.length ? (
            <p className="mt-2 text-sm text-secondary-foreground">
              Showing the first {transactions.length} of {query.data.total}.{" "}
              <Link href={allHref} className={cn("rounded-[4px] font-semibold text-foreground underline underline-offset-4", focusRing)}>See all in Transactions</Link>
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}

/** Recipient name with an inline rename. The field starts with the tidied name, so fixing capitals is one tap. */
function RecipientNameBar({ recipientUuid, name }: { recipientUuid: string; name: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(() => tidyRecipientName(name));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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
      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
        <span className="min-w-0 text-secondary-foreground">
          Bank name: <span className="font-medium text-foreground [overflow-wrap:anywhere]">{name}</span>
        </span>
        <button type="button" onClick={() => setEditing(true)} className={cn("inline-flex min-h-9 items-center gap-1 rounded-[6px] px-1.5 underline underline-offset-4 hover:bg-secondary", focusRing)}>
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
      className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start"
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
