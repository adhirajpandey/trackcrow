import type { RuleActionStatus } from "@/generated/prisma-rewrite";
import type { ServiceResult } from "@/server/shared/result";

import type { CreateRuleBody, UpdateRuleBody } from "./schemas";

export type RuleDto = {
  uuid: string;
  name: string;
  isEnabled: boolean;
  actionStatus: RuleActionStatus;
  conditions: { recipient: { equals: string } };
  recipient: { uuid: string; displayName: string };
  action: {
    categoryUuid: string | null;
    categoryName: string | null;
    subcategoryUuid: string | null;
    subcategoryName: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

export type RuleListDto = {
  rules: RuleDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};

export type ListRulesInput = {
  userUuid: string;
  page?: number;
  size?: number;
  q?: string;
  status?: "enabled" | "disabled" | "needsRepair";
};

export type CreateRuleInput = CreateRuleBody & { userUuid: string };
export type UpdateRuleInput = UpdateRuleBody & { userUuid: string; ruleUuid: string };
export type RuleLookupInput = { userUuid: string; ruleUuid: string };
export type RuleMutationError =
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RULE_RECIPIENT_CONFLICT"
  | "INTERNAL_ERROR";
export type RuleMutationResult = ServiceResult<RuleDto, RuleMutationError>;
