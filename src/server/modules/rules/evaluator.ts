import { ClassificationSource, RuleActionType } from "@/generated/prisma-rewrite";

export type RuleFacts = { recipientUuid: string };

export type EvaluatableRule = {
  id: number;
  uuid: string;
  recipientUuid: string;
  actionType: RuleActionType;
  categoryId: number | null;
  subcategoryId: number | null;
};

export type ClassificationIntent =
  | { type: "AUTO" }
  | { type: "MANUAL"; categoryId: number | null; subcategoryId: number | null };

export function evaluateRule(facts: RuleFacts, rule: EvaluatableRule) {
  return facts.recipientUuid === rule.recipientUuid;
}

export function resolveCreateClassification(
  facts: RuleFacts,
  intent: ClassificationIntent,
  rules: readonly EvaluatableRule[]
) {
  if (intent.type === "MANUAL") {
    return {
      type: "ASSIGNED" as const,
      categoryId: intent.categoryId,
      subcategoryId: intent.subcategoryId,
      classificationSource: ClassificationSource.MANUAL,
      classificationRuleId: null,
    };
  }

  const matches = rules.filter((rule) => evaluateRule(facts, rule));
  if (matches.length === 0) {
    return { type: "UNASSIGNED" as const };
  }
  if (matches.length > 1) {
    return { type: "MULTIPLE_MATCHES" as const };
  }

  const [rule] = matches;
  if (rule.actionType === RuleActionType.IGNORE) {
    return { type: "IGNORED" as const, ruleId: rule.id, ruleUuid: rule.uuid };
  }
  return {
    type: "ASSIGNED" as const,
    categoryId: rule.categoryId,
    subcategoryId: rule.subcategoryId,
    classificationSource: ClassificationSource.RULE,
    classificationRuleId: rule.id,
  };
}
