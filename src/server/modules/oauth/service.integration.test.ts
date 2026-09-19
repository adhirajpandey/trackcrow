/** Run with OAUTH_TEST_DATABASE_URL pointing to a disposable, migrated database. */
jest.mock("@/server/api/logging", () => ({
  withRouteLogging: (handler: unknown) => handler,
}));
jest.mock("@/lib/prisma-rewrite", () => {
  const { PrismaClient } = jest.requireActual("@/generated/prisma-rewrite");
  return {
    __esModule: true,
    default: new PrismaClient({
      datasourceUrl:
        process.env.OAUTH_TEST_DATABASE_URL ??
        "postgresql://unused:unused@127.0.0.1:1/unused",
    }),
  };
});

import { createHash, randomUUID } from "node:crypto";
import { ApiTokenScope, type PrismaClient } from "@/generated/prisma-rewrite";
import prismaInstance from "@/lib/prisma-rewrite";
import {
  createApiToken,
  resolveApiToken,
} from "@/server/modules/api-tokens/service";
import { resolveMcpToken } from "@/server/mcp/auth";
import { POST as mcpPost } from "@/app/mcp/route";
import { hashCredential } from "./crypto";
import {
  authorizeConnection,
  exchangeCode,
  exchangeRefresh,
  listConnections,
  resolveOAuthAccessToken,
  revokeConnection,
} from "./service";
import { CONNECTION_LIFETIME_MS } from "./config";
import type { Consent } from "./schemas";

const prisma = prismaInstance as unknown as PrismaClient;
const databaseUrl = process.env.OAUTH_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
let databaseValidated = false;
const userUuid = randomUUID(),
  otherUserUuid = randomUUID();
const verifier = "test-verifier-".repeat(5);
const clientId = "https://client.example/metadata.json",
  resource = "https://trackcrow.example/mcp",
  redirectUri = "http://127.0.0.1:4321/callback";
function consent(
  scopes: Consent["scopes"] = ["transactions:read", "transactions:write"],
): Consent {
  return {
    clientId,
    clientName: "Original client name",
    resource,
    redirectUri,
    scopes,
    codeChallenge: createHash("sha256").update(verifier).digest("base64url"),
    nonce: randomUUID(),
    browserHash: "test",
    expiresAt: Date.now() + 600000,
  };
}
async function grant(selected = ["transactions:read"]) {
  const code = await authorizeConnection(userUuid, consent(), selected);
  const tokens = await exchangeCode({
    code,
    clientId,
    resource,
    redirectUri,
    verifier,
  });
  const record = await prisma.oAuthAccessToken.findUniqueOrThrow({
    where: { tokenHash: hashCredential(tokens.access_token) },
    include: { connection: true },
  });
  return { ...tokens, record, connection: record.connection };
}
async function tool(token: string, name: string, args: object = {}) {
  const response = await mcpPost(
    new Request(resource, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
        accept: "application/json, text/event-stream",
        "mcp-protocol-version": "2025-03-26",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    }),
    undefined,
  );
  const text = await response.text();
  const body =
    text.startsWith("event:") || text.startsWith("data:")
      ? JSON.parse(
          text
            .split("\n")
            .find((line) => line.startsWith("data:"))!
            .slice(5),
        )
      : JSON.parse(text);
  return { status: response.status, body };
}

