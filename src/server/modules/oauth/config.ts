export const OAUTH_SCOPES = [
  "transactions:read",
  "transactions:write",
] as const;
export const CODE_LIFETIME_MS = 5 * 60_000;
export const ACCESS_LIFETIME_MS = 60 * 60_000;
export const CONNECTION_LIFETIME_MS = 90 * 86_400_000;
export const CONSENT_LIFETIME_MS = 10 * 60_000;

export function oauthConfig() {
  const value = process.env.OAUTH_ISSUER_URL;
  if (!value) throw new Error("OAUTH_ISSUER_URL is required");
  const url = new URL(value);
  const local =
    process.env.NODE_ENV !== "production" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    (url.protocol !== "https:" && !(local && url.protocol === "http:")) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname !== "/"
  ) {
    throw new Error("OAUTH_ISSUER_URL must be an HTTPS origin");
  }
  return {
    issuer: url.origin,
    resource: `${url.origin}/mcp`,
    metadata: `${url.origin}/.well-known/oauth-protected-resource/mcp`,
  };
}

export function resourceMetadata() {
  const { issuer, resource } = oauthConfig();
  return {
    resource,
    authorization_servers: [issuer],
    scopes_supported: OAUTH_SCOPES,
    bearer_methods_supported: ["header"],
  };
}

export function authorizationMetadata() {
  const { issuer } = oauthConfig();
  return {
    issuer,
    authorization_endpoint: `${issuer}/oauth/authorize`,
    token_endpoint: `${issuer}/oauth/token`,
    response_types_supported: ["code"],
    grant_types_supported: ["authorization_code", "refresh_token"],
    token_endpoint_auth_methods_supported: ["none"],
    code_challenge_methods_supported: ["S256"],
    scopes_supported: OAUTH_SCOPES,
    client_id_metadata_document_supported: true,
  };
}
