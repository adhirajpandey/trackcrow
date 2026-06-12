import { jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import { getSpendingByPeriod } from "@/server/modules/dashboard/service";

export async function GET(request: Request) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const result = await getSpendingByPeriod(
    sessionData.userUuid,
    new URL(request.url).searchParams
  );
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}
