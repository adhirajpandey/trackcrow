import "server-only";

import type { CategoryOption } from "@/common/types";
import type { DashboardGranularity, DashboardRangeValue } from "@/features/dashboard/query-state";
import {
  getDashboardRangeState,
  getPreviousDashboardRangeState,
} from "@/features/dashboard/query-state";
import { requirePageSessionUser } from "@/server/auth/session";
import { toCategoryOption } from "@/server/modules/categories/helpers";
import { listCategoriesForUser } from "@/server/modules/categories/service";
import {
  getDashboardActivity,
  getDashboardSummary,
  getRecentLargeTransactions,
  getRecentTransactions,
  type DashboardDayActivity,
  type DashboardPatternCell,
  type DashboardRecipientActivity,
} from "@/server/modules/dashboard/service";

export type { DashboardDayActivity, DashboardPatternCell, DashboardRecipientActivity };

export type DashboardSummaryDto = {
  totalSpend: number;
  transactionCount: number;
  categorizedCount: number;
  uncategorizedCount: number;
  averageSpend: number;
};

export type DashboardTransactionDto = {
  uuid: string;
  recipient: string;
  category: string | null;
  subcategory: string | null;
  amount: number;
  timestamp: string;
  source: string;
};

export type DashboardComparisonKind =
  | "same-period-last-year"
  | "previous-month-to-date"
  | "previous-calendar-month"
  | "previous-equal-length";

export type SpendingRange = {
  value: DashboardRangeValue;
  label: string;
  startDate: string | null;
  endDate: string | null;
  granularity: DashboardGranularity;
};

/** What every spending page shares: the range, today, the summary and its comparison. */
export type SpendingPageBase = {
  status: "ready" | "error";
  message: string | null;
  /** Today's date in IST, YYYY-MM-DD, so server and browser agree on "today". */
  today: string;
  range: SpendingRange;
  user: { name: string | null; email: string | null; image: string | null };
  summary: DashboardSummaryDto;
  /** Total of uncategorized transactions in the range. */
  uncategorizedAmount: number;
  comparison: {
    kind: DashboardComparisonKind;
    rangeLabel: string;
    startDate: string;
    endDate: string;
    summary: DashboardSummaryDto;
  } | null;
  /** Days with at least one transaction, oldest first. */
  days: DashboardDayActivity[];
  categoryOptions: CategoryOption[];
};

export type DashboardPageData = SpendingPageBase & {
  /** The five recipients with the largest totals. */
  topRecipients: DashboardRecipientActivity[];
  recipientCount: number;
  /** The largest uncategorized transactions, for quick review. */
  needsCategory: DashboardTransactionDto[];
  latestTransactions: DashboardTransactionDto[];
};

type SearchParams = Record<string, string | string[] | undefined>;
export type SpendingPageOptions = {
  persistedRange?: string | null;
  now?: Date;
};

const IST_OFFSET_MS = 330 * 60 * 1000;

const emptySummary: DashboardSummaryDto = {
  totalSpend: 0,
  transactionCount: 0,
  categorizedCount: 0,
  uncategorizedCount: 0,
  averageSpend: 0,
};

export const SPENDING_PAGE_ERROR = "Couldn’t load your spending.";

export function getIstToday(now: Date = new Date()) {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

/** Resolves the session, range and comparison window shared by the dashboard and Insights. */
export async function resolveSpendingContext(searchParams: SearchParams, options: SpendingPageOptions = {}) {
  const sessionUser = await requirePageSessionUser();
  const rangeState = getDashboardRangeState({ searchParams, persistedRange: options.persistedRange, now: options.now });
  const previousRange = getPreviousDashboardRangeState(rangeState);
  return {
    userUuid: sessionUser.userUuid,
    user: { name: sessionUser.name, email: sessionUser.email, image: sessionUser.image },
    today: getIstToday(options.now),
    range: {
      value: rangeState.range,
      label: rangeState.label,
      startDate: rangeState.startDate,
      endDate: rangeState.endDate,
      granularity: rangeState.granularity,
    } satisfies SpendingRange,
    rangeInput: { userUuid: sessionUser.userUuid, startDate: rangeState.serviceStartDate, endDate: rangeState.serviceEndDate },
    previousRange,
  };
}

type SpendingContext = Awaited<ReturnType<typeof resolveSpendingContext>>;

/** Summary, comparison, categories and activity for a range; null when a required read fails. */
export async function loadSpendingBase(context: SpendingContext) {
  const [summary, activity, categories, previousSummary] = await Promise.all([
    getDashboardSummary(context.rangeInput),
    getDashboardActivity(context.rangeInput),
    listCategoriesForUser({ userUuid: context.userUuid }),
    context.previousRange
      ? getDashboardSummary({
          userUuid: context.userUuid,
          startDate: context.previousRange.serviceStartDate,
          endDate: context.previousRange.serviceEndDate,
        })
      : Promise.resolve(null),
  ]);
  if (!summary.ok || !activity.ok || !categories.ok) return null;

  const base: SpendingPageBase = {
    status: "ready",
    message: null,
    today: context.today,
    range: context.range,
    user: context.user,
    summary: summary.data,
    uncategorizedAmount: activity.data.recipients.reduce((sum, recipient) => sum + recipient.uncategorizedAmount, 0),
    comparison:
      context.previousRange && previousSummary?.ok
        ? {
            kind: context.previousRange.kind,
            rangeLabel: context.previousRange.label,
            startDate: context.previousRange.startDate,
            endDate: context.previousRange.endDate,
            summary: previousSummary.data,
          }
        : null,
    days: activity.data.days,
    categoryOptions: categories.data.map(toCategoryOption),
  };
  return { base, activity: activity.data };
}

export function emptySpendingBase(context: SpendingContext): SpendingPageBase {
  return {
    status: "error",
    message: SPENDING_PAGE_ERROR,
    today: context.today,
    range: context.range,
    user: context.user,
    summary: emptySummary,
    uncategorizedAmount: 0,
    comparison: null,
    days: [],
    categoryOptions: [],
  };
}

export async function getDashboardPageData(
  searchParams: SearchParams,
  options: SpendingPageOptions = {}
): Promise<DashboardPageData> {
  const context = await resolveSpendingContext(searchParams, options);
  const [loaded, needsCategory, latest] = await Promise.all([
    loadSpendingBase(context),
    getRecentLargeTransactions({ ...context.rangeInput, take: 3, uncategorizedOnly: true }),
    getRecentTransactions({ ...context.rangeInput, take: 5 }),
  ]);

  if (!loaded || !needsCategory.ok || !latest.ok) {
    return { ...emptySpendingBase(context), topRecipients: [], recipientCount: 0, needsCategory: [], latestTransactions: [] };
  }

  return {
    ...loaded.base,
    topRecipients: loaded.activity.recipients.slice(0, 5),
    recipientCount: loaded.activity.recipients.length,
    needsCategory: needsCategory.data,
    latestTransactions: latest.data,
  };
}
