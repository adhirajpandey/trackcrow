import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateSession } from '@/common/server';
import { toolFail, toolOk, type ToolResult } from '@/app/crow-bot/tools/contracts';
import { logger } from '@/lib/logger';

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

export const recordExpenseSchema = z.object({}).passthrough();

function extractTransactionFields(structured_data: any) {
  if (!structured_data || typeof structured_data !== 'object') {
    logger.warn('Invalid structured_data passed to recordExpenseTool');
    return {};
  }

  const {
    amount = null,
    recipient = null,
    recipient_name = null,
    category = null,
    subcategory = null,
    type = 'UPI',
    remarks = '',
    description = '',
    date = null,
    timestamp = null,
  } = structured_data;

  const parsedAmount =
    typeof amount === 'string'
      ? parseFloat(amount.replace(/[^0-9.]/g, ''))
      : amount;

  const parsedTimestamp = timestamp
    ? new Date(timestamp).toISOString()
    : date
      ? new Date(`${date}T00:00:00+05:30`).toISOString()
      : new Date().toISOString();

  return {
    amount: parsedAmount ?? 0,
    recipient: recipient ?? recipient_name ?? 'Unknown',
    recipient_name: recipient_name ?? recipient ?? 'Unknown',
    category,
    subcategory,
    type: type ?? 'UPI',
    remarks: remarks || description || '',
    timestamp: parsedTimestamp,
  };
}

export async function runRecordExpense(input: any): Promise<ToolResult<any>> {
  const structured =
    'structured_data' in input
      ? extractTransactionFields(input.structured_data)
      : extractTransactionFields(input);

  const {
    amount,
    recipient,
    recipient_name,
    category,
    subcategory,
    type,
    remarks,
    timestamp,
  } = structured;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return toolFail('UNAUTHORIZED', sessionResult.error || 'User not authenticated.');
  }
  const { userUuid } = sessionResult;

  const categoryRecord = await prisma.category.findFirst({
    where: {
      user_uuid: userUuid,
      name: { equals: category, mode: 'insensitive' },
    },
  });

  const subcategoryRecord = subcategory
    ? await prisma.subcategory.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: subcategory, mode: 'insensitive' },
        },
      })
    : null;

  if (!categoryRecord) {
    return toolFail(
      'VALIDATION_ERROR',
      `❌ Category "${category}" not found. Please add it first or select an existing one.`
    );
  }

  const validatedFields = addTransactionSchema.safeParse({
    amount,
    recipient,
    recipient_name,
    categoryId: categoryRecord.id,
    subcategoryId: subcategoryRecord?.id,
    type,
    remarks,
    timestamp,
  });

  if (!validatedFields.success) {
    return toolFail('VALIDATION_ERROR', 'Invalid transaction data', {
      issues: validatedFields.error.issues,
    });
  }

  const { categoryId, subcategoryId } = validatedFields.data;

  if (!timestamp) {
    return toolFail('VALIDATION_ERROR', 'Timestamp is required');
  }

  try {
    const transaction = await prisma.transaction.create({
      data: {
        user_uuid: userUuid,
        amount,
        recipient,
        recipient_name,
        categoryId,
        subcategoryId,
        type,
        remarks,
        timestamp: new Date(timestamp),
        input_mode: 'MANUAL',
        uuid: crypto.randomUUID(),
      },
      select: {
        id: true,
        uuid: true,
        amount: true,
        recipient: true,
        categoryId: true,
        subcategoryId: true,
        type: true,
        remarks: true,
        timestamp: true,
      },
    });

    return toolOk({
      message: `✅ Transaction logged: ${recipient} — ₹${amount} (${category}${
        subcategory ? ' / ' + subcategory : ''
      })`,
      transactionId: transaction.id,
      amount: transaction.amount,
      recipient: transaction.recipient,
      category,
      subcategory,
      type: transaction.type,
      remarks: transaction.remarks,
      timestamp: transaction.timestamp,
    });
  } catch (error) {
    logger.error('runRecordExpense - Failed to create transaction', error as Error);
    return toolFail('INTERNAL_ERROR', 'Failed to save transaction');
  }
}

export const recordExpenseTool = ({
  name: 'recordExpense',
  description:
    'Records a new financial transaction into the database and return a summary card.',
  inputSchema: recordExpenseSchema,
  execute: runRecordExpense,
});