describeDatabase("OAuth lifecycle on PostgreSQL", () => {
  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (
      !["localhost", "127.0.0.1"].includes(url.hostname) ||
      !url.pathname.includes("oauth_test")
    )
      throw new Error(
        "OAuth tests require a local disposable oauth_test database",
      );
    process.env.OAUTH_ISSUER_URL = "https://trackcrow.example";
    databaseValidated = true;
    await prisma.user.createMany({
      data: [userUuid, otherUserUuid].map((uuid) => ({
        uuid,
        email: `${uuid}@oauth-test.example`,
        name: "OAuth test",
        provider: "test",
      })),
    });
  });
  afterAll(async () => {
    if (!databaseValidated) {
      await prisma.$disconnect();
      return;
    }
    await prisma.transaction.deleteMany({
      where: { userUuid: { in: [userUuid, otherUserUuid] } },
    });
    await prisma.user.deleteMany({
      where: { uuid: { in: [userUuid, otherUserUuid] } },
    });
    await prisma.$disconnect();
  });

  it.each([
    ["transactions:read"],
    ["transactions:write"],
    ["transactions:read", "transactions:write"],
  ])("issues only selected scopes: %j", async (...selected) => {
    const tokens = await grant(selected);
    expect(tokens.scope).toBe(selected.join(" "));
    expect(tokens.connection.scopes).toEqual(
      selected.map((scope) =>
        scope === "transactions:read"
          ? ApiTokenScope.TRANSACTIONS_READ
          : ApiTokenScope.TRANSACTIONS_WRITE,
      ),
    );
    expect(
      tokens.connection.expiresAt.getTime() -
        tokens.connection.createdAt.getTime(),
    ).toBe(CONNECTION_LIFETIME_MS);
    expect(tokens.record.tokenHash).not.toBe(tokens.access_token);
    const identity = await resolveMcpToken(tokens.access_token);
    expect(identity).toMatchObject({
      ok: true,
      data: {
        userUuid,
        tokenUuid: tokens.record.uuid,
        connectionUuid: tokens.connection.uuid,
      },
    });
    expect(tokens.record.uuid).not.toBe(tokens.connection.uuid);
  });

  it("rejects empty consent, unrequested permissions, and SMS", async () => {
    await expect(authorizeConnection(userUuid, consent(), [])).rejects.toThrow(
      "access_denied",
    );
    await expect(
      authorizeConnection(userUuid, consent(["transactions:read"]), [
        "transactions:write",
      ]),
    ).rejects.toThrow("invalid_scope");
    await expect(
      authorizeConnection(userUuid, consent(), ["sms:import"]),
    ).rejects.toThrow("invalid_scope");
  });

  it("consumes consent only once, rolling back the duplicate connection", async () => {
    const request = consent();
    await authorizeConnection(userUuid, request, ["transactions:read"]);
    const count = await prisma.oAuthConnection.count({ where: { userUuid } });
    await expect(
      authorizeConnection(userUuid, request, ["transactions:read"]),
    ).rejects.toThrow("invalid_request");
    expect(await prisma.oAuthConnection.count({ where: { userUuid } })).toBe(
      count,
    );
  });

  it("validates PKCE, client, redirect and resource without burning valid codes", async () => {
    const code = await authorizeConnection(userUuid, consent(), [
      "transactions:read",
    ]);
    const input = { code, clientId, resource, redirectUri, verifier };
    for (const changed of [
      { verifier: "x".repeat(43) },
      { clientId: "https://other.example/doc" },
      { redirectUri: "http://127.0.0.1:9999/callback" },
      { resource: "https://other.example/mcp" },
    ])
      await expect(exchangeCode({ ...input, ...changed })).rejects.toThrow(
        "invalid_grant",
      );
    await expect(exchangeCode(input)).resolves.toHaveProperty("access_token");
    await expect(exchangeCode(input)).rejects.toThrow("invalid_grant");
  });

  it("permits only one concurrent code redemption", async () => {
    const code = await authorizeConnection(userUuid, consent(), [
      "transactions:read",
    ]);
    const input = { code, clientId, resource, redirectUri, verifier };
    const results = await Promise.allSettled([
      exchangeCode(input),
      exchangeCode(input),
    ]);
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
  });

  it("rejects expired codes and access tokens", async () => {
    const code = await authorizeConnection(userUuid, consent(), [
      "transactions:read",
    ]);
    await prisma.oAuthAuthorizationCode.update({
      where: { codeHash: hashCredential(code) },
      data: { expiresAt: new Date(0) },
    });
    await expect(
      exchangeCode({ code, clientId, resource, redirectUri, verifier }),
    ).rejects.toThrow("invalid_grant");
    const tokens = await grant();
    await prisma.oAuthAccessToken.update({
      where: { uuid: tokens.record.uuid },
      data: { expiresAt: new Date(0) },
    });
    expect(await resolveOAuthAccessToken(tokens.access_token)).toMatchObject({
      ok: false,
      error: "UNAUTHORIZED",
    });
  });

  it("rotates with lineage, preserves snapshots and deadline, narrows but never expands", async () => {
    const tokens = await grant(["transactions:read", "transactions:write"]);
    const next = await exchangeRefresh({
      refreshToken: tokens.refresh_token,
      clientId,
      resource,
      scope: "transactions:read",
    });
    expect(next.scope).toBe("transactions:read");
    const old = await prisma.oAuthRefreshToken.findUniqueOrThrow({
      where: { tokenHash: hashCredential(tokens.refresh_token) },
      include: { replacedBy: true },
    });
    expect(old.usedAt).not.toBeNull();
    expect(old.replacedBy?.tokenHash).toBe(hashCredential(next.refresh_token));
    expect(old.replacedBy?.expiresAt).toEqual(tokens.connection.expiresAt);
    const unchanged = await prisma.oAuthConnection.findUniqueOrThrow({
      where: { uuid: tokens.connection.uuid },
    });
    expect(unchanged).toEqual(tokens.connection);
    await expect(
      exchangeRefresh({
        refreshToken: next.refresh_token,
        clientId,
        resource,
        scope: "transactions:read transactions:write",
      }),
    ).rejects.toThrow("invalid_scope");
    await expect(
      exchangeRefresh({
        refreshToken: next.refresh_token,
        clientId,
        resource,
        scope: "sms:import",
      }),
    ).rejects.toThrow("invalid_scope");
    const final = await exchangeRefresh({
      refreshToken: next.refresh_token,
      clientId,
      resource,
    });
    expect(final.scope).toBe("transactions:read");
    await expect(
      exchangeRefresh({
        refreshToken: tokens.refresh_token,
        clientId,
        resource,
      }),
    ).rejects.toThrow("invalid_grant");
    expect(await resolveOAuthAccessToken(final.access_token)).toMatchObject({
      ok: false,
      error: "UNAUTHORIZED",
    });
    expect(await resolveOAuthAccessToken(tokens.access_token)).toMatchObject({
      ok: false,
      error: "UNAUTHORIZED",
    });
    await expect(
      exchangeRefresh({
        refreshToken: final.refresh_token,
        clientId,
        resource,
      }),
    ).rejects.toThrow("invalid_grant");
  });

  it("revokes the connection when concurrent refresh reuses a token", async () => {
    const tokens = await grant();
    const input = { refreshToken: tokens.refresh_token, clientId, resource };
    const results = await Promise.allSettled([
      exchangeRefresh(input),
      exchangeRefresh(input),
    ]);
    const success = results.find((result) => result.status === "fulfilled");
    expect(
      results.filter((result) => result.status === "fulfilled"),
    ).toHaveLength(1);
    if (success?.status === "fulfilled")
      expect(
        await resolveOAuthAccessToken(success.value.access_token),
      ).toMatchObject({ ok: false, error: "UNAUTHORIZED" });
  });

  it("caps access lifetime at the fixed connection deadline", async () => {
    const tokens = await grant();
    const deadline = new Date(Date.now() + 30_000);
    await prisma.oAuthConnection.update({
      where: { uuid: tokens.connection.uuid },
      data: { expiresAt: deadline },
    });
    const next = await exchangeRefresh({
      refreshToken: tokens.refresh_token,
      clientId,
      resource,
    });
    expect(next.expires_in).toBeLessThanOrEqual(30);
    const access = await prisma.oAuthAccessToken.findUniqueOrThrow({
      where: { tokenHash: hashCredential(next.access_token) },
    });
    expect(access.expiresAt).toEqual(deadline);
    await prisma.oAuthConnection.update({
      where: { uuid: tokens.connection.uuid },
      data: { expiresAt: new Date(0) },
    });
    await expect(
      exchangeRefresh({ refreshToken: next.refresh_token, clientId, resource }),
    ).rejects.toThrow("invalid_grant");
  });

  it("updates last use on access, at most once per ten minutes", async () => {
    const tokens = await grant();
    expect(tokens.connection.lastUsedAt).toBeNull();
    await exchangeRefresh({
      refreshToken: tokens.refresh_token,
      clientId,
      resource,
    });
    expect(
      (
        await prisma.oAuthConnection.findUniqueOrThrow({
          where: { uuid: tokens.connection.uuid },
        })
      ).lastUsedAt,
    ).toBeNull();
    await resolveOAuthAccessToken(tokens.access_token);
    const first = await prisma.oAuthConnection.findUniqueOrThrow({
      where: { uuid: tokens.connection.uuid },
    });
    await resolveOAuthAccessToken(tokens.access_token);
    expect(
      (
        await prisma.oAuthConnection.findUniqueOrThrow({
          where: { uuid: tokens.connection.uuid },
        })
      ).lastUsedAt,
    ).toEqual(first.lastUsedAt);
    await prisma.oAuthConnection.update({
      where: { uuid: tokens.connection.uuid },
      data: { lastUsedAt: new Date(Date.now() - 11 * 60_000) },
    });
    await resolveOAuthAccessToken(tokens.access_token);
    expect(
      (
        await prisma.oAuthConnection.findUniqueOrThrow({
          where: { uuid: tokens.connection.uuid },
        })
      ).lastUsedAt!.getTime(),
    ).toBeGreaterThanOrEqual(first.lastUsedAt!.getTime());
  });

  it("scopes listing/revocation to the owner and immediately invalidates grants", async () => {
    const tokens = await grant();
    expect(await listConnections(otherUserUuid)).toEqual([]);
    expect(
      (await revokeConnection(otherUserUuid, tokens.connection.uuid)).count,
    ).toBe(0);
    expect((await resolveOAuthAccessToken(tokens.access_token)).ok).toBe(true);
    expect(
      (await revokeConnection(userUuid, tokens.connection.uuid)).count,
    ).toBe(1);
    expect((await resolveOAuthAccessToken(tokens.access_token)).ok).toBe(false);
    await expect(
      exchangeRefresh({
        refreshToken: tokens.refresh_token,
        clientId,
        resource,
      }),
    ).rejects.toThrow("invalid_grant");
    const code = await authorizeConnection(userUuid, consent(), [
      "transactions:read",
    ]);
    const pending = await prisma.oAuthAuthorizationCode.findUniqueOrThrow({
      where: { codeHash: hashCredential(code) },
    });
    await revokeConnection(userUuid, pending.connectionUuid);
    await expect(
      exchangeCode({ code, clientId, resource, redirectUri, verifier }),
    ).rejects.toThrow("invalid_grant");
  });

  it("preserves PAT resolution and never accepts OAuth tokens in the SMS/PAT resolver", async () => {
    const tokens = await grant();
    expect(await resolveApiToken(tokens.access_token)).toMatchObject({
      ok: false,
      error: "UNAUTHORIZED",
    });
    const pat = await createApiToken({
      userUuid,
      label: "OAuth regression test",
      scopes: [ApiTokenScope.TRANSACTIONS_READ],
    });
    expect(pat.ok).toBe(true);
    if (!pat.ok) return;
    expect(await resolveMcpToken(pat.data.token)).toMatchObject({
      ok: true,
      data: { userUuid, tokenUuid: pat.data.record.uuid },
    });
    const response = await tool(pat.data.token, "list_categories");
    expect(response.status).toBe(200);
    expect(response.body.result.isError).not.toBe(true);
  });

  it("enforces actual MCP tool scopes and isolates user data", async () => {
    await prisma.category.createMany({
      data: [
        { userUuid, name: "Own category" },
        { userUuid: otherUserUuid, name: "Private other category" },
      ],
    });
    const tokens = await grant();
    const response = await tool(tokens.access_token, "list_categories");
    expect(response.status).toBe(200);
    const data = JSON.stringify(response.body);
    expect(data).toContain("Own category");
    expect(data).not.toContain("Private other category");
    const denied = await tool(tokens.access_token, "categorize_transaction", {
      transactionUuid: randomUUID(),
      categoryUuid: null,
      subcategoryUuid: null,
    });
    expect(denied.body.result.isError).toBe(true);
    expect(JSON.stringify(denied.body)).toContain("required permission");
  });

  it("prevents a read/write OAuth token from reading or changing another user's transactions", async () => {
    const otherRecipient = await prisma.recipient.create({
      data: {
        userUuid: otherUserUuid,
        displayName: "Other recipient",
        normalizedName: "other recipient",
      },
    });
    const otherTransaction = await prisma.transaction.create({
      data: {
        userUuid: otherUserUuid,
        recipientId: otherRecipient.id,
        recipientRaw: "Other recipient",
        amount: 42,
        source: "MANUAL",
        timestamp: new Date(),
      },
    });
    const tokens = await grant(["transactions:read", "transactions:write"]);
    const read = await tool(tokens.access_token, "search_transactions");
    expect(read.body.result.isError).not.toBe(true);
    expect(JSON.stringify(read.body)).not.toContain(otherTransaction.uuid);
    const write = await tool(tokens.access_token, "categorize_transaction", {
      transactionUuid: otherTransaction.uuid,
      categoryUuid: null,
    });
    expect(write.body.result.isError).toBe(true);
    const unchanged = await prisma.transaction.findUniqueOrThrow({
      where: { uuid: otherTransaction.uuid },
    });
    expect(unchanged.updatedAt).toEqual(otherTransaction.updatedAt);
  });
});
