import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual,
} from "node:crypto";
import { consentSchema, OAuthError, type Consent } from "./schemas";

export const hashCredential = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const credential = (prefix: string) =>
  prefix + randomBytes(32).toString("base64url");
export function verifyPkce(verifier: string, challenge: string) {
  if (!/^[A-Za-z0-9._~-]{43,128}$/.test(verifier)) return false;
  const actual = createHash("sha256").update(verifier).digest("base64url");
  return (
    actual.length === challenge.length &&
    timingSafeEqual(Buffer.from(actual), Buffer.from(challenge))
  );
}
function stateKey() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is required");
  return createHash("sha256")
    .update(`trackcrow:oauth:consent:v1:${secret}`)
    .digest();
}
export function sealConsent(consent: Consent) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", stateKey(), iv);
  const body = Buffer.concat([
    cipher.update(JSON.stringify(consent), "utf8"),
    cipher.final(),
  ]);
  return Buffer.concat([iv, cipher.getAuthTag(), body]).toString("base64url");
}
export function openConsent(
  value: string,
  browser: string | undefined,
): Consent {
  try {
    if (!browser || value.length > 16000) throw new Error();
    const bytes = Buffer.from(value, "base64url");
    const cipher = createDecipheriv(
      "aes-256-gcm",
      stateKey(),
      bytes.subarray(0, 12),
    );
    cipher.setAuthTag(bytes.subarray(12, 28));
    const consent = consentSchema.parse(
      JSON.parse(
        Buffer.concat([
          cipher.update(bytes.subarray(28)),
          cipher.final(),
        ]).toString("utf8"),
      ),
    );
    if (
      consent.expiresAt <= Date.now() ||
      consent.browserHash !== hashCredential(browser)
    )
      throw new Error();
    return consent;
  } catch {
    throw new OAuthError("invalid_request");
  }
}
