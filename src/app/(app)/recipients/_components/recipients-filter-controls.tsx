"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

import type { RecipientsControlState } from "@/features/recipients/types";
import { cn } from "@/lib/utils";

import {
  buildResetHref,
  buildSearchHref,
  buildSortHref,
  getSortDirection,
} from "./recipients-view-model";
import { updateTransactionsUrl } from "@/features/transactions/url-state";

export function RecipientsFilterControls({
  filters,
}: {
  filters: RecipientsControlState;
}) {
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  const transactionDirection = getSortDirection(filters, "transactionCount");
  const recipientDirection = getSortDirection(filters, "displayName");

  return (
    <div className="grid gap-3 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,0.95fr)_auto]">
      <label className="flex min-h-12 items-center gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5">
        <Search className="h-4 w-4 text-secondary-foreground/75" />
        <input
          key={filters.q}
          defaultValue={filters.q}
          onChange={(event) => {
            if (searchTimeoutRef.current !== null) {
              window.clearTimeout(searchTimeoutRef.current);
            }

            const nextValue = event.target.value;
            searchTimeoutRef.current = window.setTimeout(() => {
              const nextHref = buildSearchHref(filters, nextValue);
              updateTransactionsUrl(nextHref, "replace");
            }, 300);
          }}
          placeholder="Search recipient, normalized name, identifier..."
          className="w-full border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-secondary-foreground/70"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => updateTransactionsUrl(buildSortHref(filters, "displayName"), "replace")}
          className={cn(
            "inline-flex min-h-12 items-center justify-between gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <span>Recipient name</span>
          <span className="text-secondary-foreground/80">
            {recipientDirection === "asc"
              ? "A-Z"
              : recipientDirection === "desc"
                ? "Z-A"
                : "Sort"}
          </span>
        </button>

        <button
          type="button"
          onClick={() =>
            updateTransactionsUrl(buildSortHref(filters, "transactionCount"), "replace")
          }
          className={cn(
            "inline-flex min-h-12 items-center justify-between gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-background/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          )}
        >
          <span>Linked transactions</span>
          <span className="text-secondary-foreground/80">
            {transactionDirection === "asc"
              ? "Low-high"
              : transactionDirection === "desc"
                ? "High-low"
                : "Sort"}
          </span>
        </button>
      </div>

      <div className="flex items-center gap-2 xl:justify-end">
        <button
          type="button"
          onClick={() => updateTransactionsUrl(buildResetHref(), "replace")}
          className="inline-flex min-h-12 items-center justify-center rounded-[8px] border border-border/50 bg-background/10 px-4 text-sm font-semibold text-secondary-foreground transition-colors hover:border-border/70 hover:text-foreground"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
