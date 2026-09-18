import "server-only";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { readBrowserConsent } from "@/server/modules/oauth/browser-consent";
import { sealConsent } from "@/server/modules/oauth/crypto";

export async function getOAuthConsentPageData(requestId: string) {
  let consent;
  try {
    consent = await readBrowserConsent(requestId);
  } catch {
    return null;
  }
  const session = await getServerSession(authOptions);
  return {
    requestId: consent.nonce,
    clientName: consent.clientName,
    clientDomain: new URL(consent.clientId).hostname,
    scopes: consent.scopes,
    userLabel: session?.user?.uuid
      ? (session.user.email ?? session.user.name ?? "your TrackCrow account")
      : null,
    sealedConsent: session?.user?.uuid
      ? sealConsent({ ...consent, userUuid: session.user.uuid })
      : null,
  };
}
