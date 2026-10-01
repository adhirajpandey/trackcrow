import assert from 'node:assert/strict';
import test from 'node:test';
import {
  dateRange,
  isDateKey,
  istDateKey,
  istDateTime,
  monthPeriod,
  parseIstDateTime,
} from './transaction-dates';
test('IST dates cross the UTC midnight boundary at 18:30', () => {
  assert.equal(istDateKey('2026-09-30T18:29:59.999Z'), '2026-09-30');
  assert.equal(istDateKey('2026-09-30T18:30:00.000Z'), '2026-10-01');
});
test('month chips cross years and use leap-year month ends', () => {
  assert.deepEqual(monthPeriod(-1, new Date('2026-01-01T00:00:00Z')), {
    label: 'Dec 2025',
    startDate: '2025-12-01',
    endDate: '2025-12-31',
  });
  assert.equal(monthPeriod(-1, new Date('2024-03-15T00:00:00Z')).endDate, '2024-02-29');
  assert.equal(monthPeriod(0, new Date('2026-09-30T18:30:00Z')).startDate, '2026-10-01');
});
test('custom ranges cover inclusive IST days', () => {
  const range = dateRange('2024-02-29', '2024-02-29')!;
  assert.equal(range.startDate.toISOString(), '2024-02-28T18:30:00.000Z');
  assert.equal(range.endDate.toISOString(), '2024-02-29T18:29:59.999Z');
  assert.equal(dateRange('2026-02-29', '2026-03-01'), null);
  assert.equal(dateRange('2026-10-02', '2026-10-01'), null);
  assert.equal(isDateKey('2026-13-01'), false);
  assert.equal(isDateKey('2026-2-01'), false);
});
test('editable date/time round trips IST independent of device timezone', () => {
  assert.equal(istDateTime('2026-09-30T18:30:00Z'), '2026-10-01 00:00');
  assert.equal(parseIstDateTime('2026-10-01 00:00'), '2026-09-30T18:30:00.000Z');
  for (const invalid of ['2026-02-30 12:00', '2026-01-01 24:00', '2026-01-01 12:60', '', '2026-01-01'])
    assert.equal(parseIstDateTime(invalid), null);
});
