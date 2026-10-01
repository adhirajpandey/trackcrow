import type { Category } from './api/categories';
import type { Rule, RuleInput } from './api/rules';

export type RuleDraft = {
  name: string;
  recipient: { uuid: string; displayName: string } | null;
  actionType: 'CATEGORIZE' | 'IGNORE';
  categoryUuid: string | null;
  subcategoryUuid: string | null;
  isEnabled: boolean;
};
export function newRuleDraft(recipient: RuleDraft['recipient'] = null): RuleDraft {
  return { name: '', recipient, actionType: 'CATEGORIZE', categoryUuid: null, subcategoryUuid: null, isEnabled: true };
}
export function draftFromRule(rule: Rule): RuleDraft {
  return { name: rule.name, recipient: rule.recipient, actionType: rule.action.type,
    categoryUuid: rule.action.categoryUuid, subcategoryUuid: rule.action.subcategoryUuid,
    isEnabled: rule.isEnabled };
}
export function ruleDraftInput(draft: RuleDraft, categories: Category[]): RuleInput | null {
  const name = draft.name.trim();
  if (!name || name.length > 100 || !draft.recipient) return null;
  const base = { name, isEnabled: draft.isEnabled, conditions: { recipient: { equals: draft.recipient.uuid } } };
  if (draft.actionType === 'IGNORE') return { ...base, action: { type: 'IGNORE' } };
  const category = categories.find(item => item.uuid === draft.categoryUuid);
  if (!category || (draft.subcategoryUuid && !category.subcategories.some(item => item.uuid === draft.subcategoryUuid))) return null;
  return { ...base, action: { type: 'CATEGORIZE', categoryUuid: category.uuid, subcategoryUuid: draft.subcategoryUuid } };
}
