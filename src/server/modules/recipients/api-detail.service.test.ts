jest.mock("@/lib/prisma-rewrite", () => ({
  __esModule: true,
  default: { recipient: { findFirst: jest.fn() }, rule: { findFirst: jest.fn() } },
}));

import prisma from "@/lib/prisma-rewrite";
import { getRecipientApiDetail } from "./service";

const recipientLookup = jest.mocked(prisma.recipient.findFirst);
const ruleLookup = jest.mocked(prisma.rule.findFirst);
const input = { userUuid: "user-1", recipientUuid: "recipient-1" };
const now = new Date("2026-09-01T00:00:00Z");

function transaction(id: number, value: number, category: string | null) {
  return {
    id, uuid: `txn-${id}`, amount: { toNumber: () => value },
    currency: "INR", type: "UPI", source: "SMS", recipientRaw: "merchant@upi", recipientName: null,
    timestamp: new Date(now.getTime() - id * 86400000),
    categoryId: category ? 1 : null, subcategoryId: null,
    category: category ? { uuid: `cat-${category}`, name: category } : null, subcategory: null,
  };
}

function recipient(transactions: ReturnType<typeof transaction>[] = []) {
  return {
    id: 1, uuid: input.recipientUuid, userUuid: input.userUuid,
    displayName: "Merchant", normalizedName: "merchant", note: null, createdAt: now, updatedAt: now,
    identifiers: [{ id: 1, uuid: "alias-1", kind: "UPI_ID", value: "merchant@upi", normalizedValue: "merchant@upi" }],
    transactions,
  };
}

describe("recipient API detail service", () => {
  beforeEach(() => jest.resetAllMocks());

  it("returns aliases, payment stats, dominant category, and the preferred saved rule link", async () => {
    const transactions = [transaction(1, 20, null), transaction(2, 30, "Food"), transaction(3, 70, "Food"), transaction(4, 200, "Travel")];
    recipientLookup.mockResolvedValue(recipient(transactions));
    ruleLookup.mockResolvedValue({ uuid: "rule-1" } as never);
    await expect(getRecipientApiDetail(input)).resolves.toMatchObject({ ok: true, data: {
      uuid: input.recipientUuid, transactionCount: 4,
      aliases: [{ uuid: "alias-1", aliasType: "UPI_ID", value: "merchant@upi" }],
      stats: {
        totalAmount: 320, averagePayment: 80, uncategorizedCount: 1,
        firstPaidAt: transactions[3].timestamp.toISOString(), lastPaidAt: transactions[0].timestamp.toISOString(),
      },
      dominantCategory: { uuid: "cat-Food", name: "Food", transactionCount: 2, totalAmount: 100 },
      existingRuleUuid: "rule-1", linkedTransactions: expect.arrayContaining([expect.objectContaining({ uuid: "txn-1", amount: 20 })]),
    } });
    expect(recipientLookup).toHaveBeenCalledWith(expect.objectContaining({ where: { uuid: input.recipientUuid, userUuid: input.userUuid } }));
    expect(ruleLookup).toHaveBeenCalledWith({
      where: { userUuid: input.userUuid, recipient: { uuid: input.recipientUuid }, deletedAt: null },
      orderBy: [{ isEnabled: "desc" }, { updatedAt: "desc" }, { uuid: "asc" }], select: { uuid: true },
    });
  });

  it("uses total spend to break category count ties and excludes uncategorized payments", async () => {
    recipientLookup.mockResolvedValue(recipient([transaction(1, 500, null), transaction(2, 30, "Food"), transaction(3, 70, "Travel")]));
    ruleLookup.mockResolvedValue(null);
    await expect(getRecipientApiDetail(input)).resolves.toMatchObject({ ok: true, data: {
      dominantCategory: { uuid: "cat-Travel", transactionCount: 1, totalAmount: 70 }, existingRuleUuid: null,
    } });
  });

  it("returns null dates and category with zero stats for a recipient without payments", async () => {
    recipientLookup.mockResolvedValue(recipient());
    ruleLookup.mockResolvedValue(null);
    await expect(getRecipientApiDetail(input)).resolves.toMatchObject({ ok: true, data: {
      stats: { totalAmount: 0, averagePayment: 0, uncategorizedCount: 0, firstPaidAt: null, lastPaidAt: null },
      dominantCategory: null, existingRuleUuid: null,
    } });
  });

  it("returns no dominant category when every payment is uncategorized", async () => {
    recipientLookup.mockResolvedValue(recipient([transaction(1, 100, null)]));
    ruleLookup.mockResolvedValue(null);
    await expect(getRecipientApiDetail(input)).resolves.toMatchObject({ ok: true, data: {
      stats: { totalAmount: 100, averagePayment: 100, uncategorizedCount: 1 }, dominantCategory: null,
    } });
  });

  it("returns not found without a rule lookup for missing or foreign recipients", async () => {
    recipientLookup.mockResolvedValue(null);
    await expect(getRecipientApiDetail(input)).resolves.toEqual({ ok: false, error: "NOT_FOUND" });
    expect(ruleLookup).not.toHaveBeenCalled();
  });

  it("sanitizes rule storage failures", async () => {
    recipientLookup.mockResolvedValue(recipient());
    ruleLookup.mockRejectedValue(new Error("storage unavailable"));
    await expect(getRecipientApiDetail(input)).resolves.toEqual({ ok: false, error: "INTERNAL_ERROR" });
  });
});
