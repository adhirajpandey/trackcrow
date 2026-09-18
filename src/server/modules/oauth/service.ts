import {
  Prisma,
  type ApiTokenScope,
  type OAuthConnection,
} from "@/generated/prisma-rewrite";
import prisma from "@/lib/prisma-rewrite";
import { logger } from "@/lib/logger";
import { fail, ok } from "@/server/shared/result";
import type { AuthenticatedToken } from "@/server/modules/api-tokens/types";
import {
  ACCESS_LIFETIME_MS,
  CODE_LIFETIME_MS,
  CONNECTION_LIFETIME_MS,
  oauthConfig,
} from "./config";
import { credential, hashCredential, verifyPkce } from "./crypto";
import {
  OAuthError,
  parseScopes,
  scopeMap,
  scopesToWire,
  type Consent,
} from "./schemas";

type Tx = Prisma.TransactionClient;
const active = (connection: OAuthConnection, now: Date) =>
  !connection.revokedAt && connection.expiresAt > now;

// Serialize exchange/revocation per connection so a concurrent replay cannot
// leave a newly issued token usable after revocation.
async function lockConnection(tx: Tx, uuid: string) {
  await tx.$queryRaw`SELECT uuid FROM oauth_connection WHERE uuid = ${uuid} FOR UPDATE`;
  const connection = await tx.oAuthConnection.findUnique({ where: { uuid } });
  if (!connection) throw new OAuthError("invalid_grant");
  return connection;
}

async function issueTokens(
  tx: Tx,
  connection: OAuthConnection,
  scopes: ApiTokenScope[],
  now: Date,
) {
  const accessToken = credential("tc_at_");
  const refreshToken = credential("tc_rt_");
  const expiresAt = new Date(
    Math.min(
      now.getTime() + ACCESS_LIFETIME_MS,
      connection.expiresAt.getTime(),
    ),
  );
  await tx.oAuthAccessToken.create({
    data: {
      tokenHash: hashCredential(accessToken),
      connectionUuid: connection.uuid,
      scopes,
      expiresAt,
    },
  });
  const refresh = await tx.oAuthRefreshToken.create({
    data: {
      tokenHash: hashCredential(refreshToken),
      connectionUuid: connection.uuid,
      scopes,
      expiresAt: connection.expiresAt,
    },
  });
  return {
    refreshUuid: refresh.uuid,
    response: {
      access_token: accessToken,
      refresh_token: refreshToken,
      token_type: "Bearer",
      expires_in: Math.floor((expiresAt.getTime() - now.getTime()) / 1000),
      scope: scopesToWire(scopes),
    },
  };
}

