import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { requireSessionUser } from "@/server/auth/session";
import { resolveClientMetadata, redirectAllowed } from "./cimd";
import { CONSENT_LIFETIME_MS, oauthConfig } from "./config";
import { credential, hashCredential, openConsent, sealConsent } from "./crypto";
import {
  cors,
  formBody,
  limitOAuth,
  noStoreHeaders,
  oauthFailure,
  sameOrigin,
} from "./http";
import {
  OAuthError,
  parameters,
  parseScopes,
  required,
  type Consent,
} from "./schemas";
import {
  authorizeConnection,
  exchangeCode,
  exchangeRefresh,
  listConnections,
  revokeConnection,
} from "./service";
import {
  BROWSER_COOKIE,
  consentCookie,
  readBrowserConsent,
} from "./browser-consent";

export function authorizationRedirect(
  consent: Pick<Consent, "redirectUri" | "state">,
  result: { code: string } | { error: string },
) {
  const url = new URL(consent.redirectUri);
  url.searchParams.delete("code");
  url.searchParams.delete("error");
  url.searchParams.delete("state");
  for (const [key, value] of Object.entries(result))
    url.searchParams.set(key, value);
  if (consent.state !== undefined) url.searchParams.set("state", consent.state);
  return url;
}

export async function getAuthorize(request: Request) {
  let trustedRedirect: { redirectUri: string; state?: string } | undefined;
  try {
    const limited = await limitOAuth(request, "authorize", 20);
    if (limited) return limited;
    if (request.url.length > 8192) throw new OAuthError("invalid_request");
    const params = parameters(new URL(request.url).searchParams);
    const clientId = required(params, "client_id");
    const redirectUri = required(params, "redirect_uri");
    const metadata = await resolveClientMetadata(clientId);
    if (!redirectAllowed(redirectUri, metadata.redirect_uris))
      throw new OAuthError("invalid_request");
    const state = params.get("state") ?? undefined;
    if (state && state.length > 1024) throw new OAuthError("invalid_request");
    trustedRedirect = { redirectUri, state };
    if (params.get("response_type") !== "code")
      throw new OAuthError("unsupported_response_type");
    const resource = required(params, "resource");
    if (resource !== oauthConfig().resource)
      throw new OAuthError("invalid_target");
    const scopes = parseScopes(params.get("scope"));
    const codeChallenge = required(params, "code_challenge");
    if (
      params.get("code_challenge_method") !== "S256" ||
      !/^[A-Za-z0-9_-]{43}$/.test(codeChallenge)
    )
      throw new OAuthError("invalid_request");
    const jar = await cookies();
    const browser = jar.get(BROWSER_COOKIE)?.value ?? credential("");
    const consent: Consent = {
      clientId,
      clientName: metadata.client_name,
      redirectUri,
      state,
      resource,
      scopes,
      codeChallenge,
      nonce: randomUUID(),
      browserHash: hashCredential(browser),
      expiresAt: Date.now() + CONSENT_LIFETIME_MS,
    };
    const sealed = sealConsent(consent);
    if (sealed.length > 3800) throw new OAuthError("invalid_request");
    const response = NextResponse.redirect(
      new URL(`/oauth/consent?request=${consent.nonce}`, oauthConfig().issuer),
      303,
    );
    const options = {
      httpOnly: true,
      secure: oauthConfig().issuer.startsWith("https:"),
      sameSite: "lax" as const,
      path: "/oauth",
      maxAge: CONSENT_LIFETIME_MS / 1000,
    };
    response.cookies.set(BROWSER_COOKIE, browser, options);
    response.cookies.set(consentCookie(consent.nonce), sealed, options);
    response.headers.set("cache-control", "no-store");
    return response;
  } catch (error) {
    if (trustedRedirect && error instanceof OAuthError)
      return NextResponse.redirect(
        authorizationRedirect(trustedRedirect, { error: error.code }),
        { status: 303, headers: noStoreHeaders },
      );
    return oauthFailure(error);
  }
}

