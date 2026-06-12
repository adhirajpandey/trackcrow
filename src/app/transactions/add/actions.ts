'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { logger } from '@/lib/logger';
import { TransactionSource, TransactionType } from '@/generated/prisma-rewrite';
import { unwrapOrResponse } from '@/server/api/responses';
import { requireSessionUser } from '@/server/auth/session';
import { createTransaction } from '@/server/modules/transactions/service';

const addTransactionSchema = z.object({
  amount: z.coerce.number().positive(),
  recipientRaw: z.string().min(1),
  recipientName: z.string().optional(),
  categoryId: z.coerce.number().int().positive(),
  subcategoryId: z.coerce.number().int().positive().optional(),
  type: z.nativeEnum(TransactionType).default(TransactionType.UPI),
  remarks: z.string().optional(),
  timestamp: z.coerce.date(),
});

export async function addTransaction(formData: FormData) {
  logger.info('addTransaction - Starting manual transaction creation');

  const session = await requireSessionUser();
  const sessionData = unwrapOrResponse(session);
  if (sessionData instanceof Response) {
    return { error: 'Unauthorized' };
  }

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

  const result = await createTransaction({
    userUuid: sessionData.userUuid,
    ...validatedFields.data,
    source: TransactionSource.MANUAL,
  });

  if (!result.ok) {
    return { error: 'Failed to create transaction' };
  }

  revalidatePath('/transactions');
  return { message: 'Transaction added successfully' };
}
