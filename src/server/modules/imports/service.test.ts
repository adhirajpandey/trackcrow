jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__importsPrismaMock = {
    rawMessage: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
    },
    $transaction: jest.fn(),
    transaction: {
      findFirst: jest.fn(),
    },
  }),
}));

jest.mock("@/common/sms-parser", () => ({
  matchTransactionMessage: jest.fn(),
}));

jest.mock("@/server/modules/transactions/service", () => ({
  createTransaction: jest.fn(),
}));

jest.mock("@/server/modules/accounts/service", () => ({
  matchAccountByName: jest.fn(),
}));

import { ParseStatus, TransactionSource } from "@/generated/prisma-rewrite";
import { matchTransactionMessage } from "@/common/sms-parser";
import { createTransaction } from "@/server/modules/transactions/service";
import { matchAccountByName } from "@/server/modules/accounts/service";

import { importSmsTransaction } from "./service";

const mockPrisma = (globalThis as any).__importsPrismaMock;
const matchMock = matchTransactionMessage as jest.Mock;
const parses = (details: object) => ({ parserName: "TEST_PARSER", details });
const createTransactionMock = createTransaction as jest.Mock;
const matchAccountByNameMock = matchAccountByName as jest.Mock;

beforeEach(() => {
  jest.resetAllMocks();
  mockPrisma.$transaction.mockImplementation(
    (work: (db: unknown) => Promise<unknown>) => work(mockPrisma),
  );
  mockPrisma.rawMessage.create.mockResolvedValue({ id: 100 });
  mockPrisma.rawMessage.findFirst.mockResolvedValue(null);
});

describe("importSmsTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    matchAccountByNameMock.mockResolvedValue({
      ok: true,
      data: { accountUuid: null },
    });
  });

  it("persists a parsed SMS transaction for the authenticated user", async () => {
    matchMock.mockReturnValueOnce(
      parses({
        amount: 125,
        recipient: "merchant@upi",
        recipient_name: "Merchant",
        type: "UPI",
        reference: "123",
        account: "HDFC",
      }),
    );
    createTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { ignored: false, uuid: "txn-uuid" },
    });
    mockPrisma.transaction.findFirst.mockResolvedValueOnce({ id: 99 });
    matchAccountByNameMock.mockResolvedValueOnce({
      ok: true,
      data: { accountUuid: "account-1" },
    });

    const result = await importSmsTransaction({
      userUuid: "user-1",
      message: "sms text",
      location: "Bangalore",
    });

    expect(result).toEqual({
      ok: true,
      data: { status: "CREATED", uuid: "txn-uuid" },
    });
    expect(createTransactionMock).toHaveBeenCalledWith(
      {
        userUuid: "user-1",
        amount: 125,
        recipientRaw: "merchant@upi",
        recipientName: "Merchant",
        type: "UPI",
        remarks: null,
        timestamp: expect.any(Date),
        reference: "123",
        accountUuid: "account-1",
        locationRaw: "Bangalore",
        source: TransactionSource.SMS,
        honorIgnoreRules: true,
      },
      mockPrisma,
    );
    expect(mockPrisma.rawMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userUuid: "user-1",
        transactionId: 99,
        body: "sms text",
        parseStatus: ParseStatus.PARSED,
        parserName: "TEST_PARSER",
        locationRaw: "Bangalore",
      }),
    });
    expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { uuid: "txn-uuid", userUuid: "user-1" },
      select: { id: true },
    });
  });

  it("records an IGNORED raw message and no transaction when a rule ignores the message", async () => {
    matchMock.mockReturnValueOnce(
      parses({
        amount: 500,
        recipient: "me@upi",
        recipient_name: "Me",
        type: "UPI",
      }),
    );
    createTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { ignored: true, ruleUuid: "rule-ignore" },
    });

    const result = await importSmsTransaction({
      userUuid: "user-1",
      message: "self transfer sms",
      location: null,
    });

    expect(result).toEqual({
      ok: true,
      data: { status: "IGNORED", ruleUuid: "rule-ignore" },
    });
    expect(mockPrisma.rawMessage.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.rawMessage.create).toHaveBeenCalledWith({
      data: {
        userUuid: "user-1",
        body: "self transfer sms",
        parseStatus: ParseStatus.IGNORED,
        parserName: "TEST_PARSER",
        parsedPayload: expect.objectContaining({
          ignoredByRuleUuid: "rule-ignore",
        }),
        locationRaw: null,
      },
    });
    expect(mockPrisma.transaction.findFirst).not.toHaveBeenCalled();
  });

  it("stores an UNPARSEABLE raw message when amount or recipient is missing", async () => {
    matchMock.mockReturnValueOnce(
      parses({
        amount: null,
        recipient: null,
        type: "UPI",
      }),
    );

    const result = await importSmsTransaction({
      userUuid: "user-1",
      message: "unknown sms",
      location: null,
    });

    expect(result).toMatchObject({
      ok: false,
      error: "UNPROCESSABLE",
      details: { missing: { amount: true, recipient: true } },
    });
    expect(mockPrisma.rawMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userUuid: "user-1",
        body: "unknown sms",
        parseStatus: ParseStatus.UNPARSEABLE,
        failureReason: "Unable to extract amount or recipient",
      }),
    });
  });

  it("stores a FAILED raw message when transaction creation fails", async () => {
    matchMock.mockReturnValueOnce(
      parses({
        amount: 50,
        recipient: "merchant@upi",
        type: "UPI",
      }),
    );
    createTransactionMock.mockResolvedValueOnce({
      ok: false,
      error: "INTERNAL_ERROR",
    });

    const result = await importSmsTransaction({
      userUuid: "user-1",
      message: "sms text",
    });

    expect(result).toEqual({ ok: false, error: "INTERNAL_ERROR" });
    expect(mockPrisma.rawMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userUuid: "user-1",
        body: "sms text",
        parseStatus: ParseStatus.FAILED,
        failureReason: "Transaction creation failed",
      }),
    });
  });
});

