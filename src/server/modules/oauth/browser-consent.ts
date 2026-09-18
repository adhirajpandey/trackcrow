import { cookies } from "next/headers";
import { openConsent } from "./crypto";
import { OAuthError } from "./schemas";

export const BROWSER_COOKIE = "tc_oauth_browser";
export const consentCookie = (nonce: string) => `tc_oauth_${nonce}`;

export async function readBrowserConsent(nonce: string) {
  if (!/^[0-9a-f-]{36}$/.test(nonce)) throw new OAuthError("invalid_request");
  const jar = await cookies();
  const sealed = jar.get(consentCookie(nonce))?.value;
  if (!sealed) throw new OAuthError("invalid_request");
  const consent = openConsent(sealed, jar.get(BROWSER_COOKIE)?.value);
  if (consent.nonce !== nonce) throw new OAuthError("invalid_request");
  return consent;
}
