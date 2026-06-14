import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import { dashboardRangeQuerySchema, spendingByPeriodQuerySchema } from "./schemas";
import {
  getDashboardSummary,
  getSpendingByCategory,
  getSpendingByPeriod,
} from "./service";

async function requireUserUuid() {
  const session = await requireSessionUser();
  return unwrapOrResponse(session);
}

export async function getSummary(request: Request) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const searchParams = new URL(request.url).searchParams;
  const parsed = dashboardRangeQuerySchema.safeParse({
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });
  if (!parsed.success) {
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
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const searchParams = new URL(request.url).searchParams;
  const parsed = dashboardRangeQuerySchema.safeParse({
    startDate: searchParams.get("startDate") ?? undefined,
    endDate: searchParams.get("endDate") ?? undefined,
  });
  if (!parsed.success) {
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
  const sessionData = await requireUserUuid();
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
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await getSpendingByPeriod({
    userUuid: sessionData.userUuid,
    ...parsed.data,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
