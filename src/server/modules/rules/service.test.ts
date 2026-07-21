import { ClassificationSource } from "@/generated/prisma-rewrite";

import { evaluateRule, resolveCreateClassification } from "./evaluator";

const validRule = {
  id: 7,
  uuid: "5ac11b5c-f9af-41e6-a621-bd085836338e",
  recipientUuid: "7a4bfec7-f109-4d37-bf9b-41f909f25dad",
  categoryId: 11,
  subcategoryId: 12,
};

describe("rule evaluation", () => {
  it("matches recipients by exact UUID", () => {
    expect(evaluateRule({ recipientUuid: validRule.recipientUuid }, validRule)).toBe(true);
    expect(
      evaluateRule(
        { recipientUuid: "b4b5477e-98da-4270-b3f8-c9dfb7d2381d" },
        validRule
      )
    ).toBe(false);
  });

  it("leaves classification empty when no rule matches", () => {
    expect(
      resolveCreateClassification(
        { recipientUuid: "b4b5477e-98da-4270-b3f8-c9dfb7d2381d" },
        { type: "AUTO" },
        [validRule]
      )
    ).toEqual({ type: "UNASSIGNED" });
  });

  it("returns rule provenance for one match", () => {
    expect(
      resolveCreateClassification(
        { recipientUuid: validRule.recipientUuid },
        { type: "AUTO" },
        [validRule]
      )
    ).toEqual({
      type: "ASSIGNED",
      categoryId: 11,
      subcategoryId: 12,
      classificationSource: ClassificationSource.RULE,
      classificationRuleId: 7,
    });
  });

  it("defensively leaves classification empty for multiple matches", () => {
    expect(
      resolveCreateClassification(
        { recipientUuid: validRule.recipientUuid },
        { type: "AUTO" },
        [validRule, { ...validRule, id: 8 }]
      )
    ).toEqual({ type: "MULTIPLE_MATCHES" });
  });

  it("returns manual selections without evaluating rules", () => {
    expect(
      resolveCreateClassification(
        { recipientUuid: validRule.recipientUuid },
        { type: "MANUAL", categoryId: 3, subcategoryId: null },
        [validRule]
      )
    ).toEqual({
      type: "ASSIGNED",
      categoryId: 3,
      subcategoryId: null,
      classificationSource: ClassificationSource.MANUAL,
      classificationRuleId: null,
    });
  });
});