export async function postConsent(request: Request) {
  let consent: Consent | undefined;
  try {
    sameOrigin(request);
    const limited = await limitOAuth(request, "consent", 20);
    if (limited) return limited;
    const session = await requireSessionUser();
    if (!session.ok)
      throw new OAuthError(
        session.error === "UNAUTHORIZED"
          ? "login_required"
          : "temporarily_unavailable",
        session.error === "UNAUTHORIZED" ? 401 : 503,
      );
    const params = await formBody(request, ["scope"]);
    consent = await readBrowserConsent(required(params, "request", 36));
    // Bind submission to the account shown on the consent screen.
    const jar = await cookies();
    const displayed = openConsent(
      required(params, "consent", 12000),
      jar.get(BROWSER_COOKIE)?.value,
    );
    if (
      displayed.nonce !== consent.nonce ||
      displayed.userUuid !== session.data.userUuid
    )
      throw new OAuthError("invalid_request");
    const metadata = await resolveClientMetadata(consent.clientId);
    if (
      !redirectAllowed(consent.redirectUri, metadata.redirect_uris) ||
      metadata.client_name !== consent.clientName
    )
      throw new OAuthError("invalid_client");
    const selected = params
      .getAll("scope")
      .flatMap((value) => value.split(" "))
      .filter(Boolean);
    if (params.get("decision") !== "approve" || !selected.length)
      throw new OAuthError("access_denied");
    const code = await authorizeConnection(
      session.data.userUuid,
      consent,
      selected,
    );
    const response = NextResponse.redirect(
      authorizationRedirect(consent, { code }),
      { status: 303, headers: noStoreHeaders },
    );
    response.cookies.set(consentCookie(consent.nonce), "", {
      path: "/oauth",
      maxAge: 0,
    });
    return response;
  } catch (error) {
    if (consent && error instanceof OAuthError) {
      const response = NextResponse.redirect(
        authorizationRedirect(consent, { error: error.code }),
        { status: 303, headers: noStoreHeaders },
      );
      response.cookies.set(consentCookie(consent.nonce), "", {
        path: "/oauth",
        maxAge: 0,
      });
      return response;
    }
    return oauthFailure(error);
  }
}

export async function postToken(request: Request) {
  let response: Response;
  try {
    const limited = await limitOAuth(request, "token", 60);
    if (limited) return cors(request, limited);
    const params = await formBody(request);
    if (
      request.headers.has("authorization") ||
      params.has("client_secret") ||
      params.has("client_assertion")
    )
      throw new OAuthError("invalid_client");
    const clientId = required(params, "client_id"),
      resource = required(params, "resource");
    const grant = required(params, "grant_type");
    let result;
    if (grant === "authorization_code")
      result = await exchangeCode({
        clientId,
        resource,
        code: required(params, "code"),
        redirectUri: required(params, "redirect_uri"),
        verifier: required(params, "code_verifier", 128),
      });
    else if (grant === "refresh_token")
      result = await exchangeRefresh({
        clientId,
        resource,
        refreshToken: required(params, "refresh_token"),
        scope: params.get("scope") ?? undefined,
      });
    else throw new OAuthError("unsupported_grant_type");
    response = NextResponse.json(result, { headers: noStoreHeaders });
  } catch (error) {
    response = oauthFailure(error);
  }
  return cors(request, response);
}

export async function getConnections() {
  try {
    const session = await requireSessionUser();
    if (!session.ok)
      throw new OAuthError(
        session.error === "UNAUTHORIZED"
          ? "login_required"
          : "temporarily_unavailable",
        session.error === "UNAUTHORIZED" ? 401 : 503,
      );
    return NextResponse.json(await listConnections(session.data.userUuid), {
      headers: noStoreHeaders,
    });
  } catch (error) {
    return oauthFailure(error);
  }
}

export async function removeConnection(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    sameOrigin(request);
    const session = await requireSessionUser();
    if (!session.ok)
      throw new OAuthError(
        session.error === "UNAUTHORIZED"
          ? "login_required"
          : "temporarily_unavailable",
        session.error === "UNAUTHORIZED" ? 401 : 503,
      );
    const { id } = await context.params;
    if (!/^[0-9a-f-]{36}$/.test(id)) throw new OAuthError("invalid_request");
    const result = await revokeConnection(session.data.userUuid, id);
    return NextResponse.json(
      { revoked: result.count > 0 },
      { status: result.count ? 200 : 404, headers: noStoreHeaders },
    );
  } catch (error) {
    return oauthFailure(error);
  }
}
