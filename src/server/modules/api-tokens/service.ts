import { createHash, randomBytes } from "node:crypto";

import type { ApiTokenScope } from "@/generated/prisma-rewrite";
import { logger } from "@/lib/logger";
import prisma from "@/lib/prisma-rewrite";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

import type { ApiTokenDto, AuthenticatedToken } from "./types";

const LAST_USED_WRITE_INTERVAL_MS = 10 * 60 * 1000;

export function hashApiToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function toDto(token: ApiTokenDto): ApiTokenDto {
  return token;
}

export function hasApiTokenScope(
  identity: Pick<AuthenticatedToken, "scopes">,
  scope: ApiTokenScope
) {
  return identity.scopes.includes(scope);
}

export async function listApiTokens(input: { userUuid: string }) {
  try {
    const tokens = await prisma.apiToken.findMany({
      where: { userUuid: input.userUuid },
      select: {
        uuid: true,
        label: true,
        tokenPrefix: true,
        scopes: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return ok(tokens.map(toDto));
  } catch (error) {
    logger.error({ event: "api_token.list.db_failed", userId: input.userUuid }, error);
    return fail("INTERNAL_ERROR" as const);
  }
}

export async function createApiToken(input: {
  userUuid: string;
  label: string;
  scopes: ApiTokenScope[];
}): Promise<
  ServiceResult<{ token: string; record: ApiTokenDto }, "VALIDATION_ERROR" | "INTERNAL_ERROR">
> {
  const scopes = [...new Set(input.scopes)];
  if (scopes.length === 0) {
    return fail("VALIDATION_ERROR");
  }

  try {
    const plainToken = randomBytes(24).toString("hex");
    const record = await prisma.apiToken.create({
      data: {
        userUuid: input.userUuid,
        label: input.label.trim(),
        tokenHash: hashApiToken(plainToken),
        tokenPrefix: plainToken.slice(0, 8),
        scopes,
      },
      select: {
        uuid: true,
        label: true,
        tokenPrefix: true,
        scopes: true,
        createdAt: true,
        lastUsedAt: true,
        revokedAt: true,
      },
    });
    logger.info({
      event: "api_token.created",
      userId: input.userUuid,
      tokenUuid: record.uuid,
    });
    return ok({ token: plainToken, record: toDto(record) });
  } catch (error) {
    logger.error({ event: "api_token.create.db_failed", userId: input.userUuid }, error);
    return fail("INTERNAL_ERROR");
  }
}

export async function revokeApiToken(input: {
  userUuid: string;
  tokenUuid: string;
  requiredScope?: ApiTokenScope;
}) {
  try {
    const updated = await prisma.apiToken.updateMany({
      where: {
        uuid: input.tokenUuid,
        userUuid: input.userUuid,
        revokedAt: null,
        ...(input.requiredScope ? { scopes: { has: input.requiredScope } } : {}),
      },
      data: { revokedAt: new Date() },
    });
    if (updated.count === 0) return fail("NOT_FOUND" as const);
    logger.info({
      event: "api_token.revoked",
      userId: input.userUuid,
      tokenUuid: input.tokenUuid,
    });
    return ok({ revoked: true as const });
  } catch (error) {
    logger.error(
      {
        event: "api_token.revoke.db_failed",
        userId: input.userUuid,
        tokenUuid: input.tokenUuid,
      },
      error
    );
    return fail("INTERNAL_ERROR" as const);
  }
}

export async function resolveApiToken(
  token: string
): Promise<ServiceResult<AuthenticatedToken, "UNAUTHORIZED" | "SERVICE_UNAVAILABLE">> {
  let record: {
    uuid: string;
    userUuid: string;
    scopes: ApiTokenScope[];
    lastUsedAt: Date | null;
  } | null;
  try {
    record = await prisma.apiToken.findFirst({
      where: { tokenHash: hashApiToken(token), revokedAt: null },
      select: { uuid: true, userUuid: true, scopes: true, lastUsedAt: true },
    });
  } catch (error) {
    logger.error({ event: "api_token.resolve.db_failed" }, error);
    return fail("SERVICE_UNAVAILABLE");
  }

  if (!record) return fail("UNAUTHORIZED");

  if (
    !record.lastUsedAt ||
    record.lastUsedAt.getTime() < Date.now() - LAST_USED_WRITE_INTERVAL_MS
  ) {
    const cutoff = new Date(Date.now() - LAST_USED_WRITE_INTERVAL_MS);
    try {
      await prisma.apiToken.updateMany({
        where: {
          uuid: record.uuid,
          OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: cutoff } }],
        },
        data: { lastUsedAt: new Date() },
      });
    } catch (error) {
      logger.warn({
        event: "api_token.last_used_update_failed",
        tokenUuid: record.uuid,
        message: error instanceof Error ? error.message : "Unknown bookkeeping error",
      });
    }
  }

  return ok({ userUuid: record.userUuid, tokenUuid: record.uuid, scopes: record.scopes });
}
