'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { requireUserSession } from '@/services/auth/guard-service';
import {
  deleteTransactionById,
  updateManualTransaction,
} from '@/services/transactions/transaction-service';

const updateTransactionSchema = z.object({
  id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  recipient: z.string().min(1),
  recipient_name: z.string().optional().nullable(),
  categoryId: z
    .preprocess(
      (v) => (v === '' ? null : v),
      z.union([z.coerce.number().int().positive(), z.null()])
    )
    .optional(),
  subcategoryId: z
    .preprocess(
      (v) => (v === '' ? null : v),
      z.union([z.coerce.number().int().positive(), z.null()])
    )
    .optional(),
  type: z.enum(['UPI', 'CARD', 'CASH', 'NETBANKING', 'OTHER']).default('UPI'),
  remarks: z.string().optional().nullable(),
  timestamp: z.coerce.date().optional().nullable(),
});

export async function updateTransaction(formData: FormData) {
  logger.info('updateTransaction - Starting transaction update');

  const session = await requireUserSession();
  if (!session.ok) {
    return { error: 'Unauthorized' };
  }

  const parsed = updateTransactionSchema.safeParse({
    id: formData.get('id'),
    amount: formData.get('amount'),
    recipient: formData.get('recipient'),
    recipient_name: formData.get('recipient_name'),
    categoryId: formData.get('categoryId'),
    subcategoryId: formData.get('subcategoryId'),
    type: formData.get('type'),
    remarks: formData.get('remarks'),
    timestamp: formData.get('timestamp'),
  });

  if (!parsed.success) {
    return { error: 'Invalid fields', issues: parsed.error.issues } as const;
  }

  const result = await updateManualTransaction({
    userUuid: session.data.userUuid,
    ...parsed.data,
  });

  if (!result.ok) {
    if (result.error === 'NOT_FOUND') {
      return { error: 'Transaction not found' } as const;
    }

    return { error: 'Failed to update transaction' } as const;
  }

  revalidatePath('/transactions');
  revalidatePath(`/transactions/${parsed.data.id}`);
  return { message: 'Transaction updated successfully' } as const;
}

export async function deleteTransaction(transactionId: number) {
  logger.info('deleteTransaction - Starting transaction deletion', {
    transactionId,
  });

  const session = await requireUserSession();
  if (!session.ok) {
    return { error: 'Unauthorized' };
  }

  const result = await deleteTransactionById({
    userUuid: session.data.userUuid,
    transactionId,
  });

  if (!result.ok) {
    if (result.error === 'NOT_FOUND') {
      return { error: 'Transaction not found' };
    }

    return { error: 'Failed to delete transaction' };
  }

  revalidatePath('/transactions');
  revalidatePath(`/transactions/${transactionId}`);
  return { message: 'Transaction deleted successfully' };
}
