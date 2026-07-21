"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

import { numberToINR } from "@/common/utils";
import {
  FilterResetButton,
  ListSearchField,
  NumericRangeFields,
} from "@/components/product/list-filter-controls";
import type { RecipientsControlState } from "@/features/recipients/types";
import { updateTransactionsUrl } from "@/features/transactions/url-state";
import { cn } from "@/lib/utils";

import {
  buildApplyFiltersHref,
  buildResetFiltersHref,
  buildSearchHref,
  getRecipientRangeError,
  hasRecipientFilters,
} from "./recipients-view-model";

export function RecipientsFilterControls({
  filters,
}: {
  filters: RecipientsControlState;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[minmax(16rem,1fr)_13rem_13rem_3rem]">
      <ListSearchField
        value={filters.q}
        placeholder="Search recipient, normalized name, alias..."
        ariaLabel="Search recipients"
        onCommit={(value) =>
          updateTransactionsUrl(buildSearchHref(filters, value), "replace")
        }
      />
      <RangeFilter
        label="Transactions"
        minimum={filters.minTransactionCount}
        maximum={filters.maxTransactionCount}
        integer
        formatValue={(value) => String(value)}
        onCommit={(minimum, maximum) =>
          updateTransactionsUrl(
            buildApplyFiltersHref({
              ...filters,
              minTransactionCount: minimum,
              maxTransactionCount: maximum,
            }),
            "replace"
          )
        }
      />
      <RangeFilter
        label="Total sent"
        minimum={filters.minTotalAmount}
        maximum={filters.maxTotalAmount}
        formatValue={numberToINR}
        onCommit={(minimum, maximum) =>
          updateTransactionsUrl(
            buildApplyFiltersHref({
              ...filters,
              minTotalAmount: minimum,
              maxTotalAmount: maximum,
            }),
            "replace"
          )
        }
      />
      <div className="flex items-center justify-end">
        <FilterResetButton
          disabled={!hasRecipientFilters(filters)}
          onReset={() => updateTransactionsUrl(buildResetFiltersHref(filters), "replace")}
        />
      </div>
    </div>
  );
}

function parseRangeValue(value: string, integer: boolean) {
  if (value.trim() === "") {
    return { value: null, error: null };
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || (integer && !Number.isInteger(parsed))) {
    return {
      value: null,
      error: integer ? "Enter a non-negative whole number." : "Enter a non-negative amount.",
    };
  }
  return { value: parsed, error: null };
}

function RangeFilter({
  label,
  minimum,
  maximum,
  integer = false,
  formatValue,
  onCommit,
}: {
  label: string;
  minimum: number | null;
  maximum: number | null;
  integer?: boolean;
  formatValue: (value: number) => string;
  onCommit: (minimum: number | null, maximum: number | null) => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [open, setOpen] = useState(false);
  const [minimumDraft, setMinimumDraft] = useState(minimum === null ? "" : String(minimum));
  const [maximumDraft, setMaximumDraft] = useState(maximum === null ? "" : String(maximum));

  useEffect(() => {
    if (!open) return;
    function closeOnOutsideClick(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    }
    window.addEventListener("mousedown", closeOnOutsideClick);
    return () => window.removeEventListener("mousedown", closeOnOutsideClick);
  }, [open]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const parsedMinimum = parseRangeValue(minimumDraft, integer);
  const parsedMaximum = parseRangeValue(maximumDraft, integer);
  const error =
    parsedMinimum.error ??
    parsedMaximum.error ??
    getRecipientRangeError(parsedMinimum.value, parsedMaximum.value, label);
  const triggerLabel =
    minimum !== null && maximum !== null
      ? `${label}: ${formatValue(minimum)}–${formatValue(maximum)}`
      : minimum !== null
        ? `${label}: ${formatValue(minimum)}+`
        : maximum !== null
          ? `${label}: up to ${formatValue(maximum)}`
          : `All ${label.toLowerCase()}`;

  function updateDraft(nextMinimum: string, nextMaximum: string) {
    const nextParsedMinimum = parseRangeValue(nextMinimum, integer);
    const nextParsedMaximum = parseRangeValue(nextMaximum, integer);
    const nextError =
      nextParsedMinimum.error ??
      nextParsedMaximum.error ??
      getRecipientRangeError(nextParsedMinimum.value, nextParsedMaximum.value, label);
    if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    if (!nextError) {
      timeoutRef.current = window.setTimeout(
        () => onCommit(nextParsedMinimum.value, nextParsedMaximum.value),
        300
      );
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (!open) {
            setMinimumDraft(minimum === null ? "" : String(minimum));
            setMaximumDraft(maximum === null ? "" : String(maximum));
          }
          setOpen((value) => !value);
        }}
        className={cn(
          "flex min-h-12 w-full items-center justify-between gap-3 rounded-[8px] border-2 border-border bg-card px-3.5 text-left text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          open && "bg-[var(--paper-mint)]"
        )}
      >
        <span className="truncate">{triggerLabel}</span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 transition-transform", open && "rotate-180")} />
      </button>
      {open ? (
        <div
          role="dialog"
          aria-label={`${label} range`}
          className="absolute right-0 top-[calc(100%+0.5rem)] z-30 w-[20rem] rounded-[10px] border-2 border-border bg-card p-4 shadow-[3px_4px_0_var(--foreground)]"
        >
          <p className="mb-3 text-sm font-semibold text-foreground">{label} range</p>
          <NumericRangeFields
            legend={label}
            minValue={minimumDraft}
            maxValue={maximumDraft}
            step={integer ? "1" : "0.01"}
            integer={integer}
            error={error}
            onMinChange={(value) => {
              setMinimumDraft(value);
              updateDraft(value, maximumDraft);
            }}
            onMaxChange={(value) => {
              setMaximumDraft(value);
              updateDraft(minimumDraft, value);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
