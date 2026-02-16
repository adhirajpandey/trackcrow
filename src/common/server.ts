import { type Transaction } from '@/common/schemas';
import { requireOwnedTransaction, requireUserSession } from '@/services/auth/guard-service';
import {
  getUserCategoriesService,
  getUserDetailsService,
  getUserTransactionsService,
} from '@/services/users/user-service';

export async function getUserTransactions(
  userUuid: string,
  includeCategoryAndSubcategory: boolean = false,
  startDate?: Date,
  endDate?: Date
): Promise<Transaction[]> {
  const result = await getUserTransactionsService(
    userUuid,
    includeCategoryAndSubcategory,
    startDate,
    endDate
  );

  if (!result.ok) {
    throw new Error('Database error');
  }

  return result.data;
}

export async function getUserDetails(userUuid: string) {
  const result = await getUserDetailsService(userUuid);
  if (!result.ok) {
    throw new Error('Database error');
  }

  return result.data;
}

export async function validateSession(): Promise<
  { success: true; userUuid: string } | { success: false; error: string }
> {
  const result = await requireUserSession();
  if (!result.ok) {
    return { success: false, error: 'Unauthorized' };
  }

  return { success: true, userUuid: result.data.userUuid };
}

export async function validateTransactionOwnership(
  transactionId: number,
  userUuid: string
): Promise<
  | { success: true; transaction: any }
  | { success: false; error: string }
> {
  const result = await requireOwnedTransaction(transactionId, userUuid);
  if (!result.ok) {
    if (result.error === 'NOT_FOUND') {
      return { success: false, error: 'Transaction not found' };
    }

    return { success: false, error: 'Database error' };
  }

  return { success: true, transaction: result.data.transaction };
}

export async function getSessionUser() {
  const session = await requireUserSession();
  if (!session.ok) {
    throw new Error('Unauthorized');
  }

  return session.data.userUuid;
}

export async function getUserCategories(userUuid: string) {
  const result = await getUserCategoriesService(userUuid);
  if (!result.ok) {
    throw new Error('Database error');
  }

  return result.data;
}
