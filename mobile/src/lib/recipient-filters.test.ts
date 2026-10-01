import assert from 'node:assert/strict';
import test from 'node:test';
import { emptyRecipientBounds, parseRecipientBounds } from './recipient-filters';

test('empty bounds omit filters and zero bounds are preserved', () => {
  assert.deepEqual(parseRecipientBounds(emptyRecipientBounds), { filters: {} });
  assert.deepEqual(parseRecipientBounds({ ...emptyRecipientBounds, minTransactionCount: '0', maxTotalAmount: '0' }),
    { filters: { minTransactionCount: 0, maxTotalAmount: 0 } });
});
test('counts must be whole and amounts may be fractional', () => {
  assert.ok(parseRecipientBounds({ ...emptyRecipientBounds, minTransactionCount: '1.5' }).error);
  assert.deepEqual(parseRecipientBounds({ ...emptyRecipientBounds, minTotalAmount: '12.50' }),
    { filters: { minTotalAmount: 12.5 } });
});
test('rejects negative, non-finite, malformed and inverted bounds', () => {
  for (const value of ['-1', 'Infinity', 'NaN', '1e5', '0x10', '12,000']) {
    assert.ok(parseRecipientBounds({ ...emptyRecipientBounds, minTotalAmount: value }).error);
  }
  assert.ok(parseRecipientBounds({ ...emptyRecipientBounds, minTotalAmount: '10', maxTotalAmount: '9' }).error);
  assert.ok(parseRecipientBounds({ ...emptyRecipientBounds, minTransactionCount: '2', maxTransactionCount: '1' }).error);
  assert.equal(parseRecipientBounds({ ...emptyRecipientBounds, minTotalAmount: '10', maxTotalAmount: '10' }).error, undefined);
});
