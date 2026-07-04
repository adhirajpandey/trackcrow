import { buildRecipientDetailPageData } from "./recipient-detail-model";

describe("buildRecipientDetailPageData", () => {
  it("sorts aliases by transaction count descending", () => {
    const pageData = buildRecipientDetailPageData({
      uuid: "rcp-7",
      displayName: "Sample Recipient",
      normalizedName: "sample recipient",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-30T00:00:00.000Z",
      transactionCount: 5,
      aliases: [
        {
          uuid: "rid-low",
          aliasType: "UPI_ID",
          value: "low@upi",
          normalizedValue: "low@upi",
        },
        {
          uuid: "rid-high",
          aliasType: "CARD_MERCHANT",
          value: "HIGH CARD",
          normalizedValue: "high card",
        },
        {
          uuid: "rid-mid",
          aliasType: "TEXT",
          value: "mid text",
          normalizedValue: "mid text",
        },
      ],
      linkedTransactions: [
        {
          uuid: "txn-1",
          amount: 100,
          currency: "INR",
          type: "UPI",
          source: "sms",
          recipientRaw: "HIGH CARD",
          recipientName: null,
          timestamp: "2026-06-30T10:00:00.000Z",
          category: null,
          subcategory: null,
          categoryUuid: null,
          subcategoryUuid: null,
        },
        {
          uuid: "txn-2",
          amount: 120,
          currency: "INR",
          type: "UPI",
          source: "sms",
          recipientRaw: "HIGH CARD",
          recipientName: null,
          timestamp: "2026-06-29T10:00:00.000Z",
          category: null,
          subcategory: null,
          categoryUuid: null,
          subcategoryUuid: null,
        },
        {
          uuid: "txn-3",
          amount: 80,
          currency: "INR",
          type: "UPI",
          source: "sms",
          recipientRaw: "mid text",
          recipientName: null,
          timestamp: "2026-06-28T10:00:00.000Z",
          category: null,
          subcategory: null,
          categoryUuid: null,
          subcategoryUuid: null,
        },
        {
          uuid: "txn-4",
          amount: 75,
          currency: "INR",
          type: "UPI",
          source: "sms",
          recipientRaw: "low@upi",
          recipientName: null,
          timestamp: "2026-06-27T10:00:00.000Z",
          category: null,
          subcategory: null,
          categoryUuid: null,
          subcategoryUuid: null,
        },
        {
          uuid: "txn-5",
          amount: 90,
          currency: "INR",
          type: "UPI",
          source: "sms",
          recipientRaw: "HIGH CARD",
          recipientName: "mid text",
          timestamp: "2026-06-26T10:00:00.000Z",
          category: null,
          subcategory: null,
          categoryUuid: null,
          subcategoryUuid: null,
        },
      ],
    });

    expect(pageData.aliases.map((alias) => alias.id)).toEqual([
      "rid-high",
      "rid-mid",
      "rid-low",
    ]);
    expect(pageData.aliases.map((alias) => alias.transactionCount)).toEqual([
      3,
      2,
      1,
    ]);
  });

  it("keeps all linked transactions for client-side pagination", () => {
    const linkedTransactions = Array.from({ length: 13 }, (_, index) => ({
      uuid: `txn-${index + 1}`,
      amount: 100 + index,
      currency: "INR",
      type: "UPI",
      source: "sms",
      recipientRaw: "Sample Recipient",
      recipientName: null,
      timestamp: `2026-06-${String(30 - index).padStart(2, "0")}T10:00:00.000Z`,
      category: "Food",
      subcategory: "Dinner",
      categoryUuid: "cat-1",
      subcategoryUuid: "sub-2",
    }));

    const pageData = buildRecipientDetailPageData({
      uuid: "rcp-7",
      displayName: "Sample Recipient",
      normalizedName: "sample recipient",
      createdAt: "2026-06-01T00:00:00.000Z",
      updatedAt: "2026-06-30T00:00:00.000Z",
      transactionCount: linkedTransactions.length,
      aliases: [],
      linkedTransactions,
    });

    expect(pageData.recentTransactions).toHaveLength(13);
    expect(pageData.recentTransactions[0]?.uuid).toBe("txn-1");
    expect(pageData.recentTransactions[12]?.uuid).toBe("txn-13");
  });
});
