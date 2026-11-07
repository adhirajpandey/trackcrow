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
  type DashboardDayActivity,
  type DashboardRecipientActivity,
} from "@/server/modules/dashboard/service";

export type { DashboardDayActivity, DashboardRecipientActivity };

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

export type DashboardPageData = {
  status: "ready" | "error";
  message: string | null;
  /** Today's date in IST, YYYY-MM-DD, so server and browser agree on "today". */
  today: string;
  range: {
    value: DashboardRangeValue;
    label: string;
    startDate: string | null;
    endDate: string | null;
    granularity: DashboardGranularity;
  };
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  summary: DashboardSummaryDto;
  comparison: {
    kind: DashboardComparisonKind;
    rangeLabel: string;
    startDate: string;
    endDate: string;
    summary: DashboardSummaryDto;
  } | null;
  /** Days with at least one transaction, oldest first. */
  days: DashboardDayActivity[];
  /** Every recipient paid in the range, largest total first. */
  recipients: DashboardRecipientActivity[];
  largestTransactions: DashboardTransactionDto[];
  categoryOptions: CategoryOption[];
};

type SearchParams = Record<string, string | string[] | undefined>;
type DashboardPageOptions = {
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

export function getIstToday(now: Date = new Date()) {
  return new Date(now.getTime() + IST_OFFSET_MS).toISOString().slice(0, 10);
}

export async function getDashboardPageData(
  searchParams: SearchParams,
  options: DashboardPageOptions = {}
): Promise<DashboardPageData> {
  const sessionUser = await requirePageSessionUser();
  const rangeState = getDashboardRangeState({
    searchParams,
    persistedRange: options.persistedRange,
    now: options.now,
  });
  const range = {
    value: rangeState.range,
    label: rangeState.label,
    startDate: rangeState.startDate,
    endDate: rangeState.endDate,
    granularity: rangeState.granularity,
  };
  const previousRange = getPreviousDashboardRangeState(rangeState);
  const user = {
    name: sessionUser.name,
    email: sessionUser.email,
    image: sessionUser.image,
  };
  const today = getIstToday(options.now);
  const rangeInput = {
    userUuid: sessionUser.userUuid,
    startDate: rangeState.serviceStartDate,
    endDate: rangeState.serviceEndDate,
  };

  const [summary, activity, largestTransactions, categories, previousSummary] = await Promise.all([
    getDashboardSummary(rangeInput),
    getDashboardActivity(rangeInput),
    getRecentLargeTransactions({ ...rangeInput, take: 6 }),
    listCategoriesForUser({ userUuid: sessionUser.userUuid }),
    previousRange
      ? getDashboardSummary({
          userUuid: sessionUser.userUuid,
          startDate: previousRange.serviceStartDate,
          endDate: previousRange.serviceEndDate,
        })
      : Promise.resolve(null),
  ]);

  if (!summary.ok || !activity.ok || !largestTransactions.ok || !categories.ok) {
    return {
      status: "error",
      message: "Couldn’t load the dashboard.",
      today,
      range,
      user,
      summary: emptySummary,
      comparison: null,
      days: [],
      recipients: [],
      largestTransactions: [],
      categoryOptions: [],
    };
  }

  return {
    status: "ready",
    message: null,
    today,
    range,
    user,
    summary: summary.data,
    comparison:
      previousRange && previousSummary?.ok
        ? {
            kind: previousRange.kind,
            rangeLabel: previousRange.label,
            startDate: previousRange.startDate,
            endDate: previousRange.endDate,
            summary: previousSummary.data,
          }
        : null,
    days: activity.data.days,
    recipients: activity.data.recipients,
    largestTransactions: largestTransactions.data,
    categoryOptions: categories.data.map(toCategoryOption),
  };
}
