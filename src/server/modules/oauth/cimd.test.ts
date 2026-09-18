import {
  clientMetadataUrl,
  isPublicAddress,
  redirectAllowed,
  validateMetadata,
} from "./cimd";

describe("CIMD validation", () => {
  const clientId = "https://client.example/oauth/metadata.json";
  const metadata = {
    client_id: clientId,
    client_name: "Test client",
    redirect_uris: [
      "https://client.example/callback",
      "http://127.0.0.1:4321/callback",
    ],
    token_endpoint_auth_method: "none",
  };
  it.each([
    "127.0.0.1",
    "10.1.2.3",
    "172.16.1.1",
    "192.168.1.1",
    "169.254.169.254",
    "0.0.0.0",
    "100.64.0.1",
    "224.0.0.1",
    "::1",
    "::",
    "fe80::1",
    "fc00::1",
    "::ffff:127.0.0.1",
    "::ffff:8.8.8.8",
    "2002:7f00:1::",
  ])("rejects nonpublic or transition address %s", (address) =>
    expect(isPublicAddress(address)).toBe(false),
  );
  it.each(["8.8.8.8", "1.1.1.1", "2606:4700:4700::1111"])(
    "accepts public address %s",
    (address) => expect(isPublicAddress(address)).toBe(true),
  );
  it.each([
    "http://client.example/doc",
    "https://client.example",
    "https://user:pass@client.example/doc",
    "https://client.example/doc#fragment",
    "https://client.example/a/../doc",
    "https://client.example/a/%2e%2e/doc",
  ])("rejects invalid client ID %s", (value) =>
    expect(() => clientMetadataUrl(value)).toThrow("invalid_client"),
  );
  it("validates identity and public-client metadata", () => {
    expect(clientMetadataUrl("https://client.example/").pathname).toBe("/");
    expect(validateMetadata(clientId, metadata)).toEqual(metadata);
    expect(
      validateMetadata(clientId, {
        ...metadata,
        grant_types: [
          "authorization_code",
          "refresh_token",
          "urn:ietf:params:oauth:grant-type:device_code",
        ],
      }),
    ).toHaveProperty("client_id", clientId);
    for (const changed of [
      { client_id: clientId + "?other" },
      { token_endpoint_auth_method: "private_key_jwt" },
      { client_secret: "secret" },
      { client_name: "" },
      { redirect_uris: ["http://evil.example/cb"] },
      { grant_types: ["client_credentials"] },
    ])
      expect(() =>
        validateMetadata(clientId, { ...metadata, ...changed }),
      ).toThrow("invalid_client");
  });
  it("matches redirects exactly except loopback IP ports", () => {
    expect(
      redirectAllowed(
        "http://127.0.0.1:9876/other/../callback",
        metadata.redirect_uris,
      ),
    ).toBe(false);
    expect(
      redirectAllowed("http://127.0.0.1:9876/callback", metadata.redirect_uris),
    ).toBe(true);
    expect(
      redirectAllowed(
        "https://client.example/callback",
        metadata.redirect_uris,
      ),
    ).toBe(true);
    for (const uri of [
      "https://client.example/callback/",
      "https://client.example/callback?extra=1",
      "https://evil.example/callback",
      "http://localhost:4321/callback",
      "http://127.0.0.1:4321/other",
    ])
      expect(redirectAllowed(uri, metadata.redirect_uris)).toBe(false);
  });
});
