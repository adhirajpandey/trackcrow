/** Run with OAUTH_TEST_DATABASE_URL pointing to a disposable, migrated local database. */
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

jest.mock("@/common/sms-parser", () => {
  const actual = jest.requireActual("@/common/sms-parser");
  return {
    ...actual,
    matchTransactionMessage: jest.fn(actual.matchTransactionMessage),
  };
});

jest.mock("@/server/modules/transactions/service", () => {
  const actual = jest.requireActual("@/server/modules/transactions/service");
  return { ...actual, createTransaction: jest.fn(actual.createTransaction) };
});

import { randomUUID } from "node:crypto";
import prisma from "@/lib/prisma-rewrite";
import {
  ParseStatus,
  RecipientIdentifierKind,
  RuleActionType,
} from "@/generated/prisma-rewrite";
import * as parser from "@/common/sms-parser";
import * as transactions from "@/server/modules/transactions/service";
import { importSmsTransaction } from "./service";

const databaseUrl = process.env.OAUTH_TEST_DATABASE_URL;
const describeDatabase = databaseUrl ? describe : describe.skip;
const message =
  "Sent Rs.90.00\nFrom HDFC Bank A/C 1234\nTo merchant@upi\nOn 12/06/26\nRef 123456789012";
let userUuid: string | undefined;
let databaseValidated = false;

