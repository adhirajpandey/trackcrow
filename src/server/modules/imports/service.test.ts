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

import { ParseStatus, TransactionSource } from "@/generated/prisma-rewrite";
import { parseTransactionMessage } from "@/common/sms-parser";
import { createTransaction } from "@/server/modules/transactions/service";

import { importSmsTransaction } from "./service";

const mockPrisma = (globalThis as any).__importsPrismaMock;
const parseTransactionMessageMock = parseTransactionMessage as jest.Mock;
const createTransactionMock = createTransaction as jest.Mock;

describe("importSmsTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
      data: { uuid: "txn-uuid" },
    });
    mockPrisma.transaction.findFirst.mockResolvedValueOnce({ id: 99 });

    const result = await importSmsTransaction({
      userUuid: "user-1",
      message: "sms text",
      location: "Bangalore",
    });

    expect(result).toEqual({ ok: true, data: { uuid: "txn-uuid" } });
    expect(createTransactionMock).toHaveBeenCalledWith({
      userUuid: "user-1",
      amount: 125,
      recipientRaw: "merchant@upi",
      recipientName: "Merchant",
      type: "UPI",
      remarks: null,
      timestamp: expect.any(Date),
      reference: "123",
      accountLabel: "HDFC",
      locationRaw: "Bangalore",
      source: TransactionSource.SMS,
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
