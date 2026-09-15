import {
  categorizeTransactionInput,
  createTransactionInput,
  listAccountsOutput,
  searchTransactionsInput,
  searchRecipientsOutput,
  spendingSummaryInput,
  toIstDateRange,
} from "./schemas";

describe("MCP tool schemas", () => {
  it("rejects unknown and user identity fields", () => {
    expect(searchTransactionsInput.safeParse({ userUuid: crypto.randomUUID() }).success).toBe(false);
    expect(categorizeTransactionInput.safeParse({
      transactionUuid: crypto.randomUUID(), categoryUuid: null, extra: true,
    }).success).toBe(false);
  });

  it("enforces search conflicts, limits, and ordered dates", () => {
    expect(searchTransactionsInput.safeParse({ categories: ["Food"], uncategorized: true }).success).toBe(false);
    expect(searchTransactionsInput.safeParse({ limit: 101 }).success).toBe(false);
    expect(searchTransactionsInput.safeParse({ startDate: "2026-09-15", endDate: "2026-09-14" }).success).toBe(false);
  });

  it("uses inclusive Asia/Kolkata day boundaries", () => {
    const range = toIstDateRange("2026-09-14", "2026-09-14");
    expect(range.startDate.toISOString()).toBe("2026-09-13T18:30:00.000Z");
    expect(range.endDate.toISOString()).toBe("2026-09-14T18:29:59.999Z");
  });

  it("requires offset timestamps and positive finite amounts", () => {
    const base = { amount: 1, recipientUuid: crypto.randomUUID(), type: "UPI" as const };
    expect(createTransactionInput.safeParse({ ...base, timestamp: "2026-09-14T10:00:00" }).success).toBe(false);
    expect(createTransactionInput.safeParse({ ...base, timestamp: "2026-09-14T10:00:00+05:30" }).success).toBe(true);
    expect(createTransactionInput.safeParse({ ...base, amount: Infinity, timestamp: "2026-09-14T10:00:00Z" }).success).toBe(false);
  });

  it("requires a category when a subcategory is provided", () => {
    const base = {
      amount: 1,
      recipientUuid: crypto.randomUUID(),
      type: "UPI" as const,
      timestamp: "2026-09-14T10:00:00+05:30",
    };
    expect(createTransactionInput.safeParse({ ...base, subcategoryUuid: crypto.randomUUID() }).success).toBe(false);
    expect(createTransactionInput.safeParse({ ...base, categoryUuid: null, subcategoryUuid: crypto.randomUUID() }).success).toBe(false);
    expect(createTransactionInput.safeParse(base).success).toBe(true);
  });

  it("accepts account UUIDs and rejects the removed account label", () => {
    const base = {
      amount: 1,
      recipientUuid: crypto.randomUUID(),
      type: "UPI" as const,
      timestamp: "2026-09-14T10:00:00+05:30",
    };
    expect(createTransactionInput.safeParse({ ...base, accountUuid: crypto.randomUUID() }).success).toBe(true);
    expect(createTransactionInput.safeParse({ ...base, accountLabel: "HDFC" }).success).toBe(false);
    expect(listAccountsOutput.safeParse({ accounts: [{ uuid: crypto.randomUUID(), name: "HDFC" }] }).success).toBe(true);
  });

  it("defaults summary grouping and period granularity", () => {
    expect(spendingSummaryInput.parse({ startDate: "2026-09-01", endDate: "2026-09-14" })).toMatchObject({ grouping: "none", periodGranularity: "month" });
  });
});


it("exposes nullable notes in MCP recipient results", () => {
  const result = {
    recipients: [{ uuid: crypto.randomUUID(), name: "Pada Arenas", note: "Sector 43, Gurugram football turf", aliases: [], transactionCount: 4, totalAmount: 4800 }],
    pagination: { page: 1, limit: 20, total: 1, totalPages: 1, hasNext: false, hasPrev: false },
  };
  expect(searchRecipientsOutput.parse(result).recipients[0].note).toBe("Sector 43, Gurugram football turf");
  expect(searchRecipientsOutput.safeParse({ ...result, recipients: [{ ...result.recipients[0], note: null }] }).success).toBe(true);
});
