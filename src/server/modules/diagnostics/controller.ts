import { jsonError, jsonOk } from "@/server/api/responses";
import { resolveApiToken } from "@/server/modules/api-tokens/service";
import { diagnosticReportSchema } from "./schemas";
import { saveDiagnosticReport } from "./service";

export const MAX_DIAGNOSTIC_BYTES = 256 * 1024;

async function readPayload(request: Request): Promise<unknown> {
  if (Number(request.headers.get("content-length")) > MAX_DIAGNOSTIC_BYTES)
    throw new RangeError();
  const reader = request.body?.getReader();
  if (!reader) throw new SyntaxError();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_DIAGNOSTIC_BYTES) {
        await reader.cancel();
        throw new RangeError();
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export async function postMobileDiagnostics(request: Request) {
  const token = request.headers
    .get("authorization")
    ?.match(/^Bearer\s+(\S+)$/i)?.[1];
  if (!token) return jsonError("Unauthorized", 401);
  const authentication = await resolveApiToken(token);
  if (!authentication.ok) {
    const unavailable = authentication.error === "SERVICE_UNAVAILABLE";
    return jsonError(
      unavailable ? "Service unavailable" : "Unauthorized",
      unavailable ? 503 : 401,
    );
  }
  let json: unknown;
  try {
    json = await readPayload(request);
  } catch (error) {
    return error instanceof RangeError
      ? jsonError("Payload too large", 413)
      : jsonError("Invalid JSON body", 400);
  }
  const parsed = diagnosticReportSchema.safeParse(json);
  if (!parsed.success) return jsonError("Invalid payload", 400);
  try {
    const result = await saveDiagnosticReport(
      authentication.data.userUuid,
      parsed.data,
    );
    if (result.status === "limited") {
      const response = jsonError("Daily report limit reached", 429);
      response.headers.set(
        "Retry-After",
        String(
          Math.max(
            1,
            Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
          ),
        ),
      );
      return response;
    }
    return jsonOk({ uuid: result.uuid }, 201);
  } catch {
    // Database exceptions can contain the note or report. Never log them.
    return jsonError("Service unavailable", 503);
  }
}
