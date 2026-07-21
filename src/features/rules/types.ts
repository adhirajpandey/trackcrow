import type { CategoryOption } from "@/common/types";
import type { RecipientListItemDto } from "@/features/recipients/types";

export type RuleStatus = "enabled" | "disabled" | "needsRepair";
export type RuleDto = {
  uuid: string;
  name: string;
  isEnabled: boolean;
  actionStatus: "VALID" | "NEEDS_REPAIR";
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
export type RuleListResponse = {
  rules: RuleDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
};
export type RulesQuery = { page: number; pageSize: number; q: string; status?: RuleStatus };
export type RuleMutationInput = {
  name: string;
  isEnabled: boolean;
  conditions: { recipient: { equals: string } };
  action: { categoryUuid: string; subcategoryUuid: string | null };
};
export type RulesPageInitialData = {
  initialRules: RuleListResponse;
  initialQuery: RulesQuery;
  categories: CategoryOption[];
  recipients: RecipientListItemDto[];
  initialForm: RuleDto | null;
  initialPrefill: {
    recipientUuid: string;
    categoryUuid: string;
    subcategoryUuid: string | null;
  } | null;
};
