jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__importsPrismaMock = {
    rawMessage: {
      create: jest.fn(),
    },
    transaction: {
      findFirst: jest.fn(),
    },
  }),
}));

jest.mock("@/common/sms-parser", () => ({
  parseTransactionMessage: jest.fn(),
}));

jest.mock("@/server/modules/transactions/service", () => ({
  createTransaction: jest.fn(),
}));

jest.mock("@/server/modules/accounts/service", () => ({
  matchAccountByName: jest.fn(),
}));

import { ParseStatus, TransactionSource } from "@/generated/prisma-rewrite";
import { parseTransactionMessage } from "@/common/sms-parser";
import { createTransaction } from "@/server/modules/transactions/service";
import { matchAccountByName } from "@/server/modules/accounts/service";

import { importSmsTransaction } from "./service";

const mockPrisma = (globalThis as any).__importsPrismaMock;
const parseTransactionMessageMock = parseTransactionMessage as jest.Mock;
const createTransactionMock = createTransaction as jest.Mock;
const matchAccountByNameMock = matchAccountByName as jest.Mock;

describe("importSmsTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    matchAccountByNameMock.mockResolvedValue({ ok: true, data: { accountUuid: null } });
  });

  it("persists a parsed SMS transaction for the authenticated user", async () => {
    parseTransactionMessageMock.mockReturnValueOnce({
      amount: 125,
      recipient: "merchant@upi",
      recipient_name: "Merchant",
      type: "UPI",
      reference: "123",
      account: "HDFC",
    });
    createTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { ignored: false, uuid: "txn-uuid" },
    });
    mockPrisma.transaction.findFirst.mockResolvedValueOnce({ id: 99 });
    matchAccountByNameMock.mockResolvedValueOnce({ ok: true, data: { accountUuid: "account-1" } });

    const result = await importSmsTransaction({
      userUuid: "user-1",
      message: "sms text",
      location: "Bangalore",
    });

    expect(result).toEqual({ ok: true, data: { ignored: false, uuid: "txn-uuid" } });
    expect(createTransactionMock).toHaveBeenCalledWith({
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
    });
    expect(mockPrisma.rawMessage.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userUuid: "user-1",
        transactionId: 99,
        body: "sms text",
        parseStatus: ParseStatus.PARSED,
        locationRaw: "Bangalore",
      }),
    });
    expect(mockPrisma.transaction.findFirst).toHaveBeenCalledWith({
      where: { uuid: "txn-uuid", userUuid: "user-1" },
      select: { id: true },
    });
  });

  it("records an IGNORED raw message and no transaction when a rule ignores the message", async () => {
    parseTransactionMessageMock.mockReturnValueOnce({
      amount: 500,
      recipient: "me@upi",
      recipient_name: "Me",
      type: "UPI",
    });
    createTransactionMock.mockResolvedValueOnce({
      ok: true,
      data: { ignored: true, ruleUuid: "rule-ignore" },
    });

    const result = await importSmsTransaction({
      userUuid: "user-1",
      message: "self transfer sms",
      location: null,
    });

    expect(result).toEqual({ ok: true, data: { ignored: true, ruleUuid: "rule-ignore" } });
    expect(mockPrisma.rawMessage.create).toHaveBeenCalledTimes(1);
    expect(mockPrisma.rawMessage.create).toHaveBeenCalledWith({
      data: {
        userUuid: "user-1",
        body: "self transfer sms",
        parseStatus: ParseStatus.IGNORED,
        parserName: null,
        parsedPayload: expect.objectContaining({ ignoredByRuleUuid: "rule-ignore" }),
        locationRaw: null,
      },
    });
    expect(mockPrisma.transaction.findFirst).not.toHaveBeenCalled();
  });

  it("stores an UNPARSEABLE raw message when amount or recipient is missing", async () => {
    parseTransactionMessageMock.mockReturnValueOnce({
      amount: null,
      recipient: null,
      type: "UPI",
    });

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
    parseTransactionMessageMock.mockReturnValueOnce({
      amount: 50,
      recipient: "merchant@upi",
      type: "UPI",
    });
    createTransactionMock.mockResolvedValueOnce({ ok: false, error: "INTERNAL_ERROR" });

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
