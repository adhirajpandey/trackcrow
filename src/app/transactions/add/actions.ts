'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { TRANSACTION_TYPES } from '@/common/types';
import { createManualTransaction, getApiErrorMessage } from '@/lib/internal-api';
import { logger } from '@/lib/logger';

const addTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  recipientRaw: z.string().min(1),
  recipientName: z.string().optional(),
  categoryId: z.coerce.number().int().positive(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(TRANSACTION_TYPES).default('UPI'),
  remarks: z.string().optional(),
  timestamp: z.coerce.date(),
});

export async function addTransaction(formData: FormData) {
  logger.info('addTransaction - Starting manual transaction creation');

  const getOpt = (v: FormDataEntryValue | null) => (v === null ? undefined : v);

  const validatedFields = addTransactionSchema.safeParse({
    amount: formData.get('amount'),
    recipientRaw: formData.get('recipientRaw'),
    recipientName: getOpt(formData.get('recipientName')),
    categoryId: formData.get('categoryId'),
    subcategoryId: getOpt(formData.get('subcategoryId')),
    type: formData.get('type'),
    remarks: getOpt(formData.get('remarks')),
    timestamp: formData.get('timestamp'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields', issues: validatedFields.error.issues };
  }

  try {
    await createManualTransaction({
      ...validatedFields.data,
      timestamp: validatedFields.data.timestamp.toISOString(),
    });
  } catch (error) {
    return { error: getApiErrorMessage(error, 'Failed to create transaction') };
  }

  revalidatePath('/transactions');
  return { message: 'Transaction added successfully' };
}
