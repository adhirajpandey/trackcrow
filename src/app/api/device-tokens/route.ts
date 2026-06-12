import { z } from "zod";

import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import {
  createDeviceToken,
  listDeviceTokens,
} from "@/server/modules/device-tokens/service";

const createDeviceTokenSchema = z.object({
  label: z.string().trim().min(1).max(100).optional(),
});

export async function GET() {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return sessionData;
  }

  const result = await listDeviceTokens(sessionData.userUuid);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data);
}

export async function POST(request: Request) {
  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
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

  const result = await createDeviceToken(sessionData.userUuid, parsed.data.label);
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    return data;
  }

  return jsonOk(data, 201);
}
