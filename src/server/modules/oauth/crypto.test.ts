import { createHash, randomUUID } from "node:crypto";
import { hashCredential, openConsent, sealConsent, verifyPkce } from "./crypto";
import { parseScopes, type Consent } from "./schemas";

describe("OAuth consent and PKCE", () => {
  const browser = "browser-secret";
  const consent: Consent = {
    clientId: "https://client.example/metadata",
    clientName: "Client",
    redirectUri: "http://127.0.0.1:3210/callback",
    scopes: ["transactions:read"],
    resource: "https://trackcrow.example/mcp",
    codeChallenge: "a".repeat(43),
    nonce: randomUUID(),
    browserHash: hashCredential(browser),
    expiresAt: Date.now() + 600000,
  };
  beforeAll(() => {
    process.env.NEXTAUTH_SECRET = "test-consent-secret";
  });
  it("round-trips authenticated state bound to one browser", () => {
    const sealed = sealConsent(consent);
    expect(openConsent(sealed, browser)).toEqual(consent);
    expect(() => openConsent(sealed, "another-browser")).toThrow(
      "invalid_request",
    );
    expect(() => openConsent(sealed, undefined)).toThrow("invalid_request");
    const changed = Buffer.from(sealed, "base64url");
    changed[30] ^= 1;
    expect(() => openConsent(changed.toString("base64url"), browser)).toThrow(
      "invalid_request",
    );
    expect(() =>
      openConsent(
        sealConsent({ ...consent, expiresAt: Date.now() - 1 }),
        browser,
      ),
    ).toThrow("invalid_request");
  });
  it("requires valid S256 verifiers", () => {
    const verifier = "a".repeat(43);
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    expect(verifyPkce(verifier, challenge)).toBe(true);
    expect(verifyPkce("b".repeat(43), challenge)).toBe(false);
    expect(verifyPkce("short", challenge)).toBe(false);
    expect(verifyPkce("!".repeat(43), challenge)).toBe(false);
  });
  it("accepts subsets but excludes SMS and unknown scopes", () => {
    expect(
      parseScopes("transactions:write transactions:read transactions:read"),
    ).toEqual(["transactions:write", "transactions:read"]);
    for (const scope of [
      null,
      "",
      "sms:import",
      "transactions:read sms:import",
      "openid",
    ])
      expect(() => parseScopes(scope)).toThrow("invalid_scope");
  });
});