export async function authorizeConnection(
  userUuid: string,
  consent: Consent,
  selected: string[],
) {
  if (
    selected.some(
      (scope) => !consent.scopes.includes(scope as Consent["scopes"][number]),
    )
  )
    throw new OAuthError("invalid_scope");
  const scopes = consent.scopes
    .filter((scope) => selected.includes(scope))
    .map((scope) => scopeMap[scope]);
  if (!scopes.length) throw new OAuthError("access_denied");
  const now = new Date();
  if (consent.expiresAt <= now.getTime())
    throw new OAuthError("invalid_request");
  const code = credential("tc_code_");
  try {
    await prisma.$transaction(async (tx) => {
      const connection = await tx.oAuthConnection.create({
        data: {
          userUuid,
          clientId: consent.clientId,
          clientName: consent.clientName,
          resource: consent.resource,
          scopes,
          createdAt: now,
          expiresAt: new Date(now.getTime() + CONNECTION_LIFETIME_MS),
        },
      });
      await tx.oAuthAuthorizationCode.create({
        data: {
          codeHash: hashCredential(code),
          consentNonce: consent.nonce,
          connectionUuid: connection.uuid,
          redirectUri: consent.redirectUri,
          codeChallenge: consent.codeChallenge,
          scopes,
          expiresAt: new Date(now.getTime() + CODE_LIFETIME_MS),
        },
      });
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    )
      throw new OAuthError("invalid_request");
    throw error;
  }
  return code;
}

export async function exchangeCode(input: {
  code: string;
  clientId: string;
  redirectUri: string;
  resource: string;
  verifier: string;
}) {
  return prisma.$transaction(async (tx) => {
    const code = await tx.oAuthAuthorizationCode.findUnique({
      where: { codeHash: hashCredential(input.code) },
    });
    if (!code) throw new OAuthError("invalid_grant");
    const connection = await lockConnection(tx, code.connectionUuid);
    const now = new Date();
    if (
      !active(connection, now) ||
      connection.clientId !== input.clientId ||
      connection.resource !== input.resource ||
      input.resource !== oauthConfig().resource ||
      code.redirectUri !== input.redirectUri ||
      !verifyPkce(input.verifier, code.codeChallenge)
    )
      throw new OAuthError("invalid_grant");
    const consumed = await tx.oAuthAuthorizationCode.updateMany({
      where: { uuid: code.uuid, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (!consumed.count) throw new OAuthError("invalid_grant");
    return (await issueTokens(tx, connection, code.scopes, now)).response;
  });
}

export async function exchangeRefresh(input: {
  refreshToken: string;
  clientId: string;
  resource: string;
  scope?: string;
}) {
  const result = await prisma.$transaction(async (tx) => {
    const initial = await tx.oAuthRefreshToken.findUnique({
      where: { tokenHash: hashCredential(input.refreshToken) },
    });
    if (!initial) throw new OAuthError("invalid_grant");
    const connection = await lockConnection(tx, initial.connectionUuid);
    const token = await tx.oAuthRefreshToken.findUniqueOrThrow({
      where: { uuid: initial.uuid },
    });
    const now = new Date();
    if (
      connection.clientId !== input.clientId ||
      connection.resource !== input.resource ||
      input.resource !== oauthConfig().resource
    )
      throw new OAuthError("invalid_grant");
    if (token.usedAt || token.replacedByTokenUuid) {
      await tx.oAuthConnection.update({
        where: { uuid: connection.uuid },
        data: { revokedAt: connection.revokedAt ?? now },
      });
      return null; // Commit revocation before returning the protocol error.
    }
    if (!active(connection, now) || token.expiresAt <= now)
      throw new OAuthError("invalid_grant");
    const scopes =
      input.scope === undefined
        ? token.scopes
        : parseScopes(input.scope).map((scope) => scopeMap[scope]);
    if (
      scopes.some(
        (scope) =>
          !token.scopes.includes(scope) || !connection.scopes.includes(scope),
      )
    )
      throw new OAuthError("invalid_scope");
    const issued = await issueTokens(tx, connection, scopes, now);
    await tx.oAuthRefreshToken.update({
      where: { uuid: token.uuid },
      data: { usedAt: now, replacedByTokenUuid: issued.refreshUuid },
    });
    return issued.response;
  });
  if (!result) throw new OAuthError("invalid_grant");
  return result;
}

export async function resolveOAuthAccessToken(token: string) {
  try {
    const now = new Date();
    const record = await prisma.oAuthAccessToken.findUnique({
      where: { tokenHash: hashCredential(token) },
      include: { connection: true },
    });
    if (
      !record ||
      record.expiresAt <= now ||
      !active(record.connection, now) ||
      record.connection.resource !== oauthConfig().resource
    )
      return fail("UNAUTHORIZED" as const);
    const cutoff = new Date(now.getTime() - 10 * 60_000);
    if (
      !record.connection.lastUsedAt ||
      record.connection.lastUsedAt < cutoff
    ) {
      try {
        await prisma.oAuthConnection.updateMany({
          where: {
            uuid: record.connectionUuid,
            OR: [{ lastUsedAt: null }, { lastUsedAt: { lt: cutoff } }],
          },
          data: { lastUsedAt: now },
        });
      } catch {
        logger.warn({
          event: "oauth.last_used_update_failed",
          tokenUuid: record.uuid,
        });
      }
    }
    return ok<AuthenticatedToken>({
      userUuid: record.connection.userUuid,
      tokenUuid: record.uuid,
      connectionUuid: record.connectionUuid,
      scopes: record.scopes,
    });
  } catch {
    logger.error({ event: "oauth.resolve.failed" });
    return fail("SERVICE_UNAVAILABLE" as const);
  }
}

export async function listConnections(userUuid: string) {
  return prisma.oAuthConnection.findMany({
    where: { userUuid },
    orderBy: { createdAt: "desc" },
    select: {
      uuid: true,
      clientId: true,
      clientName: true,
      scopes: true,
      createdAt: true,
      lastUsedAt: true,
      revokedAt: true,
      expiresAt: true,
    },
  });
}

export async function revokeConnection(userUuid: string, uuid: string) {
  return prisma.oAuthConnection.updateMany({
    where: { uuid, userUuid, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
