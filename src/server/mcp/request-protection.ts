import { createHash } from "node:crypto";

import { logger } from "@/lib/logger";
import { resolveApiToken } from "@/server/modules/api-tokens/service";
import { PostgresRateLimiter } from "@/server/rate-limit/postgres";
import type { RateLimiter, RateLimitResult } from "@/server/rate-limit/types";

const TOKEN_LIMIT = 120;
const IP_FAILURE_LIMIT = 10;
const WINDOW_SECONDS = 60;
const defaultLimiter = new PostgresRateLimiter();

function retryAfter(result: RateLimitResult) {
  return String(Math.max(1, Math.ceil((result.resetAt.getTime() - Date.now()) / 1000)));
}

function errorResponse(message: string, status: number, limit?: RateLimitResult) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...(limit ? { "retry-after": retryAfter(limit) } : {}),
    },
  });
}

function clientIp(request: Request) {
  return (
    request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

function ipBucket(request: Request) {
  return `mcp:auth-failure:${createHash("sha256").update(clientIp(request)).digest("hex")}`;
}

function bearerToken(request: Request) {
  const value = request.headers.get("authorization");
  const match = value?.match(/^Bearer\s+(\S+)$/i);
  return match?.[1] ?? null;
}

export async function protectMcpRequest(
  request: Request,
  limiter: RateLimiter = defaultLimiter
) {
  const ipKey = ipBucket(request);
  try {
    const blocked = await limiter.check(ipKey, IP_FAILURE_LIMIT, WINDOW_SECONDS);
    if (!blocked.allowed) return { ok: false as const, response: errorResponse("Too many requests", 429, blocked) };

    const token = bearerToken(request);
    if (!token) {
      const attempt = await limiter.consume(ipKey, IP_FAILURE_LIMIT, WINDOW_SECONDS);
      return {
        ok: false as const,
        response: attempt.allowed
          ? errorResponse("Unauthorized", 401)
          : errorResponse("Too many requests", 429, attempt),
      };
    }

    const authentication = await resolveApiToken(token);
    if (!authentication.ok) {
      if (authentication.error === "SERVICE_UNAVAILABLE") {
        return { ok: false as const, response: errorResponse("Service unavailable", 503) };
      }
      const attempt = await limiter.consume(ipKey, IP_FAILURE_LIMIT, WINDOW_SECONDS);
      return {
        ok: false as const,
        response: attempt.allowed
          ? errorResponse("Unauthorized", 401)
          : errorResponse("Too many requests", 429, attempt),
      };
    }

    const tokenLimit = await limiter.consume(
      `mcp:token:${authentication.data.tokenUuid}`,
      TOKEN_LIMIT,
      WINDOW_SECONDS
    );
    if (!tokenLimit.allowed) {
      return { ok: false as const, response: errorResponse("Too many requests", 429, tokenLimit) };
    }
    return { ok: true as const, identity: authentication.data };
  } catch (error) {
    logger.error({ event: "mcp.rate_limit.storage_failed" }, error);
    return { ok: false as const, response: errorResponse("Service unavailable", 503) };
  }
}

export async function enforceMcpBodyLimit(request: Request, maxBytes = 64 * 1024) {
  const declared = Number(request.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) return null;
  if (!request.body) return request;

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) {
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new Request(request, { body });
}
