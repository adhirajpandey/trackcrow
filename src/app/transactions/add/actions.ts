'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { requireUserSession } from '@/services/auth/guard-service';
import { createManualTransaction } from '@/services/transactions/transaction-service';

const addTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  recipient: z.string().min(1),
  recipient_name: z.string().optional(),
  categoryId: z.coerce.number().int().positive(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  type: z.enum(['UPI', 'CARD', 'CASH', 'NETBANKING', 'OTHER']).default('UPI'),
  remarks: z.string().optional(),
  timestamp: z.coerce.date(),
});

export async function addTransaction(formData: FormData) {
  logger.info('addTransaction - Starting manual transaction creation');

  const session = await requireUserSession();
  if (!session.ok) {
    return { error: 'Unauthorized' };
  }

  const getOpt = (v: FormDataEntryValue | null) => (v === null ? undefined : v);

  const validatedFields = addTransactionSchema.safeParse({
    amount: formData.get('amount'),
    recipient: formData.get('recipient'),
    recipient_name: getOpt(formData.get('recipient_name')),
    categoryId: formData.get('categoryId'),
    subcategoryId: getOpt(formData.get('subcategoryId')),
    type: formData.get('type'),
    remarks: getOpt(formData.get('remarks')),
    timestamp: formData.get('timestamp'),
  });

  if (!validatedFields.success) {
    return { error: 'Invalid fields', issues: validatedFields.error.issues };
  }

  const result = await createManualTransaction({
    userUuid: session.data.userUuid,
    ...validatedFields.data,
  });

  if (!result.ok) {
    return { error: 'Failed to create transaction' };
  }

  revalidatePath('/transactions');
  return { message: 'Transaction added successfully' };
}
