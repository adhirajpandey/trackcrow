import "server-only";

import { getRecentLargeTransactions } from "@/server/modules/dashboard/service";

import {
  emptySpendingBase,
  loadSpendingBase,
  resolveSpendingContext,
  type DashboardPatternCell,
  type DashboardRecipientActivity,
  type DashboardTransactionDto,
  type SpendingPageBase,
  type SpendingPageOptions,
} from "./dashboard-page-data";

export const INSIGHTS_TABS = ["calendar", "recipients", "patterns"] as const;
export type InsightsTab = (typeof INSIGHTS_TABS)[number];

export type InsightsPageData = SpendingPageBase & {
  tab: InsightsTab;
  /** Day to open in the calendar, from a dashboard link. */
  focusDay: string | null;
  /** Every recipient paid in the range, largest total first. */
  recipients: DashboardRecipientActivity[];
  patterns: DashboardPatternCell[];
  largestTransactions: DashboardTransactionDto[];
};

type SearchParams = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export function parseInsightsTab(value: string | string[] | undefined): InsightsTab {
  const tab = first(value);
  return INSIGHTS_TABS.includes(tab as InsightsTab) ? (tab as InsightsTab) : "calendar";
}

export async function getInsightsPageData(
  searchParams: SearchParams,
  options: SpendingPageOptions = {}
): Promise<InsightsPageData> {
  const context = await resolveSpendingContext(searchParams, options);
  const tab = parseInsightsTab(searchParams.tab);
  const day = first(searchParams.day);
  const focusDay = day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : null;
  const [loaded, largest] = await Promise.all([
    loadSpendingBase(context),
    getRecentLargeTransactions({ ...context.rangeInput, take: 6 }),
  ]);

  if (!loaded || !largest.ok) {
    return { ...emptySpendingBase(context), tab, focusDay, recipients: [], patterns: [], largestTransactions: [] };
  }

  return {
    ...loaded.base,
    tab,
    focusDay,
    recipients: loaded.activity.recipients,
    patterns: loaded.activity.patterns,
    largestTransactions: largest.data,
  };
}
