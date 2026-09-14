import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { logInvalidJson, logValidationFailure } from "@/server/api/logging";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";

import { apiTokenIdParamsSchema, createApiTokenSchema } from "./schemas";
import { createApiToken, listApiTokens, revokeApiToken } from "./service";

type RouteContext = { params: Promise<{ id: string }> };

async function getSessionUserUuid() {
  return unwrapOrResponse(await requireSessionUser());
}

export async function getApiTokens() {
  const session = await getSessionUserUuid();
  if (session instanceof Response) return session;
  const result = await listApiTokens({ userUuid: session.userUuid });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}

export async function postApiToken(request: Request, legacySmsOnly = false) {
  const session = await getSessionUserUuid();
  if (session instanceof Response) return session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    logInvalidJson(new URL(request.url).pathname);
    return jsonError("Invalid JSON body", 400);
  }

  const genericParsed = createApiTokenSchema.safeParse(body);
  const legacyParsed = createApiTokenSchema.omit({ scopes: true }).partial({ label: true }).safeParse(body);
  const parsed = legacySmsOnly ? legacyParsed : genericParsed;
  if (!parsed.success) {
    logValidationFailure(new URL(request.url).pathname, parsed.error.issues);
    return jsonError("Invalid request", 400, { issues: parsed.error.issues });
  }

  const result = await createApiToken({
    userUuid: session.userUuid,
    label: parsed.data.label ?? "SMS import",
    scopes: legacySmsOnly ? [ApiTokenScope.SMS_IMPORT] : genericParsed.success ? genericParsed.data.scopes : [],
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data, 201);
}

export async function removeApiToken(_request: Request, context: RouteContext) {
  const session = await getSessionUserUuid();
  if (session instanceof Response) return session;
  const parsed = apiTokenIdParamsSchema.safeParse(await context.params);
  if (!parsed.success) return jsonError("Invalid request", 400);
  const result = await revokeApiToken({
    userUuid: session.userUuid,
    tokenUuid: parsed.data.id,
  });
  const data = unwrapOrResponse(result);
  return data instanceof Response ? data : jsonOk(data);
}
