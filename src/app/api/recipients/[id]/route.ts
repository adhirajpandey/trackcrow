import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import { getRecipient } from "@/server/modules/recipients/queries";

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
  const recipientId = Number(params.id);
  if (!Number.isFinite(recipientId)) {
    return jsonError("Invalid request", 400);
  }

  const result = await getRecipient(sessionData.userUuid, recipientId);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}
