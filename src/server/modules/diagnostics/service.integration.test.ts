/** Run against a disposable local database after pnpm test:db. */
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
import prisma from "@/lib/prisma-rewrite";
import { saveDiagnosticReport } from "./service";
import { importSmsTransaction } from "@/server/modules/imports/service";
import { SMS_CONFIG_VERSION } from "@/common/sms-templates";

const databaseUrl = process.env.OAUTH_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const users: string[] = [];

describeDatabase("diagnostic reports on PostgreSQL", () => {
  beforeAll(() => {
    const url = new URL(databaseUrl!);
    if (
      !["localhost", "127.0.0.1"].includes(url.hostname) ||
      !url.pathname.includes("oauth_test")
    ) {
      throw new Error("Tests require a local disposable oauth_test database");
    }
  });
  afterAll(async () => {
    for (const uuid of users) {
      await prisma.user.delete({ where: { uuid } });
      await prisma.rateLimitBucket.deleteMany({
        where: { key: `diagnostics:${uuid}` },
      });
    }
    await prisma.$disconnect();
  });
  async function newUser() {
    const user = await prisma.user.create({
      data: {
        email: `${randomUUID()}@diagnostics.example`,
        name: "Diagnostics test",
        provider: "test",
      },
    });
    users.push(user.uuid);
    return user.uuid;
  }
  const input = {
    kind: "report" as const,
    appVersion: "0.1.0",
    versionCode: 3,
    device: { androidVersion: "16" },
    entries: [],
  };

  it("allows only ten concurrent reports, isolates users and resets expired windows", async () => {
    const userUuid = await newUser();
    const results = await Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        saveDiagnosticReport(userUuid, {
          ...input,
          kind: i % 2 ? "bank_request" : "report",
        }),
      ),
    );
    expect(
      results.filter((result) => result.status === "created"),
    ).toHaveLength(10);
    expect(
      results.filter((result) => result.status === "limited"),
    ).toHaveLength(2);
    expect(await prisma.diagnosticReport.count({ where: { userUuid } })).toBe(
      10,
    );
    expect((await saveDiagnosticReport(await newUser(), input)).status).toBe(
      "created",
    );
    await prisma.rateLimitBucket.update({
      where: { key: `diagnostics:${userUuid}` },
      data: { expiresAt: new Date(0) },
    });
    expect((await saveDiagnosticReport(userUuid, input)).status).toBe(
      "created",
    );
  });

  it("stores parser provenance even when SMS body storage is disabled or parsing fails", async () => {
    const userUuid = await newUser();
    const messages = [
      [
        "Sent Rs.90.00 from Kotak Bank AC X5213 to example@upi on 16-09-25.UPI Ref 525982708197.",
        "KOTAK_UPI",
      ],
      [
        "Sent Rs.90.00\nFrom HDFC Bank A/C 1234\nTo example@upi\nOn 12/06/26\nRef 123456789012",
        "HDFC_UPI_FORMATTED",
      ],
      ["Unsupported message", null],
    ];
    for (const [message, parserName] of messages) {
      const idempotencyKey = randomUUID();
      await importSmsTransaction({
        userUuid,
        message: message!,
        idempotencyKey,
        storeMessageBody: false,
      });
      const row = await prisma.rawMessage.findFirstOrThrow({
        where: { userUuid, idempotencyKey },
      });
      expect(row.body).toBeNull();
      expect(row.parsedPayload).toMatchObject({
        parserName,
        configVersion: SMS_CONFIG_VERSION,
      });
    }
  });

  it("cascades reports when their user is deleted", async () => {
    const userUuid = await newUser();
    await saveDiagnosticReport(userUuid, input);
    await prisma.user.delete({ where: { uuid: userUuid } });
    users.splice(users.indexOf(userUuid), 1);
    await prisma.rateLimitBucket.deleteMany({
      where: { key: `diagnostics:${userUuid}` },
    });
    expect(await prisma.diagnosticReport.count({ where: { userUuid } })).toBe(
      0,
    );
  });
});
