import assert from 'node:assert/strict';
import test from 'node:test';
import { recipientForm, reconcileRecipientForm } from './recipient-draft';

const original = { displayName: 'Original', note: 'Original note', updatedAt: 'first' };
const refreshed = { displayName: 'Renamed', note: 'Updated note', updatedAt: 'second' };
test('a clean recipient form adopts refetched name and note', () => {
  assert.deepEqual(reconcileRecipientForm(recipientForm(original), refreshed), recipientForm(refreshed));
});
test('refresh preserves an edited name and refreshes the untouched note', () => {
  const form = recipientForm(original);
  form.draft.name = 'My draft name';
  const result = reconcileRecipientForm(form, refreshed);
  assert.deepEqual(result.draft, { name: 'My draft name', note: 'Updated note' });
  assert.deepEqual(result.saved, { name: 'Renamed', note: 'Updated note' });
  assert.equal(result.updatedAt, 'second');
});
test('refresh preserves an edited note and refreshes the untouched name', () => {
  const form = recipientForm(original);
  form.draft.note = '';
  const result = reconcileRecipientForm(form, refreshed);
  assert.deepEqual(result.draft, { name: 'Renamed', note: '' });
  assert.deepEqual(result.saved, { name: 'Renamed', note: 'Updated note' });
});
test('refresh keeps both unsaved edits and normalizes a cleared server note', () => {
  const form = recipientForm(original);
  form.draft = { name: 'Local name', note: 'Local note' };
  const result = reconcileRecipientForm(form, { ...refreshed, note: null });
  assert.deepEqual(result.draft, form.draft);
  assert.deepEqual(result.saved, { name: 'Renamed', note: '' });
});
test('the same server version leaves local state unchanged', () => {
  const form = recipientForm(original);
  form.draft.name = 'Pending save';
  assert.equal(reconcileRecipientForm(form, original), form);
});
