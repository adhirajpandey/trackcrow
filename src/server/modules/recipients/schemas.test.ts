import { createRecipientSchema, updateRecipientSchema } from "./schemas";

describe("recipient update validation", () => {
  it.each([{ note: null }, { note: "" }, { note: "turf" }, { displayName: "Pada Arenas" }, { displayName: "Pada Arenas", note: "turf" }])("accepts supported updates: %j", (input) => {
    expect(updateRecipientSchema.safeParse(input).success).toBe(true);
  });
  it.each([{}, { note: 123 }, { note: "x".repeat(501) }, { displayName: " " }, { displayName: null }])("rejects invalid updates: %j", (input) => {
    expect(updateRecipientSchema.safeParse(input).success).toBe(false);
  });
  it("trims before checking length and still requires a name for creation", () => {
    expect(updateRecipientSchema.parse({ note: "  " + "x".repeat(500) + "  " }).note).toHaveLength(500);
    expect(createRecipientSchema.safeParse({ note: "turf" }).success).toBe(false);
  });
});
