import type { Transaction } from './api/transactions';
import { istDateKey } from './transaction-dates';
export type LedgerItem =
  | { kind: 'day'; key: string; day: string; total: number; count: number }
  | { kind: 'transaction'; key: string; transaction: Transaction };
/** Preserve server order (including amount sort) and group contiguous day runs. */
export function groupTransactionDays(transactions: Transaction[]): LedgerItem[] {
  const seen = new Set<string>();
  const rows = transactions.filter((row) => {
    if (seen.has(row.uuid)) return false;
    seen.add(row.uuid);
    return true;
  });
  const totals = new Map<string, { total: number; count: number }>();
  for (const row of rows) {
    const day = istDateKey(row.timestamp);
    const current = totals.get(day) ?? { total: 0, count: 0 };
    totals.set(day, { total: current.total + row.amount, count: current.count + 1 });
  }
  const items: LedgerItem[] = [];
  let previous: string | undefined;
  for (const row of rows) {
    const day = istDateKey(row.timestamp);
    if (day !== previous)
      items.push({ kind: 'day', key: `day:${day}:${row.uuid}`, day, ...totals.get(day)! });
    items.push({ kind: 'transaction', key: row.uuid, transaction: row });
    previous = day;
  }
  return items;
}
