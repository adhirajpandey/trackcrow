"use client";

import { TimeframePicker } from "@/components/product/timeframe-picker";
import { dashboardRangeCookieName } from "@/features/dashboard/query-state";
import type { TransactionsControlState } from "@/features/transactions/types";
import { updateTransactionsUrl } from "@/features/transactions/url-state";

import { buildTransactionsRangeHref } from "./transactions-view-model";
import {
  buildDashboardTimeframeTriggerLabel,
  quickDashboardRanges,
  secondaryDashboardRanges,
} from "@/app/(app)/dashboard/_components/dashboard-view-model";

function persistRange(range: TransactionsControlState["range"]) {
  document.cookie = `${dashboardRangeCookieName}=${range}; path=/; max-age=31536000; samesite=lax`;
}

export function TransactionsTimeframePicker({
  filters,
}: {
  filters: TransactionsControlState;
}) {
  return (
    <TimeframePicker
      value={filters.range}
      startDate={filters.startDate}
      endDate={filters.endDate}
      quickRanges={quickDashboardRanges}
      secondaryRanges={secondaryDashboardRanges}
      buildHref={(range, startDate, endDate) =>
        buildTransactionsRangeHref(filters, range, startDate, endDate)
      }
      buildTriggerLabel={buildDashboardTimeframeTriggerLabel}
      onNavigateHref={(href) => updateTransactionsUrl(href, "replace")}
      persistSelection={persistRange}
      showQuickRanges
      showSelectedLabelInTrigger={false}
      selectedLabel={filters.rangeLabel}
      idPrefix="transactions"
      menuClassName="min-w-[240px]"
      autoApplyCustomRange
      showCustomApplyButton={false}
      renderMenuInPortal
    />
  );
}
