import "server-only";

import type { ApiTokenScope } from "@/generated/prisma-rewrite";
import { jsonError, unwrapOrResponse } from "@/server/api/responses";
import { requireSessionUser } from "@/server/auth/session";
import { hasApiTokenScope, resolveApiToken } from "@/server/modules/api-tokens/service";

/**
 * Resolves the user from the browser session, or from a personal access token
 * when an Authorization header is supplied.
 */
export async function requireSessionOrTokenUser(
  request: Request,
  scope: ApiTokenScope
): Promise<{ userUuid: string } | Response> {
  // Even an empty or malformed supplied header must not fall back to cookies.
  if (!request.headers.has("authorization")) {
    return unwrapOrResponse(await requireSessionUser());
  }
  const token = request.headers.get("authorization")?.match(/^(?:Token|Bearer)\s+(\S+)$/i)?.[1];
  if (!token) return jsonError("Unauthorized", 401);
  const authentication = await resolveApiToken(token);
  if (!authentication.ok) {
    const unavailable = authentication.error === "SERVICE_UNAVAILABLE";
    return jsonError(unavailable ? "Service unavailable" : "Unauthorized", unavailable ? 503 : 401);
  }
  if (!hasApiTokenScope(authentication.data, scope)) {
    return jsonError("Forbidden", 403);
  }
  return { userUuid: authentication.data.userUuid };
}
