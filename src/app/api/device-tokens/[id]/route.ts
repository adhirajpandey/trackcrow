import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import { revokeDeviceToken } from "@/server/modules/device-tokens/service";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const params = await context.params;
  const tokenId = Number(params.id);
  if (!Number.isFinite(tokenId)) {
    return jsonError("Invalid request", 400);
  }

  const result = await revokeDeviceToken(sessionData.userUuid, tokenId);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}
