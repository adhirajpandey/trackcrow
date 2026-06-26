import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import { createDeviceTokenSchema, deviceTokenIdParamsSchema } from "./schemas";
import { createDeviceToken, listDeviceTokens, revokeDeviceToken } from "./service";

type RouteContext = { params: Promise<{ id: string }> };

async function requireUserUuid() {
  const session = await requireSessionUser();
  return unwrapOrResponse(session);
}

export async function getDeviceTokens() {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const result = await listDeviceTokens({ userUuid: sessionData.userUuid });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function postDeviceToken(request: Request) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = createDeviceTokenSchema.safeParse(json);
  if (!parsed.success) {
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await createDeviceToken({
    userUuid: sessionData.userUuid,
    label: parsed.data.label,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, 201);
}

export async function removeDeviceToken(
  _request: Request,
  context: RouteContext
) {
  const sessionData = await requireUserUuid();
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const params = await context.params;
  const parsed = deviceTokenIdParamsSchema.safeParse(params);
  if (!parsed.success) {
    return jsonError("Invalid request", 400);
  }

  const result = await revokeDeviceToken({
    userUuid: sessionData.userUuid,
    tokenId: parsed.data.id,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
