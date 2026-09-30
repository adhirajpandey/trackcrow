import {
  getJson,
  postJson,
  patchJson,
  deleteJson,
  queryString,
  type Credentials,
  type Page,
  type UuidResult,
} from './client';
export type RuleActionInput =
  | { type: 'IGNORE' }
  | { type?: 'CATEGORIZE'; categoryUuid: string; subcategoryUuid?: string | null };
export type RuleInput = {
  name: string;
  isEnabled: boolean;
  conditions: { recipient: { equals: string } };
  action: RuleActionInput;
};
export type Rule = Omit<RuleInput, 'action'> & {
  uuid: string;
  actionStatus: 'VALID' | 'NEEDS_REPAIR';
  recipient: { uuid: string; displayName: string };
  action: {
    type: 'IGNORE' | 'CATEGORIZE';
    categoryUuid: string | null;
    categoryName: string | null;
    subcategoryUuid: string | null;
    subcategoryName: string | null;
  };
  createdAt: string;
  updatedAt: string;
};
export type RuleFilters = { page?: number; size?: number; q?: string; status?: 'enabled' | 'disabled' | 'needsRepair' };
export const fetchRules = (c: Credentials, filters: RuleFilters = {}, signal?: AbortSignal) =>
  getJson<Page & { rules: Rule[] }>(c, `/api/rules${queryString(filters)}`, signal);
export const fetchRule = (c: Credentials, id: string, signal?: AbortSignal) =>
  getJson<Rule>(c, `/api/rules/${encodeURIComponent(id)}`, signal);
export const createRule = (c: Credentials, input: RuleInput) => postJson<Rule>(c, '/api/rules', input);
export const updateRule = (c: Credentials, id: string, input: Partial<RuleInput>) =>
  patchJson<Rule>(c, `/api/rules/${encodeURIComponent(id)}`, input);
export const deleteRule = (c: Credentials, id: string) =>
  deleteJson<UuidResult>(c, `/api/rules/${encodeURIComponent(id)}`);
