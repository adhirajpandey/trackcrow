"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  Copy,
  ReceiptIndianRupee,
  Rows3,
  WalletCards,
} from "lucide-react";

import { AppPageHeader } from "@/components/product/app-page-header";
import { Button } from "@/components/ui/button";
import type { RecipientDetailPageInitialData } from "@/features/recipients/types";
import { cn } from "@/lib/utils";
import {
  dashboardInnerTableClassName,
  dashboardPanelClassName,
  dashboardTableHeaderClassName,
  dashboardTableRowClassName,
} from "@/app/(app)/dashboard/_components/dashboard-style";

import {
  formatRecipientDate,
  formatRecipientDateTime,
  formatRecipientTotal,
} from "./recipient-detail-model";

const summaryValueClassName =
  "mt-4 text-[2.25rem] font-semibold leading-none text-primary tabular-nums";
const badgeClassName =
  "inline-flex min-h-8 items-center rounded-[999px] border px-3 text-sm font-medium";

export function RecipientDetailPageView({
  initialRecipientDetailData,
}: RecipientDetailPageInitialData) {
  const [copiedValue, setCopiedValue] = useState<string | null>(null);
  const data = initialRecipientDetailData;

  useEffect(() => {
    if (!copiedValue) {
      return;
    }

    const timeoutId = window.setTimeout(() => setCopiedValue(null), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [copiedValue]);

  async function handleCopy(value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedValue(value);
    } catch {
      setCopiedValue(null);
    }
  }

  return (
    <div className="space-y-3.5">
      <AppPageHeader
        eyebrow="Recipient workspace"
        title="Recipient detail"
        description="Review a payee, inspect identifiers, and trace related transactions in the same ledger workspace."
        meta={
          <>
            <span className="font-medium text-foreground">{data.displayName}</span>
            <span className="text-secondary-foreground">
              {data.transactionCount} transactions linked
            </span>
          </>
        }
        actions={
          <Button asChild variant="secondary" className="min-w-[176px]">
            <Link href="/recipients">
              <ArrowLeft className="h-4 w-4" />
              Back to recipients
            </Link>
          </Button>
        }
      />

      <div className="grid gap-3 2xl:grid-cols-[minmax(0,1.6fr)_minmax(320px,0.78fr)]">
        <div className="space-y-3">
          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <div className="grid gap-5 xl:grid-cols-[minmax(240px,0.95fr)_minmax(0,1fr)_minmax(0,0.85fr)]">
              <div>
                <p className="text-sm font-semibold text-secondary-foreground">
                  Recipient summary
                </p>
                <p className={summaryValueClassName}>{data.displayName}</p>
                <p className="mt-3 text-sm text-secondary-foreground">
                  {[
                    `${data.transactionCount} payments`,
                    formatRecipientTotal(data.totalSpent),
                    data.lastPaidAt ? `Last paid ${formatRecipientDate(data.lastPaidAt)}` : null,
                  ]
                    .filter(Boolean)
                    .join(" • ")}
                </p>
              </div>

              <DefinitionGrid
                items={[
                  { label: "Display name", value: data.displayName },
                  { label: "Normalized name", value: data.normalizedName },
                  { label: "Created", value: formatRecipientDate(data.createdAt) },
                ]}
              />

              <DefinitionGrid
                items={[
                  { label: "Updated", value: formatRecipientDate(data.updatedAt) },
                  { label: "Identifier count", value: String(data.identifierCount) },
                  {
                    label: "Status",
                    value: data.transactionCount > 0 ? "Frequent recipient" : "Awaiting history",
                  },
                ]}
              />
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "overflow-hidden")}>
            <SectionHeader
              title="Identifiers"
              description="Resolved identifiers retained for recipient matching."
            />
            <div className="overflow-x-auto px-5 pb-5">
              <div className={cn(dashboardInnerTableClassName, "min-w-[620px]")}>
                <div
                  className={dashboardTableHeaderClassName}
                  style={{ gridTemplateColumns: "160px minmax(220px,1fr) minmax(220px,1fr) 72px" }}
                >
                  <span>Kind</span>
                  <span>Value</span>
                  <span>Normalized</span>
                  <span className="text-right">Copy</span>
                </div>
                <div className="flex-1">
                  {data.identifiers.length > 0 ? (
                    data.identifiers.map((identifier, index) => (
                      <div
                        key={identifier.id}
                        className={cn(
                          dashboardTableRowClassName,
                          "items-center",
                          index > 0 && "border-t border-border/40"
                        )}
                        style={{
                          gridTemplateColumns: "160px minmax(220px,1fr) minmax(220px,1fr) 72px",
                        }}
                      >
                        <div>
                          <span className="inline-flex rounded-[999px] border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                            {identifier.kindLabel}
                          </span>
                        </div>
                        <span className="min-w-0 break-all font-medium text-foreground">
                          {identifier.value}
                        </span>
                        <span className="min-w-0 break-all text-secondary-foreground">
                          {identifier.normalizedValue}
                        </span>
                        <div className="flex justify-end">
                          <CopyButton
                            label={`Copy ${identifier.kindLabel}`}
                            onClick={() => void handleCopy(identifier.value)}
                            copied={copiedValue === identifier.value}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyPanelState label="No identifiers recorded for this recipient." />
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "overflow-hidden")}>
            <SectionHeader
              title="Category pattern"
              description="Useful for spotting where this recipient usually lands in your ledger."
            />
            <div className="overflow-x-auto px-5 pb-5">
              <div className={cn(dashboardInnerTableClassName, "min-w-[560px]")}>
                <div
                  className={dashboardTableHeaderClassName}
                  style={{ gridTemplateColumns: "minmax(220px,1.2fr) 140px 160px" }}
                >
                  <span>Category</span>
                  <span className="text-right">Transactions</span>
                  <span className="text-right">Total amount</span>
                </div>
                <div className="flex-1">
                  {data.categoryRows.length > 0 ? (
                    data.categoryRows.map((row, index) => (
                      <div
                        key={row.id}
                        className={cn(
                          dashboardTableRowClassName,
                          "items-center",
                          index > 0 && "border-t border-border/40"
                        )}
                        style={{ gridTemplateColumns: "minmax(220px,1.2fr) 140px 160px" }}
                      >
                        <div>
                          <span
                            className={cn(
                              badgeClassName,
                              row.category === "Uncategorized"
                                ? "border-accent/28 bg-accent/12 text-accent"
                                : "border-primary/20 bg-primary/10 text-primary"
                            )}
                          >
                            {row.category}
                          </span>
                        </div>
                        <span className="text-right font-medium tabular-nums text-foreground">
                          {row.transactionCount}
                        </span>
                        <span className="text-right font-medium tabular-nums text-foreground">
                          {formatRecipientTotal(row.totalAmount)}
                        </span>
                      </div>
                    ))
                  ) : (
                    <EmptyPanelState label="No category activity recorded for this recipient." />
                  )}
                </div>
              </div>
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "overflow-hidden")}>
            <SectionHeader
              title="Recent transactions"
              description="Newest linked payments for this recipient."
            />
            <div className="overflow-x-auto px-5 pb-5">
              <div className={cn(dashboardInnerTableClassName, "min-w-[700px]")}>
                <div
                  className={dashboardTableHeaderClassName}
                  style={{
                    gridTemplateColumns: "160px 140px minmax(180px,1fr) 120px 120px",
                  }}
                >
                  <span>Date</span>
                  <span className="text-right">Amount</span>
                  <span>Category</span>
                  <span>Source</span>
                  <span className="text-right">View</span>
                </div>
                <div className="flex-1">
                  {data.recentTransactions.length > 0 ? (
                    data.recentTransactions.map((transaction, index) => (
                      <div
                        key={transaction.uuid}
                        className={cn(
                          dashboardTableRowClassName,
                          "items-center",
                          index > 0 && "border-t border-border/40"
                        )}
                        style={{
                          gridTemplateColumns: "160px 140px minmax(180px,1fr) 120px 120px",
                        }}
                      >
                        <span className="text-foreground">
                          {formatRecipientDate(transaction.timestamp)}
                        </span>
                        <span className="text-right font-medium tabular-nums text-foreground">
                          {formatRecipientTotal(transaction.amount)}
                        </span>
                        <div>
                          <span
                            className={cn(
                              badgeClassName,
                              transaction.category
                                ? "border-primary/20 bg-primary/10 text-primary"
                                : "border-accent/28 bg-accent/12 text-accent"
                            )}
                          >
                            {transaction.category ?? "Uncategorized"}
                          </span>
                        </div>
                        <span className="text-secondary-foreground">{transaction.source}</span>
                        <div className="flex justify-end">
                          <Link
                            href={`/transactions/${transaction.id}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/85"
                          >
                            View
                            <ArrowRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyPanelState label="No linked transactions found for this recipient." />
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-3">
          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Metadata</h2>
            <div className="mt-4 space-y-1">
              {data.metadata.map((item) => (
                <MetadataRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                  onCopy={
                    item.copyValue ? () => void handleCopy(item.copyValue as string) : undefined
                  }
                  copied={item.copyValue ? copiedValue === item.copyValue : false}
                />
              ))}
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Quick checks</h2>
            <div className="mt-4 space-y-3">
              {data.quickChecks.map((check) => (
                <QuickCheckRow
                  key={check.id}
                  label={check.label}
                  status={check.status}
                  badgeLabel={check.badgeLabel}
                />
              ))}
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Recipient insights</h2>
            <div className="mt-4 space-y-3">
              {data.insights.map((insight) => (
                <InsightRow
                  key={insight.id}
                  label={insight.label}
                  value={insight.value}
                  tone={insight.tone}
                />
              ))}
            </div>
          </section>

          <section className={cn(dashboardPanelClassName, "px-5 py-5")}>
            <h2 className="text-[1.05rem] font-semibold text-foreground">Recorded details</h2>
            <div className="mt-4 space-y-1">
              <MetadataRow label="Created" value={formatRecipientDateTime(data.createdAt)} />
              <MetadataRow label="Updated" value={formatRecipientDateTime(data.updatedAt)} />
              <MetadataRow
                label="Latest payment"
                value={
                  data.lastPaidAt ? formatRecipientDateTime(data.lastPaidAt) : "No transactions yet"
                }
              />
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function SectionHeader({ title, description }: { title: string; description: string }) {
  return (
    <div className="px-5 pt-5">
      <h2 className="text-[1.05rem] font-semibold text-foreground">{title}</h2>
      <p className="mt-2 text-sm text-secondary-foreground">{description}</p>
    </div>
  );
}

function DefinitionGrid({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3 border-l border-border/45 pl-5">
      {items.map((item) => (
        <div key={item.label} className="grid gap-1">
          <span className="text-sm text-secondary-foreground">{item.label}</span>
          <span className="break-all text-sm font-medium text-foreground">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function CopyButton({
  label,
  onClick,
  copied,
}: {
  label: string;
  onClick: () => void;
  copied: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-[8px] border border-border/45 bg-background/10 text-secondary-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {copied ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function MetadataRow({
  label,
  value,
  onCopy,
  copied = false,
}: {
  label: string;
  value: string;
  onCopy?: () => void;
  copied?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/35 py-3 text-sm last:border-b-0 last:pb-0">
      <span className="text-secondary-foreground">{label}</span>
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate text-right font-medium text-foreground">{value}</span>
        {onCopy ? <CopyButton label={`Copy ${label}`} onClick={onCopy} copied={copied} /> : null}
      </div>
    </div>
  );
}

function QuickCheckRow({
  label,
  status,
  badgeLabel,
}: {
  label: string;
  status: "attention" | "passed";
  badgeLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[8px] border border-border/45 bg-background/10 px-3.5 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full border",
            status === "attention"
              ? "border-accent/30 bg-accent/10 text-accent"
              : "border-primary/22 bg-primary/10 text-primary"
          )}
        >
          {status === "attention" ? (
            <CircleAlert className="h-4 w-4" />
          ) : (
            <CheckCircle2 className="h-4 w-4" />
          )}
        </span>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <span
        className={cn(
          badgeClassName,
          status === "attention"
            ? "border-accent/30 bg-accent/12 text-accent"
            : "border-primary/20 bg-primary/10 text-primary"
        )}
      >
        {badgeLabel}
      </span>
    </div>
  );
}

function InsightRow({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: string;
  tone?: "default" | "accent";
}) {
  const Icon = label === "Most common category"
    ? Rows3
    : label === "Average payment"
      ? ReceiptIndianRupee
      : label === "Source mix"
        ? WalletCards
        : CheckCircle2;

  return (
    <div className="flex items-start gap-3 rounded-[8px] border border-border/45 bg-background/10 px-3.5 py-3">
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/22 bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-secondary-foreground">{label}</p>
        <p
          className={cn(
            "mt-1 text-sm font-medium",
            tone === "accent" ? "text-accent" : "text-foreground"
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyPanelState({ label }: { label: string }) {
  return <div className="px-5 py-8 text-sm text-secondary-foreground">{label}</div>;
}
