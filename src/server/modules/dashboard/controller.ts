import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { logValidationFailure } from "@/server/api/logging";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionOrTokenUser } from "@/server/auth/request-user";

import { dashboardRangeQuerySchema, spendingByPeriodQuerySchema } from "./schemas";
import {
  getDashboardSummary,
  getSpendingByCategory,
  getSpendingByPeriod,
} from "./service";

export async function getSummary(request: Request) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireSessionOrTokenUser(request, ApiTokenScope.TRANSACTIONS_READ);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const searchParams = new URL(request.url).searchParams;
  const parsed = dashboardRangeQuerySchema.safeParse({
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await getDashboardSummary({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function getCategorySpending(request: Request) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireSessionOrTokenUser(request, ApiTokenScope.TRANSACTIONS_READ);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const searchParams = new URL(request.url).searchParams;
  const parsed = dashboardRangeQuerySchema.safeParse({
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await getSpendingByCategory({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function getPeriodSpending(request: Request) {
  const path = new URL(request.url).pathname;
  const sessionData = await requireSessionOrTokenUser(request, ApiTokenScope.TRANSACTIONS_READ);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const searchParams = new URL(request.url).searchParams;
  const parsed = spendingByPeriodQuerySchema.safeParse({
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
    granularity: searchParams.get("granularity") ?? undefined,
  });
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await getSpendingByPeriod({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
