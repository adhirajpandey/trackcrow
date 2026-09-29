import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatCurrency, formatPercent, formatTransactionTime, getMonthToDate } from './format';

test('formats rupees with Indian grouping and no decimals', () => {
  assert.equal(formatCurrency(0), '₹0');
  assert.equal(formatCurrency(640), '₹640');
  assert.equal(formatCurrency(48250.4), '₹48,250');
  assert.equal(formatCurrency(125000), '₹1,25,000');
  assert.equal(formatCurrency(12345678.9), '₹1,23,45,679');
  assert.equal(formatCurrency(-3499), '-₹3,499');
});

test('formats transaction times in IST relative to now', () => {
  const now = new Date('2026-09-29T12:00:00.000Z'); // 17:30 IST
  assert.equal(formatTransactionTime('2026-09-29T08:45:00.000Z', now), 'Today, 14:15');
  // 19:00 UTC on the 28th is 00:30 IST on the 29th.
  assert.equal(formatTransactionTime('2026-09-28T19:00:00.000Z', now), 'Today, 00:30');
  assert.equal(formatTransactionTime('2026-09-28T04:00:00.000Z', now), 'Yesterday, 09:30');
  assert.equal(formatTransactionTime('2026-09-24T08:35:00.000Z', now), '24 Sep, 14:05');
  assert.equal(formatTransactionTime('2025-12-31T10:00:00.000Z', now), '31 Dec 2025, 15:30');
});

test('builds the IST month-to-date range and its previous-month comparison', () => {
  const range = getMonthToDate(new Date('2026-09-29T12:00:00.000Z'));
  assert.equal(range.monthName, 'September');
  assert.equal(range.label, '1 SEP – 29 SEP');
  assert.equal(range.daysLeft, 1);
  assert.equal(range.startDate.toISOString(), '2026-08-31T18:30:00.000Z');
  assert.equal(range.endDate.toISOString(), '2026-09-29T18:29:59.999Z');
  assert.equal(range.previousStartDate.toISOString(), '2026-07-31T18:30:00.000Z');
  assert.equal(range.previousEndDate.toISOString(), '2026-08-29T18:29:59.999Z');
});

test('uses the IST date near midnight and clamps the comparison day', () => {
  // 20:00 UTC on 30 Apr is already 1 May in IST.
  assert.equal(getMonthToDate(new Date('2026-04-30T20:00:00.000Z')).monthName, 'May');
  const march = getMonthToDate(new Date('2026-03-31T06:00:00.000Z'));
  assert.equal(march.previousEndDate.toISOString(), '2026-02-28T18:29:59.999Z');
  const january = getMonthToDate(new Date('2026-01-15T06:00:00.000Z'));
  assert.equal(january.previousStartDate.toISOString(), '2025-11-30T18:30:00.000Z');
});

test('formats shares of a total', () => {
  assert.equal(formatPercent(18400, 48250), '38.1%');
  assert.equal(formatPercent(5, 0), '0%');
});
