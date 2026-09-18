import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";
import { PostgresRateLimiter } from "@/server/rate-limit/postgres";
import { oauthConfig } from "./config";
import { OAuthError, parameters } from "./schemas";

const limiter = new PostgresRateLimiter();
export const noStoreHeaders = {
  "cache-control": "no-store",
  pragma: "no-cache",
};
export function oauthFailure(error: unknown) {
  if (error instanceof OAuthError)
    return NextResponse.json(
      { error: error.code },
      { status: error.status, headers: noStoreHeaders },
    );
  logger.error({ event: "oauth.request.failed" });
  return NextResponse.json(
    { error: "temporarily_unavailable" },
    { status: 503, headers: noStoreHeaders },
  );
}
export async function limitOAuth(
  request: Request,
  operation: string,
  limit: number,
) {
  const ip =
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown";
  const result = await limiter.consume(
    `oauth:${operation}:${createHash("sha256").update(ip).digest("hex")}`,
    limit,
    60,
  );
  if (!result.allowed)
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      {
        status: 429,
        headers: {
          ...noStoreHeaders,
          "retry-after": String(
            Math.max(
              1,
              Math.ceil((result.resetAt.getTime() - Date.now()) / 1000),
            ),
          ),
        },
      },
    );
}
export function sameOrigin(request: Request) {
  if (request.headers.get("origin") !== oauthConfig().issuer)
    throw new OAuthError("invalid_request", 403);
}
export async function formBody(
  request: Request,
  repeatable: readonly string[] = [],
) {
  if (
    request.headers.get("content-type")?.split(";")[0].trim() !==
    "application/x-www-form-urlencoded"
  )
    throw new OAuthError("invalid_request");
  if (Number(request.headers.get("content-length")) > 16384)
    throw new OAuthError("invalid_request", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new OAuthError("invalid_request");
  let size = 0;
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.length;
    if (size > 16384) {
      await reader.cancel();
      throw new OAuthError("invalid_request", 413);
    }
    chunks.push(value);
  }
  return parameters(
    new URLSearchParams(Buffer.concat(chunks).toString("utf8")),
    repeatable,
  );
}
export function cors(request: Request, response: Response) {
  const origin = request.headers.get("origin");
  if (
    origin &&
    (process.env.MCP_ALLOWED_ORIGINS ?? "")
      .split(",")
      .map((s) => s.trim())
      .includes(origin)
  ) {
    response.headers.set("access-control-allow-origin", origin);
    response.headers.set("access-control-allow-methods", "POST, OPTIONS");
    response.headers.set(
      "access-control-allow-headers",
      "Authorization, Content-Type, MCP-Protocol-Version",
    );
    response.headers.set(
      "access-control-expose-headers",
      "WWW-Authenticate, Retry-After",
    );
  }
  response.headers.set("vary", "Origin");
  return response;
}
