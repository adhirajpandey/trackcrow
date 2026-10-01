import assert from 'node:assert/strict';
import test from 'node:test';
import { groupTransactionDays } from './transaction-days';
import type { Transaction } from './api/transactions';
const row = (uuid: string, timestamp: string, amount: number) => ({ uuid, timestamp, amount }) as Transaction;
test('day headers merge pagination boundaries, deduplicate entries and sum loaded values', () => {
  const rows = [
    row('a', '2026-09-30T19:00:00Z', 400),
    row('b', '2026-09-30T18:30:00Z', 12.5),
    row('b', '2026-09-30T18:30:00Z', 12.5),
    row('c', '2026-09-30T18:29:00Z', 100),
  ];
  const items = groupTransactionDays(rows);
  assert.deepEqual(
    items.filter((item) => item.kind === 'day').map(({ day, total, count }) => ({ day, total, count })),
    [
      { day: '2026-10-01', total: 412.5, count: 2 },
      { day: '2026-09-30', total: 100, count: 1 },
    ],
  );
  assert.equal(items.length, 5);
});
test('amount sorting keeps server order when days alternate', () => {
  const rows = [
    row('a', '2026-10-01T00:00:00Z', 400),
    row('b', '2026-09-30T00:00:00Z', 200),
    row('c', '2026-10-01T01:00:00Z', 100),
  ];
  const items = groupTransactionDays(rows);
  assert.deepEqual(
    items.filter((item) => item.kind === 'transaction').map((item) => item.transaction.uuid),
    ['a', 'b', 'c'],
  );
  assert.deepEqual(
    items.filter((item) => item.kind === 'day').map((item) => item.total),
    [500, 200, 500],
  );
  assert.equal(new Set(items.map((item) => item.key)).size, items.length);
});
test('empty lists have no headers', () => assert.deepEqual(groupTransactionDays([]), []));
