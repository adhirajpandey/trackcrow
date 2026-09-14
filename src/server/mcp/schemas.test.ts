import {
  categorizeTransactionInput,
  createTransactionInput,
  searchTransactionsInput,
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

  it("defaults summary grouping and period granularity", () => {
    expect(spendingSummaryInput.parse({ startDate: "2026-09-01", endDate: "2026-09-14" })).toMatchObject({ grouping: "none", periodGranularity: "month" });
  });
});
