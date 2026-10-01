import assert from 'node:assert/strict';
import test from 'node:test';
import {
  insightRange,
  previousInsightRange,
  insightGranularity,
  trendBuckets,
  rangeDays,
} from './insights-ranges';
import { dateRange } from './transaction-dates';
test('presets use IST today and cross calendar years', () => {
  const now = new Date('2026-12-31T18:30:00Z');
  assert.deepEqual(insightRange('this-month', now), { startDate: '2027-01-01', endDate: '2027-01-01' });
  assert.deepEqual(insightRange('last-month', now), { startDate: '2026-12-01', endDate: '2026-12-31' });
  assert.equal(insightRange('last-3-months', now).startDate, '2026-11-01');
  assert.equal(insightRange('last-6-months', now).startDate, '2026-08-01');
  assert.equal(insightRange('last-12-months', now).startDate, '2026-02-01');
  assert.equal(insightRange('this-year', now).startDate, '2027-01-01');
});
test('month-to-date comparison clamps February in leap and non-leap years', () => {
  for (const [year, end] of [
    ['2024', '29'],
    ['2025', '28'],
  ]) {
    assert.deepEqual(
      previousInsightRange('this-month', { startDate: `${year}-03-01`, endDate: `${year}-03-31` }),
      { startDate: `${year}-02-01`, endDate: `${year}-02-${end}` },
    );
  }
});
test('other comparisons have equal inclusive day counts without overlap', () => {
  const range = { startDate: '2024-02-01', endDate: '2024-02-29' };
  const previous = previousInsightRange('last-month', range);
  assert.equal(previous.endDate, '2024-01-31');
  assert.equal(rangeDays(previous), 29);
  assert.equal(previous.startDate, '2024-01-03');
  assert.equal(
    dateRange(range.startDate, range.endDate)!.startDate.toISOString(),
    '2024-01-31T18:30:00.000Z',
  );
});
test('custom ranges validate and retain inclusive dates', () => {
  const custom = { startDate: '2024-02-29', endDate: '2024-03-01' };
  assert.deepEqual(insightRange('custom', new Date('2024-03-10'), custom), custom);
  assert.equal(rangeDays(custom), 2);
  assert.equal(
    insightRange('custom', new Date('2024-03-10'), { startDate: 'bad', endDate: 'bad' }).startDate,
    '2024-03-01',
  );
});
test('granularity changes after 31 days and six calendar months', () => {
  assert.equal(insightGranularity({ startDate: '2026-01-01', endDate: '2026-01-31' }), 'day');
  assert.equal(insightGranularity({ startDate: '2026-01-01', endDate: '2026-02-01' }), 'week');
  assert.equal(insightGranularity({ startDate: '2026-01-01', endDate: '2026-06-30' }), 'week');
  assert.equal(insightGranularity({ startDate: '2026-01-01', endDate: '2026-07-01' }), 'month');
});
test('Monday weeks fill gaps and clip drill-downs to the selected period', () => {
  const buckets = trendBuckets({ startDate: '2026-09-30', endDate: '2026-10-07' }, 'week', [
    { period: '2026-09-28', totalSpend: 100, transactionCount: 2 },
  ]);
  assert.deepEqual(buckets, [
    {
      period: '2026-09-28',
      startDate: '2026-09-30',
      endDate: '2026-10-04',
      totalSpend: 100,
      transactionCount: 2,
    },
    {
      period: '2026-10-05',
      startDate: '2026-10-05',
      endDate: '2026-10-07',
      totalSpend: 0,
      transactionCount: 0,
    },
  ]);
});
test('daily and monthly buckets include empty periods and year transitions', () => {
  assert.equal(trendBuckets({ startDate: '2024-02-28', endDate: '2024-03-01' }, 'day', []).length, 3);
  const buckets = trendBuckets({ startDate: '2025-12-15', endDate: '2026-02-03' }, 'month', []);
  assert.deepEqual(
    buckets.map(({ startDate, endDate }) => [startDate, endDate]),
    [
      ['2025-12-15', '2025-12-31'],
      ['2026-01-01', '2026-01-31'],
      ['2026-02-01', '2026-02-03'],
    ],
  );
});
