'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { TransactionSource, TransactionType } from '@/generated/prisma-rewrite';
import { unwrapOrResponse } from '@/server/api/responses';
import { requireSessionUser } from '@/server/auth/session';
import {
  deleteTransaction as deleteTransactionMutation,
  updateTransaction as updateTransactionMutation,
} from '@/server/modules/transactions/service';

const updateTransactionSchema = z.object({
  id: z.coerce.number().int().positive(),
  amount: z.coerce.number().positive(),
  recipientRaw: z.string().min(1),
  recipientName: z.string().optional().nullable(),
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
  type: z.nativeEnum(TransactionType).default(TransactionType.UPI),
  remarks: z.string().optional().nullable(),
  timestamp: z.coerce.date().optional().nullable(),
});

export async function updateTransaction(formData: FormData) {
  logger.info('updateTransaction - Starting transaction update');

  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return { error: 'Unauthorized' };
  }

  const parsed = updateTransactionSchema.safeParse({
    id: formData.get('id'),
    amount: formData.get('amount'),
    recipientRaw: formData.get('recipientRaw'),
    recipientName: formData.get('recipientName'),
    categoryId: formData.get('categoryId'),
    subcategoryId: formData.get('subcategoryId'),
    type: formData.get('type'),
    remarks: formData.get('remarks'),
    timestamp: formData.get('timestamp'),
  });

  if (!parsed.success) {
    return { error: 'Invalid fields', issues: parsed.error.issues } as const;
  }

  const result = await updateTransactionMutation({
    userUuid: sessionData.userUuid,
    ...parsed.data,
    timestamp: parsed.data.timestamp ?? new Date(),
    source: TransactionSource.MANUAL,
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

  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return { error: 'Unauthorized' };
  }

  const result = await deleteTransactionMutation(sessionData.userUuid, transactionId);

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