describe("SMS occurrence and receipt timestamps", () => {
  afterEach(() => jest.useRealTimers());
  it.each([true, false])(
    "uses supplied occurrence time for the transaction and raw message when present (%s)",
    async (supplied) => {
      jest.clearAllMocks();
      const now = new Date("2026-09-28T12:00:00Z");
      const occurred = new Date("2026-09-27T11:00:00Z");
      jest.useFakeTimers().setSystemTime(now);
      matchMock.mockReturnValue(
        parses({ amount: 125, recipient: "merchant", type: "UPI" }),
      );
      matchAccountByNameMock.mockResolvedValue({
        ok: true,
        data: { accountUuid: null },
      });
      createTransactionMock.mockResolvedValue({
        ok: true,
        data: { ignored: false, uuid: "txn" },
      });
      mockPrisma.transaction.findFirst.mockResolvedValue({ id: 1 });
      const result = await importSmsTransaction({
        userUuid: "user",
        message: "sms",
        ...(supplied ? { timestamp: occurred } : {}),
      });
      expect(result.ok).toBe(true);
      expect(createTransactionMock).toHaveBeenCalledWith(
        expect.objectContaining({ timestamp: supplied ? occurred : now }),
        mockPrisma,
      );
      const raw = mockPrisma.rawMessage.create.mock.calls[0][0].data;
      if (supplied) expect(raw.receivedAt).toEqual(occurred);
      else expect(raw).not.toHaveProperty("receivedAt");
      expect(raw).not.toHaveProperty("createdAt");
      expect(raw).not.toHaveProperty("timestamp");
    },
  );
});

