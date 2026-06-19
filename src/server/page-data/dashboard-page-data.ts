import "server-only";

import { z } from "zod";

import { requirePageSessionUser } from "@/server/auth/session";
import {
  getDashboardSummary,
  getSpendingByCategory,
  getSpendingByPeriod,
} from "@/server/modules/dashboard/service";

const dashboardPageSearchSchema = z.object({
  startDate: z.string().trim().min(1).nullable(),
  endDate: z.string().trim().min(1).nullable(),
});

export type DashboardSummaryDto = {
  totalSpend: number;
  transactionCount: number;
  categorizedCount: number;
  uncategorizedCount: number;
  averageSpend: number;
};

export type DashboardCategorySpendDto = {
  category: string;
  totalSpend: number;
  transactionCount: number;
};

export type DashboardPeriodSpendDto = {
  period: string;
  totalSpend: number;
  transactionCount: number;
};

export type DashboardPageData = {
  status: "ready" | "error";
  message: string | null;
  rangeLabel: string;
  user: {
    name: string | null;
    email: string | null;
    image: string | null;
  };
  summary: DashboardSummaryDto;
  spendingByCategory: DashboardCategorySpendDto[];
  spendingByPeriod: DashboardPeriodSpendDto[];
};

type SearchParams = Record<string, string | string[] | undefined>;

const emptySummary: DashboardSummaryDto = {
  totalSpend: 0,
  transactionCount: 0,
  categorizedCount: 0,
  uncategorizedCount: 0,
  averageSpend: 0,
};

function firstParam(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value ?? null;
}

function parseDateInput(value: string | null) {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function buildRangeLabel(input: { startDate: string | null; endDate: string | null }) {
  if (input.startDate && input.endDate) {
    return `${input.startDate} to ${input.endDate}`;
  }

  if (input.startDate) {
    return `From ${input.startDate}`;
  }

  if (input.endDate) {
    return `Until ${input.endDate}`;
  }

  return "All time";
}

function emptyDashboardData(
  user: DashboardPageData["user"],
  rangeLabel: string,
  message: string
): DashboardPageData {
  return {
    status: "error",
    message,
    rangeLabel,
    user,
    summary: emptySummary,
    spendingByCategory: [],
    spendingByPeriod: [],
  };
}

export async function getDashboardPageData(
  searchParams: SearchParams
): Promise<DashboardPageData> {
  const sessionUser = await requirePageSessionUser();
  const parsedSearch = dashboardPageSearchSchema.safeParse({
    startDate: firstParam(searchParams.startDate),
    endDate: firstParam(searchParams.endDate),
  });
  const normalizedSearch = parsedSearch.success
    ? parsedSearch.data
    : { startDate: null, endDate: null };
  const rangeLabel = buildRangeLabel(normalizedSearch);
  const user = {
    name: sessionUser.name,
    email: sessionUser.email,
    image: sessionUser.image,
  };
  const dateRange = {
    startDate: parseDateInput(normalizedSearch.startDate),
    endDate: parseDateInput(normalizedSearch.endDate),
  };

  const [summary, spendingByCategory, spendingByPeriod] = await Promise.all([
    getDashboardSummary({
      userUuid: sessionUser.userUuid,
      ...dateRange,
    }),
    getSpendingByCategory({
      userUuid: sessionUser.userUuid,
      ...dateRange,
    }),
    getSpendingByPeriod({
      userUuid: sessionUser.userUuid,
      ...dateRange,
      granularity: "month",
    }),
  ]);

  if (!summary.ok || !spendingByCategory.ok || !spendingByPeriod.ok) {
    return emptyDashboardData(
      user,
      rangeLabel,
      "Dashboard data is temporarily unavailable. Try again in a moment."
    );
  }

  return {
    status: "ready",
    message: null,
    rangeLabel,
    user,
    summary: summary.data,
    spendingByCategory: spendingByCategory.data,
    spendingByPeriod: spendingByPeriod.data,
  };
}
