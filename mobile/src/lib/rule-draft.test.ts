import assert from 'node:assert/strict';
import test from 'node:test';
import { newRuleDraft, ruleDraftInput } from './rule-draft';

const recipient = { uuid: 'recipient', displayName: 'Merchant' };
const categories = [{ uuid: 'food', name: 'Food', subcategories: [{ uuid: 'cafe', name: 'Cafe', categoryUuid: 'food' }] }];
const draft = { ...newRuleDraft(recipient), name: ' Food rule ', categoryUuid: 'food' };
test('requires a name, recipient and valid category for categorization', () => {
  assert.equal(ruleDraftInput(newRuleDraft(), categories), null);
  assert.equal(ruleDraftInput({ ...draft, recipient: null }, categories), null);
  assert.equal(ruleDraftInput({ ...draft, name: ' '.repeat(10) }, categories), null);
  assert.equal(ruleDraftInput({ ...draft, name: 'a'.repeat(101) }, categories), null);
  assert.equal(ruleDraftInput({ ...draft, categoryUuid: 'deleted' }, categories), null);
  assert.equal(ruleDraftInput({ ...draft, subcategoryUuid: 'unrelated' }, categories), null);
});
test('categorization preserves category, subcategory and enabled choice', () => {
  assert.deepEqual(ruleDraftInput({ ...draft, subcategoryUuid: 'cafe', isEnabled: false }, categories), {
    name: 'Food rule', isEnabled: false, conditions: { recipient: { equals: 'recipient' } },
    action: { type: 'CATEGORIZE', categoryUuid: 'food', subcategoryUuid: 'cafe' },
  });
});
test('Ignore strips stale category fields and works without category data', () => {
  assert.deepEqual(ruleDraftInput({ ...draft, actionType: 'IGNORE', subcategoryUuid: 'deleted' }, []), {
    name: 'Food rule', isEnabled: true, conditions: { recipient: { equals: 'recipient' } }, action: { type: 'IGNORE' },
  });
});
