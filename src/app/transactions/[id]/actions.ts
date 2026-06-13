'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { TRANSACTION_TYPES } from '@/common/types';
import {
  deleteManualTransaction,
  getApiErrorMessage,
  updateManualTransaction,
} from '@/lib/internal-api';
import { logger } from '@/lib/logger';

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
  type: z.enum(TRANSACTION_TYPES).default('UPI'),
  remarks: z.string().optional().nullable(),
  timestamp: z.coerce.date().optional().nullable(),
});

export async function updateTransaction(formData: FormData) {
  logger.info('updateTransaction - Starting transaction update');

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

  try {
    await updateManualTransaction(parsed.data.id, {
      amount: parsed.data.amount,
      recipientRaw: parsed.data.recipientRaw,
      recipientName: parsed.data.recipientName ?? null,
      categoryId: parsed.data.categoryId ?? null,
      subcategoryId: parsed.data.subcategoryId ?? null,
      type: parsed.data.type,
      remarks: parsed.data.remarks ?? null,
      timestamp: (parsed.data.timestamp ?? new Date()).toISOString(),
    });
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to update transaction') } as const;
  }

  revalidatePath('/transactions');
  revalidatePath(`/transactions/${parsed.data.id}`);
  return { message: 'Transaction updated successfully' } as const;
}

export async function deleteTransaction(transactionId: number) {
  logger.info('deleteTransaction - Starting transaction deletion', {
    transactionId,
  });
  try {
    await deleteManualTransaction(transactionId);
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to delete transaction') };
  }

  revalidatePath('/transactions');
  revalidatePath(`/transactions/${transactionId}`);
  return { message: 'Transaction deleted successfully' };
}
