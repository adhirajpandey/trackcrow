import assert from 'node:assert/strict';
import test from 'node:test';
import { draftInput, transactionDraft } from './transaction-draft';
import type { Transaction } from './api/transactions';
const original = {
  amount: 428.5,
  type: 'UPI',
  timestamp: '2026-09-30T18:31:29.123Z',
  categoryUuid: 'food',
  subcategoryUuid: 'delivery',
  accountUuid: 'account',
  reference: 'ref',
  remarks: 'Lunch',
  locationRaw: null,
} as Transaction;
test('editing the amount preserves timestamp seconds, account and classification', () => {
  const draft = { ...transactionDraft(original), amount: '500' };
  const input = draftInput(draft, original)!;
  assert.equal(input.timestamp, original.timestamp);
  assert.equal(input.amount, 500);
  assert.equal(input.categoryUuid, 'food');
  assert.equal(input.subcategoryUuid, 'delivery');
  assert.equal(input.accountUuid, 'account');
});
test('changing the visible date/time converts IST once and trims optional fields', () => {
  const draft = {
    ...transactionDraft(original),
    time: '2026-10-02 12:30',
    reference: '  ',
    remarks: ' note ',
  };
  const input = draftInput(draft, original)!;
  assert.equal(input.timestamp, '2026-10-02T07:00:00.000Z');
  assert.equal(input.reference, null);
  assert.equal(input.remarks, 'note');
});
test('manual drafts start at the current IST time and require a positive finite amount', () => {
  const draft = transactionDraft(undefined, new Date('2026-09-30T18:30:00Z'));
  assert.equal(draft.time, '2026-10-01 00:00');
  assert.equal(draft.categoryUuid, null);
  for (const amount of ['', ' ', '0', '-1', 'Infinity', 'NaN', '1.2.3'])
    assert.equal(draftInput({ ...draft, amount }), null);
  assert.equal(draftInput({ ...draft, amount: '0.5' })!.amount, 0.5);
});
