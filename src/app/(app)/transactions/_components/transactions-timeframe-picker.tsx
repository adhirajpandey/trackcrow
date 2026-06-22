"use client";

import { TimeframePicker } from "@/app/(app)/dashboard/_components/dashboard-timeframe-picker";
import type { TransactionsPageData } from "@/server/page-data/transactions-page-data";

import { buildTransactionsRangeHref } from "./transactions-view-model";

export function TransactionsTimeframePicker({
  filters,
}: {
  filters: TransactionsPageData["filters"];
}) {
  return (
    <TimeframePicker
      value={filters.range}
      startDate={filters.startDate}
      endDate={filters.endDate}
      buildHref={(range, startDate, endDate) =>
        buildTransactionsRangeHref(filters, range, startDate, endDate)
      }
      showQuickRanges={false}
      showSelectedLabelInTrigger
      selectedLabel={filters.rangeLabel}
      idPrefix="transactions"
      rootClassName="w-full"
      triggerWrapperClassName="w-full"
      triggerClassName="min-h-12 w-full justify-between border-border/50 bg-background/16 px-3.5 text-foreground hover:bg-background/20"
      menuClassName="min-w-[240px]"
      autoApplyCustomRange
      showCustomApplyButton={false}
      renderMenuInPortal
    />
  );
}
