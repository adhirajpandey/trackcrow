import { OAuth2Client } from "google-auth-library";

import { ApiTokenScope } from "@/generated/prisma-rewrite";
import { logger } from "@/lib/logger";
import {
  createApiToken,
  resolveApiToken,
  revokeApiToken,
} from "@/server/modules/api-tokens/service";
import { ensureUserBootstrap } from "@/server/modules/users/service";
import { fail, ok, type ServiceResult } from "@/server/shared/result";

export const MOBILE_TOKEN_LABEL = "Android app";
export const MOBILE_TOKEN_SCOPES = [
  ApiTokenScope.TRANSACTIONS_READ,
  ApiTokenScope.TRANSACTIONS_WRITE,
  ApiTokenScope.SMS_IMPORT,
];

const googleClient = new OAuth2Client();

function getWebClientId() {
  return process.env.GOOGLE_CLIENT_ID || null;
}

export function getGoogleSignInConfig(): ServiceResult<
  { webClientId: string },
  "SERVICE_UNAVAILABLE"
> {
  const webClientId = getWebClientId();
  if (!webClientId) {
    logger.error({ event: "mobile_auth.google_client_missing" });
    return fail("SERVICE_UNAVAILABLE");
  }
  return ok({ webClientId });
}

/**
 * Exchanges a Google ID token for a TrackCrow device token. The user is resolved by
 * verified email through the same bootstrap as web sign-in.
 */
export async function signInWithGoogle(input: { idToken: string }): Promise<
  ServiceResult<
    { token: string; user: { name: string; email: string } },
    "UNAUTHORIZED" | "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR"
  >
> {
  const audience = getWebClientId();
  if (!audience) {
    logger.error({ event: "mobile_auth.google_client_missing" });
    return fail("SERVICE_UNAVAILABLE");
  }

  let payload;
  try {
    const ticket = await googleClient.verifyIdToken({ idToken: input.idToken, audience });
    payload = ticket.getPayload();
  } catch (error) {
    logger.warn({
      event: "mobile_auth.google_token_rejected",
      message: error instanceof Error ? error.message : "Unknown verification error",
    });
    return fail("UNAUTHORIZED");
  }

  if (!payload?.email || payload.email_verified !== true) {
    logger.warn({
      event: "mobile_auth.email_unverified",
      message: "Google ID token has no verified email",
    });
    return fail("UNAUTHORIZED");
  }

  const bootstrap = await ensureUserBootstrap({
    email: payload.email,
    name: payload.name ?? "No Name",
    image: payload.picture ?? null,
    provider: "google",
  });
  if (!bootstrap.ok) return fail("INTERNAL_ERROR");
  const user = bootstrap.data;

  const created = await createApiToken({
    userUuid: user.uuid,
    label: MOBILE_TOKEN_LABEL,
    scopes: MOBILE_TOKEN_SCOPES,
  });
  if (!created.ok) return fail("INTERNAL_ERROR");

  logger.info({
    event: "mobile_auth.signed_in",
    userId: user.uuid,
    tokenUuid: created.data.record.uuid,
  });
  return ok({ token: created.data.token, user: { name: user.name, email: user.email } });
}

/** Revokes the presented token, which ends that app session on the server. */
export async function revokeMobileSession(
  token: string
): Promise<ServiceResult<{ revoked: true }, "UNAUTHORIZED" | "SERVICE_UNAVAILABLE" | "INTERNAL_ERROR">> {
  const resolved = await resolveApiToken(token);
  if (!resolved.ok) return resolved;

  const revoked = await revokeApiToken({
    userUuid: resolved.data.userUuid,
    tokenUuid: resolved.data.tokenUuid,
  });
  if (!revoked.ok) {
    // NOT_FOUND means a concurrent request already revoked this token.
    return revoked.error === "NOT_FOUND" ? fail("UNAUTHORIZED") : fail("INTERNAL_ERROR");
  }
  return ok(revoked.data);
}
