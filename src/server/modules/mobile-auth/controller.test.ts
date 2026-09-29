const mockVerifyIdToken = jest.fn();
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
  })),
}));

jest.mock("@/server/modules/users/service", () => ({
  ensureUserBootstrap: jest.fn(),
}));

jest.mock("@/server/modules/api-tokens/service", () => ({
  createApiToken: jest.fn(),
  resolveApiToken: jest.fn(),
  revokeApiToken: jest.fn(),
}));

import { ApiTokenScope } from "@/generated/prisma-rewrite";
import {
  createApiToken,
  resolveApiToken,
  revokeApiToken,
} from "@/server/modules/api-tokens/service";
import { ensureUserBootstrap } from "@/server/modules/users/service";

import { deleteMobileSession, getGoogleConfig, postGoogleSignIn } from "./controller";

const ensureUserBootstrapMock = jest.mocked(ensureUserBootstrap);
const createApiTokenMock = jest.mocked(createApiToken);
const resolveApiTokenMock = jest.mocked(resolveApiToken);
const revokeApiTokenMock = jest.mocked(revokeApiToken);

const CLIENT_ID = "web-client.apps.googleusercontent.com";

function googlePayload(payload: Record<string, unknown>) {
  mockVerifyIdToken.mockResolvedValue({ getPayload: () => payload });
}

function signInRequest(body: unknown) {
  return new Request("http://localhost/api/mobile/auth/google", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

function sessionRequest(authorization?: string) {
  return new Request("http://localhost/api/mobile/auth/session", {
    method: "DELETE",
    headers: authorization ? { authorization } : {},
  });
}

describe("mobile auth controller", () => {
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = CLIENT_ID;
    ensureUserBootstrapMock.mockResolvedValue({
      ok: true,
      data: {
        uuid: "user-1",
        id: 1,
        email: "person@example.com",
        name: "Person",
        image: null,
        subscription: 0,
      },
    });
    createApiTokenMock.mockResolvedValue({
      ok: true,
      data: {
        token: "plain-token",
        record: {
          uuid: "token-1",
          label: "Android app",
          tokenPrefix: "plain-to",
          scopes: [ApiTokenScope.TRANSACTIONS_READ, ApiTokenScope.TRANSACTIONS_WRITE],
          createdAt: new Date(),
          lastUsedAt: null,
          revokedAt: null,
        },
      },
    });
  });

  afterAll(() => {
    delete process.env.GOOGLE_CLIENT_ID;
  });

  it("returns only the web client ID", async () => {
    const response = await getGoogleConfig();

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ webClientId: CLIENT_ID });
  });

  it("returns 503 when the Google client is not configured", async () => {
    delete process.env.GOOGLE_CLIENT_ID;

    expect((await getGoogleConfig()).status).toBe(503);
    expect((await postGoogleSignIn(signInRequest({ idToken: "id-token" }))).status).toBe(503);
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("rejects a token that fails verification", async () => {
    mockVerifyIdToken.mockRejectedValue(new Error("Invalid token signature"));

    const response = await postGoogleSignIn(signInRequest({ idToken: "bad-token" }));

    expect(response.status).toBe(401);
    expect(ensureUserBootstrapMock).not.toHaveBeenCalled();
    expect(createApiTokenMock).not.toHaveBeenCalled();
  });

  it("verifies against the server's web client ID", async () => {
    googlePayload({ email: "person@example.com", email_verified: true, name: "Person" });

    await postGoogleSignIn(signInRequest({ idToken: "id-token" }));

    expect(mockVerifyIdToken).toHaveBeenCalledWith({ idToken: "id-token", audience: CLIENT_ID });
  });

  it("rejects an unverified email", async () => {
    googlePayload({ email: "person@example.com", email_verified: false });

    const response = await postGoogleSignIn(signInRequest({ idToken: "id-token" }));

    expect(response.status).toBe(401);
    expect(ensureUserBootstrapMock).not.toHaveBeenCalled();
    expect(createApiTokenMock).not.toHaveBeenCalled();
  });

  it("rejects a valid token without an email before any write", async () => {
    googlePayload({ sub: "123", email_verified: true });

    const response = await postGoogleSignIn(signInRequest({ idToken: "id-token" }));

    expect(response.status).toBe(401);
    expect(ensureUserBootstrapMock).not.toHaveBeenCalled();
    expect(createApiTokenMock).not.toHaveBeenCalled();
  });

  it("bootstraps the user and mints a read and write Android token", async () => {
    googlePayload({
      email: "person@example.com",
      email_verified: true,
      name: "Person",
      picture: "https://example.com/p.png",
    });

    const response = await postGoogleSignIn(signInRequest({ idToken: "id-token" }));

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      token: "plain-token",
      user: { name: "Person", email: "person@example.com" },
    });
    expect(ensureUserBootstrapMock).toHaveBeenCalledWith({
      email: "person@example.com",
      name: "Person",
      image: "https://example.com/p.png",
      provider: "google",
    });
    expect(createApiTokenMock).toHaveBeenCalledWith({
      userUuid: "user-1",
      label: "Android app",
      scopes: [ApiTokenScope.TRANSACTIONS_READ, ApiTokenScope.TRANSACTIONS_WRITE],
    });
  });

  it("rejects a missing ID token", async () => {
    const response = await postGoogleSignIn(signInRequest({}));

    expect(response.status).toBe(400);
    expect(mockVerifyIdToken).not.toHaveBeenCalled();
  });

  it("revokes only the presented token", async () => {
    resolveApiTokenMock.mockResolvedValue({
      ok: true,
      data: { userUuid: "user-1", tokenUuid: "token-1", scopes: [] },
    });
    revokeApiTokenMock.mockResolvedValue({ ok: true, data: { revoked: true } });

    const response = await deleteMobileSession(sessionRequest("Bearer plain-token"));

    expect(response.status).toBe(204);
    expect(resolveApiTokenMock).toHaveBeenCalledWith("plain-token");
    expect(revokeApiTokenMock).toHaveBeenCalledWith({ userUuid: "user-1", tokenUuid: "token-1" });
  });

  it("rejects session deletion without a valid bearer token", async () => {
    resolveApiTokenMock.mockResolvedValue({ ok: false, error: "UNAUTHORIZED" });

    expect((await deleteMobileSession(sessionRequest())).status).toBe(401);
    expect((await deleteMobileSession(sessionRequest("Bearer revoked"))).status).toBe(401);
    expect(revokeApiTokenMock).not.toHaveBeenCalled();
  });
});
