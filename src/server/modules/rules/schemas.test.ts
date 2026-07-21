import { createRuleSchema, updateRuleSchema } from "./schemas";

const validRule = {
  name: "  Swiggy food  ",
  isEnabled: true,
  conditions: {
    recipient: { equals: "7a4bfec7-f109-4d37-bf9b-41f909f25dad" },
  },
  action: {
    categoryUuid: "5ac11b5c-f9af-41e6-a621-bd085836338e",
    subcategoryUuid: null,
  },
};

describe("rule mutation schemas", () => {
  it("parses the complete strict create contract and trims its name", () => {
    expect(createRuleSchema.parse(validRule).name).toBe("Swiggy food");
    expect(createRuleSchema.safeParse({ ...validRule, priority: 1 }).success).toBe(false);
    expect(
      createRuleSchema.safeParse({
        ...validRule,
        conditions: { ...validRule.conditions, amount: { gt: 100 } },
      }).success
    ).toBe(false);
  });

  it("requires a nonempty top-level patch", () => {
    expect(updateRuleSchema.safeParse({}).success).toBe(false);
    expect(updateRuleSchema.parse({ name: " New name " })).toEqual({ name: "New name" });
  });

  it("requires complete nested replacements in a patch", () => {
    expect(updateRuleSchema.safeParse({ action: { categoryUuid: validRule.action.categoryUuid } }).success).toBe(false);
    expect(updateRuleSchema.safeParse({ conditions: { recipient: {} } }).success).toBe(false);
  });
});
