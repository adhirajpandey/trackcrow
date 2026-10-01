import type { Credentials } from '../../lib/api/client';
import { categorizeTransaction, type Transaction } from '../../lib/api/transactions';

export type UndoClassificationOptions = {
  credentials: Credentials;
  transaction: Pick<Transaction, 'uuid' | 'categoryUuid' | 'subcategoryUuid'>;
  onRestored: () => void;
  onError: (error: unknown) => void;
  invalidate: () => Promise<unknown>;
};

export async function undoClassification({
  credentials,
  transaction,
  onRestored,
  onError,
  invalidate,
}: UndoClassificationOptions) {
  try {
    await categorizeTransaction(credentials, transaction.uuid, {
      categoryUuid: transaction.categoryUuid,
      subcategoryUuid: transaction.subcategoryUuid,
    });
    onRestored();
  } catch (error) {
    onError(error);
  } finally {
    await invalidate();
  }
}