describe("app uploads", () => {
  const key = "7d3b8f64-5f0b-4a47-9a55-1f0f4e2b6c11";
  beforeEach(() => {
    jest.clearAllMocks();
    matchAccountByNameMock.mockResolvedValue({
      ok: true,
      data: { accountUuid: null },
    });
  });

  it("stores sender and key but no body when the client opts out of body storage", async () => {
    mockPrisma.rawMessage.findFirst.mockResolvedValueOnce(null);
    matchMock.mockReturnValueOnce(
      parses({ amount: 90, recipient: "shop@upi", type: "UPI" }),
    );
    createTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { ignored: false, uuid: "txn" },
    });
    mockPrisma.transaction.findFirst.mockResolvedValueOnce({ id: 7 });

    const result = await importSmsTransaction({
      userUuid: "user",
      message: "sms text",
      sender: "AX-HDFCBK",
      idempotencyKey: key,
      storeMessageBody: false,
    });

    expect(result).toEqual({
      ok: true,
      data: { status: "CREATED", uuid: "txn" },
    });
    expect(mockPrisma.rawMessage.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userUuid: "user", idempotencyKey: key },
      }),
    );
    expect(mockPrisma.rawMessage.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: expect.objectContaining({
        body: null,
        sender: "AX-HDFCBK",
        idempotencyKey: key,
        parserName: "TEST_PARSER",
      }),
    });
  });

  it("does not store the body of an unparseable message when the client opts out", async () => {
    mockPrisma.rawMessage.findFirst.mockResolvedValueOnce(null);
    matchMock.mockReturnValueOnce(null);

    const result = await importSmsTransaction({
      userUuid: "user",
      message: "unknown",
      idempotencyKey: key,
      storeMessageBody: false,
    });

    expect(result).toMatchObject({ ok: false, error: "UNPROCESSABLE" });
    expect(mockPrisma.rawMessage.update).toHaveBeenCalledWith({
      where: { id: 100 },
      data: expect.objectContaining({
        body: null,
        parserName: null,
        parseStatus: ParseStatus.UNPARSEABLE,
      }),
    });
  });

  it("returns the first outcome for a retried key without parsing or creating again", async () => {
    mockPrisma.rawMessage.findFirst.mockResolvedValueOnce({
      parseStatus: ParseStatus.PARSED,
      transaction: { uuid: "txn-first" },
    });

    const result = await importSmsTransaction({
      userUuid: "user",
      message: "sms text",
      idempotencyKey: key,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        status: "DUPLICATE",
        previousStatus: ParseStatus.PARSED,
        uuid: "txn-first",
      },
    });
    expect(matchMock).not.toHaveBeenCalled();
    expect(createTransactionMock).not.toHaveBeenCalled();
    expect(mockPrisma.rawMessage.create).not.toHaveBeenCalled();
  });

  it("reports a duplicate of a message that created no transaction", async () => {
    mockPrisma.rawMessage.findFirst.mockResolvedValueOnce({
      parseStatus: ParseStatus.UNPARSEABLE,
      transaction: null,
    });

    const result = await importSmsTransaction({
      userUuid: "user",
      message: "unknown",
      idempotencyKey: key,
    });

    expect(result).toEqual({
      ok: true,
      data: {
        status: "DUPLICATE",
        previousStatus: ParseStatus.UNPARSEABLE,
        uuid: null,
      },
    });
  });

  it("returns the winning outcome after a unique-key race without parsing", async () => {
    mockPrisma.rawMessage.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        parseStatus: ParseStatus.PARSED,
        transaction: { uuid: "winner" },
      });
    mockPrisma.rawMessage.create.mockRejectedValueOnce({ code: "P2002" });
    const result = await importSmsTransaction({
      userUuid: "user",
      message: "sms",
      idempotencyKey: key,
    });
    expect(result).toEqual({
      ok: true,
      data: {
        status: "DUPLICATE",
        previousStatus: ParseStatus.PARSED,
        uuid: "winner",
      },
    });
    expect(matchMock).not.toHaveBeenCalled();
    expect(createTransactionMock).not.toHaveBeenCalled();
  });

  it.each([
    [
      { ok: true, data: { ignored: true, ruleUuid: "ignore" } },
      ParseStatus.IGNORED,
    ],
    [{ ok: false, error: "VALIDATION_ERROR" }, ParseStatus.FAILED],
  ])(
    "omits text in keyed ignored and failed outcomes (%s)",
    async (outcome, parseStatus) => {
      matchMock.mockReturnValueOnce(
        parses({ amount: 90, recipient: "shop@upi", type: "UPI" }),
      );
      createTransactionMock.mockResolvedValueOnce(outcome);
      await importSmsTransaction({
        userUuid: "user",
        message: "sms",
        idempotencyKey: key,
        storeMessageBody: false,
      });
      expect(mockPrisma.rawMessage.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ body: null, idempotencyKey: key }),
        select: { id: true },
      });
      expect(mockPrisma.rawMessage.update).toHaveBeenCalledWith({
        where: { id: 100 },
        data: expect.objectContaining({ body: null, parseStatus }),
      });
    },
  );

  it("skips the duplicate lookup for clients that send no key", async () => {
    matchMock.mockReturnValueOnce(null);
    await importSmsTransaction({ userUuid: "user", message: "unknown" });
    expect(mockPrisma.rawMessage.findFirst).not.toHaveBeenCalled();
  });
});
