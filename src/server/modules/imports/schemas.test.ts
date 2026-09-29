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
