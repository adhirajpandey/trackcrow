import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import { suggestTransactionCategory } from "@/server/modules/transactions/service";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const params = await context.params;
  const transactionId = Number(params.id);
  if (!Number.isFinite(transactionId)) {
    return jsonError("Invalid request", 400);
  }

  const result = await suggestTransactionCategory(
    sessionData.userUuid,
    transactionId
  );
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}
