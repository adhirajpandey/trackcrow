/** Run with OAUTH_TEST_DATABASE_URL pointing to a disposable, migrated database. */
const mockVerifyIdToken = jest.fn();
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn(() => ({
    verifyIdToken: (...args: unknown[]) => mockVerifyIdToken(...args),
  })),
}));
jest.mock("@/server/api/logging", () => ({
  ...jest.requireActual("@/server/api/logging"),
  withRouteLogging: (handler: unknown) => handler,
}));
jest.mock("@/server/auth/session", () => ({
  requireSessionUser: jest.fn(async () => ({ ok: false, error: "UNAUTHORIZED" })),
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

import { randomUUID } from "node:crypto";

import { GET as getTransactions } from "@/app/api/transactions/route";
import { DELETE as deleteSession } from "@/app/api/mobile/auth/session/route";
import { POST as postGoogle } from "@/app/api/mobile/auth/google/route";
import { ApiTokenScope, type PrismaClient } from "@/generated/prisma-rewrite";
import prismaInstance from "@/lib/prisma-rewrite";
import { hashApiToken } from "@/server/modules/api-tokens/service";

const prisma = prismaInstance as unknown as PrismaClient;
const databaseUrl = process.env.OAUTH_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
let databaseValidated = false;
const runId = randomUUID();
const existingEmail = `existing-${runId}@mobile-test.example`;
const newEmail = `new-${runId}@mobile-test.example`;
const createdEmails = [existingEmail, newEmail];

async function signIn(payload: Record<string, unknown>) {
  mockVerifyIdToken.mockResolvedValue({ getPayload: () => payload });
  const response = await postGoogle(
    new Request("http://localhost/api/mobile/auth/google", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ idToken: "google-id-token" }),
    }),
    undefined,
  );
  return { status: response.status, body: await response.json() };
}

function withToken(url: string, token: string, method = "GET") {
  return new Request(url, { method, headers: { authorization: `Bearer ${token}` } });
}

async function tokenRecord(token: string) {
  return prisma.apiToken.findUniqueOrThrow({ where: { tokenHash: hashApiToken(token) } });
}

describeDatabase("mobile Google sign-in on PostgreSQL", () => {
  beforeAll(async () => {
    const url = new URL(databaseUrl!);
    if (!["localhost", "127.0.0.1"].includes(url.hostname) || !url.pathname.includes("oauth_test"))
      throw new Error("Mobile auth tests require a local disposable oauth_test database");
    process.env.GOOGLE_CLIENT_ID = "web-client.apps.googleusercontent.com";
    databaseValidated = true;
  });

  afterAll(async () => {
    if (databaseValidated) {
      await prisma.user.deleteMany({ where: { email: { in: createdEmails } } });
    }
    await prisma.$disconnect();
  });

  it("resolves an existing email to the same user as web sign-in", async () => {
    const existing = await prisma.user.create({
      data: { email: existingEmail, name: "Existing", provider: "google" },
    });

    const { status, body } = await signIn({ email: existingEmail, email_verified: true, name: "Existing" });

    expect(status).toBe(200);
    expect(body.user).toEqual({ name: "Existing", email: existingEmail });
    const record = await tokenRecord(body.token);
    expect(record.userUuid).toBe(existing.uuid);
    expect(record.label).toBe("Android app");
    expect(record.scopes).toEqual([ApiTokenScope.TRANSACTIONS_READ, ApiTokenScope.TRANSACTIONS_WRITE]);
    expect(await prisma.user.count({ where: { email: existingEmail } })).toBe(1);
  });

  it("creates a new user with default categories", async () => {
    const { status, body } = await signIn({ email: newEmail, email_verified: true, name: "New" });

    expect(status).toBe(200);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: newEmail } });
    expect((await tokenRecord(body.token)).userUuid).toBe(user.uuid);
    expect(await prisma.category.count({ where: { userUuid: user.uuid } })).toBeGreaterThan(0);
  });

  it("creates no user or token for a verified token without an email", async () => {
    const [users, tokens] = await Promise.all([prisma.user.count(), prisma.apiToken.count()]);

    const { status } = await signIn({ sub: "no-email", email_verified: true });

    expect(status).toBe(401);
    expect(await prisma.user.count()).toBe(users);
    expect(await prisma.apiToken.count()).toBe(tokens);
  });

  it("signs out by revoking only the presented token", async () => {
    const first = await signIn({ email: existingEmail, email_verified: true, name: "Existing" });
    const second = await signIn({ email: existingEmail, email_verified: true, name: "Existing" });
    const transactionsUrl = "http://localhost/api/transactions?page=1&size=1";

    const response = await deleteSession(
      withToken("http://localhost/api/mobile/auth/session", first.body.token, "DELETE"),
      undefined,
    );

    expect(response.status).toBe(204);
    expect((await tokenRecord(first.body.token)).revokedAt).not.toBeNull();
    expect((await tokenRecord(second.body.token)).revokedAt).toBeNull();
    expect((await getTransactions(withToken(transactionsUrl, first.body.token), undefined)).status).toBe(401);
    expect((await getTransactions(withToken(transactionsUrl, second.body.token), undefined)).status).toBe(200);
    const again = await deleteSession(
      withToken("http://localhost/api/mobile/auth/session", first.body.token, "DELETE"),
      undefined,
    );
    expect(again.status).toBe(401);
  });
});
