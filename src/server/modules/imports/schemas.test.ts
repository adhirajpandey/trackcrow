import { importSmsRequestSchema } from "./schemas";

describe("SMS timestamp schema", () => {
  const payload = (timestamp?: unknown) => ({ data: { message: "example", ...(timestamp === undefined ? {} : { timestamp }) }, metadata: { location: null } });
  it.each([undefined, "2026-09-28T12:00:00Z", "2026-09-28T17:30:00.123+05:30"])("accepts omitted or zoned ISO timestamp %p", (timestamp) => {
    expect(importSmsRequestSchema.safeParse(payload(timestamp)).success).toBe(true);
  });
  it.each([null, 123, "", "2026-09-28", "2026-09-28T12:00:00", "2026-02-30T12:00:00Z", "not a date"])("rejects invalid timestamp %p", (timestamp) => {
    expect(importSmsRequestSchema.safeParse(payload(timestamp)).success).toBe(false);
  });
});

describe("SMS app upload fields", () => {
  const payload = (data: object, metadata: object = {}) => ({ data: { message: "example", ...data }, metadata: { location: null, ...metadata } });
  it("accepts sender, idempotency key, and body opt-out", () => {
    expect(importSmsRequestSchema.safeParse(payload(
      { sender: "AX-HDFCBK", idempotencyKey: "7d3b8f64-5f0b-4a47-9a55-1f0f4e2b6c11" },
      { storeMessageBody: false },
    )).success).toBe(true);
  });
  it.each([{ idempotencyKey: "not-a-uuid" }, { sender: "" }, { sender: "x".repeat(65) }, { message: "x".repeat(4001) }])("rejects %p", (data) => {
    expect(importSmsRequestSchema.safeParse(payload(data)).success).toBe(false);
  });
  it("rejects a non-boolean body opt-out", () => {
    expect(importSmsRequestSchema.safeParse(payload({}, { storeMessageBody: "no" })).success).toBe(false);
  });
});
