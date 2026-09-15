import { createTransactionSchema, updateTransactionSchema } from "./schemas";

const base = {
  amount: 10,
  recipientUuid: crypto.randomUUID(),
  type: "UPI" as const,
  timestamp: new Date("2026-09-15T10:00:00.000Z"),
};

describe("transaction account schemas", () => {
  it("accepts an optional nullable account UUID", () => {
    expect(createTransactionSchema.safeParse(base).success).toBe(true);
    expect(createTransactionSchema.safeParse({ ...base, accountUuid: null }).success).toBe(true);
    expect(createTransactionSchema.safeParse({ ...base, accountUuid: crypto.randomUUID() }).success).toBe(true);
  });

  it("rejects unknown legacy account labels", () => {
    expect(createTransactionSchema.safeParse({ ...base, accountLabel: "HDFC" }).success).toBe(false);
    const update = {
      amount: base.amount,
      type: base.type,
      timestamp: base.timestamp,
    };
    expect(updateTransactionSchema.safeParse({ ...update, accountLabel: "HDFC" }).success).toBe(false);
  });
});