describeDatabase("SMS idempotency on PostgreSQL", () => {
  beforeAll(() => {
    const url = new URL(databaseUrl!);
    if (
      !["localhost", "127.0.0.1"].includes(url.hostname) ||
      !url.pathname.includes("oauth_test")
    ) {
      throw new Error(
        "SMS tests require a local disposable oauth_test database",
      );
    }
    databaseValidated = true;
  });

  beforeEach(async () => {
    const user = await prisma.user.create({
      data: {
        email: `${randomUUID()}@sms-test.example`,
        name: "SMS test",
        provider: "test",
      },
    });
    userUuid = user.uuid;
  });

  afterEach(async () => {
    jest.restoreAllMocks();
    if (databaseValidated && userUuid) {
      // Rule recipient relations use Restrict, so delete rules before cascading the user.
      await prisma.rule.deleteMany({ where: { userUuid } });
      await prisma.user.delete({ where: { uuid: userUuid } });
      userUuid = undefined;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  function input(idempotencyKey = randomUUID()) {
    return {
      userUuid: userUuid!,
      message,
      idempotencyKey,
      sender: "AX-HDFCBK",
      timestamp: new Date("2026-09-30T10:00:00Z"),
      storeMessageBody: false,
    };
  }

  it("five concurrent uploads create one transaction and return the same UUID", async () => {
    const matched = parser.matchTransactionMessage as jest.Mock;
    const sms = input();
    const results = await Promise.all(
      Array.from({ length: 5 }, () => importSmsTransaction(sms)),
    );
    const created = results.filter(
      (result) => result.ok && result.data.status === "CREATED",
    );
    const duplicates = results.filter(
      (result) => result.ok && result.data.status === "DUPLICATE",
    );
    expect(created).toHaveLength(1);
    expect(duplicates).toHaveLength(4);
    expect(matched).toHaveBeenCalledTimes(1);
    const transaction = await prisma.transaction.findFirstOrThrow({
      where: { userUuid },
    });
    for (const result of results) {
      expect(result).toMatchObject({
        ok: true,
        data: { uuid: transaction.uuid },
      });
    }
    expect(await prisma.transaction.count({ where: { userUuid } })).toBe(1);
    expect(await prisma.rawMessage.count({ where: { userUuid } })).toBe(1);
    expect(
      await prisma.rawMessage.findFirstOrThrow({ where: { userUuid } }),
    ).toMatchObject({
      body: null,
      sender: sms.sender,
      idempotencyKey: sms.idempotencyKey,
      receivedAt: sms.timestamp,
      parserName: expect.any(String),
      parseStatus: ParseStatus.PARSED,
      transactionId: transaction.id,
    });
  });

  it("concurrent unparseable uploads retain one body-free outcome", async () => {
    const sms = { ...input(), message: "unsupported template" };
    const results = await Promise.all(
      Array.from({ length: 3 }, () => importSmsTransaction(sms)),
    );
    expect(
      results.filter(
        (result) => !result.ok && result.error === "UNPROCESSABLE",
      ),
    ).toHaveLength(1);
    expect(
      results.filter(
        (result) => result.ok && result.data.status === "DUPLICATE",
      ),
    ).toHaveLength(2);
    expect(await prisma.transaction.count({ where: { userUuid } })).toBe(0);
    const rows = await prisma.rawMessage.findMany({ where: { userUuid } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      body: null,
      parseStatus: ParseStatus.UNPARSEABLE,
      transactionId: null,
    });
  });

  it("concurrent ignored uploads retain one ignored outcome and no transaction", async () => {
    const recipient = await prisma.recipient.create({
      data: {
        userUuid: userUuid!,
        displayName: "Merchant",
        normalizedName: "merchant",
      },
    });
    await prisma.recipientIdentifier.create({
      data: {
        userUuid: userUuid!,
        recipientId: recipient.id,
        kind: RecipientIdentifierKind.UPI_ID,
        value: "merchant@upi",
        normalizedValue: "merchant@upi",
      },
    });
    await prisma.rule.create({
      data: {
        userUuid: userUuid!,
        recipientId: recipient.id,
        name: "Ignore merchant",
        actionType: RuleActionType.IGNORE,
      },
    });
    const sms = input();
    const results = await Promise.all(
      Array.from({ length: 3 }, () => importSmsTransaction(sms)),
    );
    expect(
      results.filter((result) => result.ok && result.data.status === "IGNORED"),
    ).toHaveLength(1);
    expect(
      results.filter(
        (result) => result.ok && result.data.status === "DUPLICATE",
      ),
    ).toHaveLength(2);
    expect(await prisma.transaction.count({ where: { userUuid } })).toBe(0);
    const rows = await prisma.rawMessage.findMany({ where: { userUuid } });
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      body: null,
      parseStatus: ParseStatus.IGNORED,
      transactionId: null,
    });
  });

  it("rolls back writes after an internal failure and lets the same key retry", async () => {
    const create = jest.requireActual<typeof transactions>(
      "@/server/modules/transactions/service",
    ).createTransaction;
    (transactions.createTransaction as jest.Mock).mockImplementationOnce(
      async (...args: Parameters<typeof create>) => {
        const result = await create(...args);
        expect(result.ok).toBe(true);
        // Simulate a failure after the financial transaction was inserted.
        return { ok: false, error: "INTERNAL_ERROR" };
      },
    );
    const sms = input();
    expect(await importSmsTransaction(sms)).toEqual({
      ok: false,
      error: "INTERNAL_ERROR",
    });
    expect(await prisma.rawMessage.count({ where: { userUuid } })).toBe(0);
    expect(await prisma.transaction.count({ where: { userUuid } })).toBe(0);
    expect(await prisma.recipient.count({ where: { userUuid } })).toBe(0);
    expect(await importSmsTransaction(sms)).toMatchObject({
      ok: true,
      data: { status: "CREATED" },
    });
    expect(await prisma.rawMessage.count({ where: { userUuid } })).toBe(1);
    expect(await prisma.transaction.count({ where: { userUuid } })).toBe(1);
  });

  it("scopes keys to a user and keeps unkeyed uploads non-idempotent", async () => {
    const sms = input();
    const other = await prisma.user.create({
      data: {
        email: `${randomUUID()}@sms-test.example`,
        name: "Other",
        provider: "test",
      },
    });
    try {
      expect(await importSmsTransaction(sms)).toMatchObject({
        ok: true,
        data: { status: "CREATED" },
      });
      expect(
        await importSmsTransaction({ ...sms, userUuid: other.uuid }),
      ).toMatchObject({ ok: true, data: { status: "CREATED" } });
      const unkeyed = { ...sms, idempotencyKey: undefined };
      expect(await importSmsTransaction(unkeyed)).toMatchObject({
        ok: true,
        data: { status: "CREATED" },
      });
      expect(await importSmsTransaction(unkeyed)).toMatchObject({
        ok: true,
        data: { status: "CREATED" },
      });
      expect(await prisma.transaction.count({ where: { userUuid } })).toBe(3);
    } finally {
      await prisma.user.delete({ where: { uuid: other.uuid } });
    }
  });
});
