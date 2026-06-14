jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: ((globalThis as any).__importsPrismaMock = {
    deviceToken: {
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    rawMessage: {
      create: jest.fn(),
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
import { hashDeviceToken } from "@/server/modules/device-tokens/service";

import { importSmsTransaction } from "./service";

const mockPrisma = (globalThis as any).__importsPrismaMock;
const parseTransactionMessageMock = parseTransactionMessage as jest.Mock;
const createTransactionMock = createTransaction as jest.Mock;

describe("importSmsTransaction", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects missing and invalid device tokens", async () => {
    await expect(
      importSmsTransaction({ token: null, message: "sms" })
    ).resolves.toMatchObject({ ok: false, error: "UNAUTHORIZED" });
    expect(mockPrisma.deviceToken.findFirst).not.toHaveBeenCalled();

    mockPrisma.deviceToken.findFirst.mockResolvedValueOnce(null);
    await expect(
      importSmsTransaction({ token: "bad-token", message: "sms" })
    ).resolves.toMatchObject({ ok: false, error: "UNAUTHORIZED" });

    expect(mockPrisma.deviceToken.findFirst).toHaveBeenCalledWith({
      where: {
        tokenHash: hashDeviceToken("bad-token"),
        revokedAt: null,
      },
      select: {
        id: true,
        userUuid: true,
      },
    });
  });

  it("updates lastUsedAt and persists a parsed SMS transaction", async () => {
    mockPrisma.deviceToken.findFirst.mockResolvedValueOnce({ id: 7, userUuid: "user-1" });
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
      data: { id: 99, uuid: "txn-uuid" },
    });

    const result = await importSmsTransaction({
      token: "good-token",
      message: "sms text",
      location: "Bangalore",
    });

    expect(result).toEqual({ ok: true, data: { id: 99, uuid: "txn-uuid" } });
    expect(mockPrisma.deviceToken.update).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { lastUsedAt: expect.any(Date) },
    });
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
  });

  it("stores an UNPARSEABLE raw message when amount or recipient is missing", async () => {
    mockPrisma.deviceToken.findFirst.mockResolvedValueOnce({ id: 7, userUuid: "user-1" });
    parseTransactionMessageMock.mockReturnValueOnce({
      amount: null,
      recipient: null,
      type: "UPI",
    });

    const result = await importSmsTransaction({
      token: "good-token",
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
    mockPrisma.deviceToken.findFirst.mockResolvedValueOnce({ id: 7, userUuid: "user-1" });
    parseTransactionMessageMock.mockReturnValueOnce({
      amount: 50,
      recipient: "merchant@upi",
      type: "UPI",
    });
    createTransactionMock.mockResolvedValueOnce({ ok: false, error: "INTERNAL_ERROR" });

    const result = await importSmsTransaction({
      token: "good-token",
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
