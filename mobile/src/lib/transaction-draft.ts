import type { Transaction, TransactionInput, TransactionType } from './api/transactions';
import { istDateTime, parseIstDateTime } from './transaction-dates';
export type TransactionDraft = {
  amount: string;
  type: TransactionType;
  time: string;
  categoryUuid: string | null;
  subcategoryUuid: string | null;
  accountUuid: string | null;
  reference: string;
  remarks: string;
  locationRaw: string;
};
export function transactionDraft(txn?: Transaction, now = new Date()): TransactionDraft {
  return {
    amount: txn ? String(txn.amount) : '',
    type: txn?.type ?? 'UPI',
    time: istDateTime(txn?.timestamp ?? now.toISOString()),
    categoryUuid: txn?.categoryUuid ?? null,
    subcategoryUuid: txn?.subcategoryUuid ?? null,
    accountUuid: txn?.accountUuid ?? null,
    reference: txn?.reference ?? '',
    remarks: txn?.remarks ?? '',
    locationRaw: txn?.locationRaw ?? '',
  };
}
export function draftInput(
  draft: TransactionDraft,
  original?: Transaction,
): Omit<TransactionInput, 'recipientUuid'> | null {
  const amount = Number(draft.amount),
    parsed = parseIstDateTime(draft.time);
  if (!draft.amount.trim() || !Number.isFinite(amount) || amount <= 0 || !parsed) return null;
  return {
    amount,
    type: draft.type,
    timestamp: original && draft.time === istDateTime(original.timestamp) ? original.timestamp : parsed,
    categoryUuid: draft.categoryUuid,
    subcategoryUuid: draft.subcategoryUuid,
    accountUuid: draft.accountUuid,
    reference: draft.reference.trim() || null,
    remarks: draft.remarks.trim() || null,
    locationRaw: draft.locationRaw.trim() || null,
  };
}
