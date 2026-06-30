"use client";

import { useEffect, useRef } from "react";
import { Search } from "lucide-react";

import type { RecipientsControlState } from "@/features/recipients/types";

import { buildSearchHref } from "./recipients-view-model";
import { updateTransactionsUrl } from "@/features/transactions/url-state";

export function RecipientsFilterControls({
  filters,
}: {
  filters: RecipientsControlState;
}) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const searchTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (searchTimeoutRef.current !== null) {
      window.clearTimeout(searchTimeoutRef.current);
      searchTimeoutRef.current = null;
    }

    if (searchInputRef.current && searchInputRef.current.value !== filters.q) {
      searchInputRef.current.value = filters.q;
    }
  }, [filters.q]);

  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current !== null) {
        window.clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="grid gap-3">
      <label className="flex min-h-12 items-center gap-3 rounded-[8px] border border-border/50 bg-background/16 px-3.5">
        <Search className="h-4 w-4 text-secondary-foreground/75" />
        <input
          ref={searchInputRef}
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
    </div>
  );
}
