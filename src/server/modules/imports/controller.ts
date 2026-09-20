import { logInvalidJson, logValidationFailure } from "@/server/api/logging";
import { jsonError, jsonOk, unwrapOrResponse } from "@/server/api/responses";
import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { hasApiTokenScope, resolveApiToken } from "@/server/modules/api-tokens/service";

import { importSmsRequestSchema } from "./schemas";
import { importSmsTransaction } from "./service";

function parseTokenFromAuthHeader(headerValue: string | null): string | null {
  if (!headerValue) {
    return null;
  }

  const match = headerValue.match(/^(?:Token|Bearer)\s+(\S+)$/i);
  return match ? match[1] : null;
}

export async function postSmsImport(request: Request) {
  const path = new URL(request.url).pathname;
  const token = parseTokenFromAuthHeader(request.headers.get("authorization"));

  if (!token) return jsonError("Unauthorized", 401);
  const authentication = await resolveApiToken(token);
  if (!authentication.ok) {
    const unavailable = authentication.error === "SERVICE_UNAVAILABLE";
    return jsonError(unavailable ? "Service unavailable" : "Unauthorized", unavailable ? 503 : 401);
  }
  if (!hasApiTokenScope(authentication.data, ApiTokenScope.SMS_IMPORT)) {
    return jsonError("Forbidden", 403);
  }

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    logInvalidJson(path);
    return jsonError("Invalid JSON body", 400);
  }

  const parsed = importSmsRequestSchema.safeParse(json);
  if (!parsed.success) {
    logValidationFailure(path, parsed.error.issues);
    return jsonError("Invalid payload", 400, { issues: parsed.error.issues });
  }

  const result = await importSmsTransaction({
    userUuid: authentication.data.userUuid,
    message: parsed.data.data.message,
    location: parsed.data.metadata.location,
  });
  const data = unwrapOrResponse(result);
  if (data instanceof Response) {
    if (!result.ok && result.error === "UNPROCESSABLE") {
      return jsonError(
        "Unable to extract required fields from message",
        422,
        result.details as object
      );
    }
    return data;
  }

  if (data.ignored) {
    return jsonOk({ message: "Message ignored by rule" }, 201);
  }

  return jsonOk(
    {
      message: "Transaction created",
      uuid: data.uuid,
    },
    201
  );
}
