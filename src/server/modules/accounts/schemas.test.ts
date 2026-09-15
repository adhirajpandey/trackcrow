import { accountSchema } from "./schemas";

describe("account schema", () => {
  it("requires a nonblank name and rejects extra fields", () => {
    expect(accountSchema.safeParse({ name: "   " }).success).toBe(false);
    expect(accountSchema.safeParse({ name: "HDFC", userUuid: "user-1" }).success).toBe(false);
    expect(accountSchema.safeParse({ name: " HDFC " }).success).toBe(true);
  });
});
