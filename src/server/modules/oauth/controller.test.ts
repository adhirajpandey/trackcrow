jest.mock("next/headers", () => ({ cookies: jest.fn() }));
jest.mock("@/server/auth/session", () => ({ requireSessionUser: jest.fn() }));
jest.mock("./cimd", () => ({
  ...jest.requireActual("./cimd"),
  resolveClientMetadata: jest.fn(),
}));
jest.mock("./service", () => ({
  authorizeConnection: jest.fn(),
  exchangeCode: jest.fn(),
  exchangeRefresh: jest.fn(),
  listConnections: jest.fn(),
  revokeConnection: jest.fn(),
}));
jest.mock("@/server/rate-limit/postgres", () => ({
  PostgresRateLimiter: jest.fn().mockImplementation(() => ({
    consume: jest.fn().mockResolvedValue({ allowed: true }),
  })),
}));

import { createHash, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { requireSessionUser } from "@/server/auth/session";
import { resolveClientMetadata } from "./cimd";
import {
  getAuthorize,
  postConsent,
  postToken,
  removeConnection,
} from "./controller";
import { BROWSER_COOKIE, consentCookie } from "./browser-consent";
import {
  authorizeConnection,
  exchangeCode,
  exchangeRefresh,
  revokeConnection,
} from "./service";
import { hashCredential, sealConsent } from "./crypto";
import { authorizationMetadata, resourceMetadata } from "./config";
import type { Consent } from "./schemas";

const issuer = "https://trackcrow.example",
  clientId = "https://client.example/metadata",
  browser = "test-browser";
const metadata = {
  client_id: clientId,
  client_name: "Client",
  redirect_uris: ["https://client.example/callback"],
  token_endpoint_auth_method: "none" as const,
};
const consent: Consent = {
  clientId,
  clientName: "Client",
  redirectUri: metadata.redirect_uris[0],
  state: "original-state",
  resource: `${issuer}/mcp`,
  scopes: ["transactions:read", "transactions:write"],
  codeChallenge: createHash("sha256")
    .update("a".repeat(43))
    .digest("base64url"),
  nonce: randomUUID(),
  browserHash: hashCredential(browser),
  expiresAt: Date.now() + 600000,
};
function form(path: string, params: Record<string, string>, origin = issuer) {
  return new Request(`${issuer}${path}`, {
    method: "POST",
    headers: { origin, "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params),
  });
}
function authorization(overrides: Record<string, string | undefined> = {}) {
  return new Request(
    `${issuer}/oauth/authorize?${new URLSearchParams({ client_id: clientId, redirect_uri: consent.redirectUri, response_type: "code", resource: consent.resource, scope: consent.scopes.join(" "), code_challenge: consent.codeChallenge, code_challenge_method: "S256", state: "original-state", ...Object.fromEntries(Object.entries(overrides).filter((entry): entry is [string, string] => entry[1] !== undefined)) })}`,
  );
}
function submission(extra: Record<string, string | undefined> = {}) {
  return {
    request: consent.nonce,
    consent: sealConsent({ ...consent, userUuid: "user" }),
    scope: "transactions:read",
    decision: "approve",
    ...Object.fromEntries(
      Object.entries(extra).filter(
        (entry): entry is [string, string] => entry[1] !== undefined,
      ),
    ),
  };
}

describe("OAuth HTTP controllers", () => {
  beforeEach(() => {
    process.env.OAUTH_ISSUER_URL = issuer;
    process.env.NEXTAUTH_SECRET = "test-secret";
    jest.mocked(resolveClientMetadata).mockResolvedValue(metadata);
    jest
      .mocked(requireSessionUser)
      .mockResolvedValue({ ok: true, data: { userUuid: "user" } });
    const values = new Map([
      [BROWSER_COOKIE, browser],
      [consentCookie(consent.nonce), sealConsent(consent)],
    ]);
    jest.mocked(cookies).mockResolvedValue({
      get: (name: string) =>
        values.has(name) ? { name, value: values.get(name)! } : undefined,
    } as Awaited<ReturnType<typeof cookies>>);
    jest.mocked(authorizeConnection).mockResolvedValue("issued-code");
  });
  it("advertises CIMD, S256, resource binding and only MCP scopes", () => {
    expect(authorizationMetadata()).toMatchObject({
      client_id_metadata_document_supported: true,
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    });
    expect(authorizationMetadata()).not.toHaveProperty("registration_endpoint");
    expect(resourceMetadata()).toMatchObject({
      resource: consent.resource,
      scopes_supported: ["transactions:read", "transactions:write"],
    });
  });
  it("sets HttpOnly consent and browser cookies and redirects to consent", async () => {
    const response = await getAuthorize(authorization());
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain(
      `${issuer}/oauth/consent?request=`,
    );
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
    expect(response.headers.get("set-cookie")).toContain("Secure");
    expect(response.headers.get("location")).not.toContain("original-state");
  });
  it("never redirects to an invalid callback or for invalid client metadata", async () => {
    const response = await getAuthorize(
      authorization({ redirect_uri: "https://attacker.example/callback" }),
    );
    expect(response.status).toBe(400);
    expect(response.headers.get("location")).toBeNull();
    jest
      .mocked(resolveClientMetadata)
      .mockRejectedValueOnce(new Error("network failed"));
    expect(
      (await getAuthorize(authorization())).headers.get("location"),
    ).toBeNull();
  });
  it.each([
    { code_challenge_method: "plain" },
    { code_challenge: "" },
    { code_challenge: "invalid" },
    { resource: "https://other.example/mcp" },
    { scope: "sms:import" },
  ])("rejects invalid authorization parameters %j", async (input) => {
    const response = await getAuthorize(authorization(input));
    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("error=");
    expect(response.headers.get("location")).toContain("state=original-state");
  });
  it("requires a session and rejects cross-origin consent", async () => {
    jest
      .mocked(requireSessionUser)
      .mockResolvedValueOnce({ ok: false, error: "UNAUTHORIZED" });
    expect(
      (await postConsent(form("/oauth/consent/submit", submission()))).status,
    ).toBe(401);
    expect(
      (
        await postConsent(
          form("/oauth/consent/submit", submission(), "https://evil.example"),
        )
      ).status,
    ).toBe(403);
    expect(authorizeConnection).not.toHaveBeenCalled();
  });
  it("binds approval to the account displayed and validates the encrypted form", async () => {
    const response = await postConsent(
      form(
        "/oauth/consent/submit",
        submission({
          consent: sealConsent({ ...consent, userUuid: "another-user" }),
        }),
      ),
    );
    expect(response.headers.get("location")).toContain("error=invalid_request");
    expect(authorizeConnection).not.toHaveBeenCalled();
  });
  it.each([
    "transactions:read",
    "transactions:write",
    "transactions:read transactions:write",
  ])("passes selected scopes %s and returns original state", async (scope) => {
    const response = await postConsent(
      form("/oauth/consent/submit", submission({ scope })),
    );
    expect(authorizeConnection).toHaveBeenCalledWith(
      "user",
      expect.objectContaining({ clientId }),
      scope.split(" "),
    );
    expect(response.headers.get("location")).toBe(
      "https://client.example/callback?code=issued-code&state=original-state",
    );
  });
  it.each([{ scope: "" }, { decision: "deny" }])(
    "denies empty/cancelled consent %j",
    async (input) => {
      const response = await postConsent(
        form("/oauth/consent/submit", submission(input)),
      );
      expect(response.headers.get("location")).toContain("error=access_denied");
      expect(authorizeConnection).not.toHaveBeenCalled();
    },
  );
  it("accepts native checkbox values while rejecting duplicate control parameters", async () => {
    const body = new URLSearchParams(submission());
    body.append("scope", "transactions:write");
    const request = () =>
      new Request(`${issuer}/oauth/consent/submit`, {
        method: "POST",
        headers: {
          origin: issuer,
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      });
    expect((await postConsent(request())).status).toBe(303);
    expect(authorizeConnection).toHaveBeenCalledWith(
      "user",
      expect.any(Object),
      ["transactions:read", "transactions:write"],
    );
    body.append("decision", "deny");
    expect((await postConsent(request())).status).toBe(400);
  });
  it("denies a native form with every scope unchecked", async () => {
    const body = new URLSearchParams(submission());
    body.delete("scope");
    const response = await postConsent(
      new Request(`${issuer}/oauth/consent/submit`, {
        method: "POST",
        headers: {
          origin: issuer,
          "content-type": "application/x-www-form-urlencoded",
        },
        body,
      }),
    );
    expect(response.headers.get("location")).toContain("error=access_denied");
    expect(authorizeConnection).not.toHaveBeenCalled();
  });
  it("rechecks metadata on new consent but never during exchanges", async () => {
    jest.mocked(resolveClientMetadata).mockResolvedValueOnce({
      ...metadata,
      redirect_uris: ["https://client.example/new-callback"],
    });
    expect(
      (
        await postConsent(form("/oauth/consent/submit", submission()))
      ).headers.get("location"),
    ).toContain("error=invalid_client");
    jest.mocked(resolveClientMetadata).mockClear();
    jest.mocked(exchangeCode).mockResolvedValueOnce({
      access_token: "access",
      refresh_token: "refresh",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "transactions:read",
    });
    const response = await postToken(
      form("/oauth/token", {
        grant_type: "authorization_code",
        client_id: clientId,
        resource: consent.resource,
        code: "code",
        redirect_uri: consent.redirectUri,
        code_verifier: "a".repeat(43),
      }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toHaveProperty("scope", "transactions:read");
    expect(resolveClientMetadata).not.toHaveBeenCalled();
  });
  it("passes refresh parameters without looking up current metadata", async () => {
    jest.mocked(exchangeRefresh).mockResolvedValueOnce({
      access_token: "next",
      refresh_token: "next-refresh",
      token_type: "Bearer",
      expires_in: 3600,
      scope: "transactions:read",
    });
    const response = await postToken(
      form("/oauth/token", {
        grant_type: "refresh_token",
        client_id: clientId,
        resource: consent.resource,
        refresh_token: "old",
        scope: "transactions:read",
      }),
    );
    expect(response.status).toBe(200);
    expect(resolveClientMetadata).not.toHaveBeenCalled();
    expect(exchangeRefresh).toHaveBeenCalledWith({
      clientId,
      resource: consent.resource,
      refreshToken: "old",
      scope: "transactions:read",
    });
  });
  it("scopes revocation to the current session user", async () => {
    jest.mocked(revokeConnection).mockResolvedValueOnce({ count: 1 });
    const id = randomUUID();
    const result = await removeConnection(
      new Request(`${issuer}/api/oauth/connections/${id}`, {
        method: "DELETE",
        headers: { origin: issuer },
      }),
      { params: Promise.resolve({ id }) },
    );
    expect(result.status).toBe(200);
    expect(revokeConnection).toHaveBeenCalledWith("user", id);
  });
});
