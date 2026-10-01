import assert from 'node:assert/strict';
import test from 'node:test';
import { decodeFilters, encodeFilters, hasExtraFilters } from './transaction-filters';
test('route params round trip multiple categories, commas, unicode and recipient scope', () => {
  const filters = {
    category: ['Food, drink', 'Travel / café', 'Uncategorized'],
    subcategory: ['Coffee, tea'],
    classificationSource: ['MANUAL', 'RULE'] as ('MANUAL' | 'RULE')[],
    recipientUuid: 'recipient-id',
    q: 'payment',
    startDate: '2026-09-01',
    endDate: '2026-09-30',
    sortBy: 'amount' as const,
    sortOrder: 'asc' as const,
  };
  assert.deepEqual(decodeFilters(encodeFilters(filters)), filters);
});
test('repeated params work and invalid enum values and dates are dropped', () => {
  assert.deepEqual(
    decodeFilters({
      category: ['Food', 'Food', 'Uncategorized'],
      classificationSource: ['SMS', 'RULE'],
      sortBy: 'invalid',
      sortOrder: 'bad',
      startDate: '2026-02-30',
      endDate: '2026-03-01',
    }),
    {
      category: ['Food', 'Uncategorized'],
      classificationSource: ['RULE'],
      sortBy: 'timestamp',
      sortOrder: 'desc',
    },
  );
  assert.deepEqual(decodeFilters({ category: '[bad json' }), { sortBy: 'timestamp', sortOrder: 'desc' });
});
test('encoding a clear removes old filter and recipient params', () => {
  const encoded = encodeFilters({});
  assert.equal(encoded.category, '[]');
  assert.equal(encoded.recipientUuid, '');
  assert.equal(encoded.q, '');
  assert.deepEqual(decodeFilters(encoded), { sortBy: 'timestamp', sortOrder: 'desc' });
  assert.equal(hasExtraFilters(decodeFilters(encoded)), false);
  assert.equal(hasExtraFilters({ category: ['Uncategorized'] }), true);
  assert.equal(hasExtraFilters({ sortOrder: 'asc' }), true);
  assert.equal(hasExtraFilters({ startDate: '2026-09-01', endDate: '2026-09-30' }), false);
});
