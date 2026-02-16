import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateSession } from '@/common/server';
import { toolFail, toolOk, type ToolResult } from '@/app/crow-bot/tools/contracts';
import { logger } from '@/lib/logger';

const totalSpendSchema = z.object({
  category: z.string().nullable().optional(),
  subcategory: z.string().nullable().optional(),
  remarks: z.string().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export async function runTotalSpend(input: any): Promise<ToolResult<any>> {
  const structured = 'structured_data' in input ? input.structured_data : input;
  const parsed = totalSpendSchema.parse(structured);

  const { category, subcategory, remarks, startDate, endDate } = parsed;
  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return toolFail('UNAUTHORIZED', sessionResult.error || 'User not authenticated.');
  }

  const { userUuid } = sessionResult;

  try {
    const whereClause: any = { user_uuid: userUuid };

    if (start && end) whereClause.timestamp = { gte: start, lte: end };
    else if (start) whereClause.timestamp = { gte: start };
    else if (end) whereClause.timestamp = { lte: end };

    let categoryRecord = null;
    let subcatRecord = null;

    if (category?.trim()) {
      categoryRecord = await prisma.category.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: category.trim(), mode: 'insensitive' },
        },
      });
    }

    if (subcategory?.trim()) {
      subcatRecord = await prisma.subcategory.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: subcategory.trim(), mode: 'insensitive' },
          ...(categoryRecord && { categoryId: categoryRecord.id }),
        },
      });
    }

    if (!categoryRecord && subcatRecord) {
      categoryRecord = await prisma.category.findFirst({
        where: { id: subcatRecord.categoryId },
      });
    }

    if (categoryRecord) whereClause.categoryId = categoryRecord.id;
    if (subcatRecord) whereClause.subcategoryId = subcatRecord.id;

    if (remarks?.trim()) {
      whereClause.remarks = { contains: remarks.trim(), mode: 'insensitive' };
    }

    const total = await prisma.transaction.aggregate({
      _sum: { amount: true },
      where: whereClause,
    });

    const totalAmount = Number(total._sum.amount || 0);

    let timeRange = 'of all time';
    if (start && end) timeRange = `between ${start.toDateString()} and ${end.toDateString()}`;
    else if (start) timeRange = `since ${start.toDateString()}`;
    else if (end) timeRange = `till ${end.toDateString()}`;

    const filters: string[] = [];
    if (categoryRecord) filters.push(`Category: ${categoryRecord.name}`);
    if (subcatRecord) filters.push(`Subcategory: ${subcatRecord.name}`);
    if (remarks) filters.push(`Remarks: "${remarks}"`);

    const filterText = filters.length ? ` (${filters.join(', ')})` : '';

    const message =
      totalAmount > 0
        ? `💵 Total spending ${timeRange}${filterText}: ₹${totalAmount.toLocaleString('en-IN')}`
        : `⚠️ No transactions found ${timeRange}${filterText}.`;

    return toolOk({
      message,
      result: {
        totalSpent: totalAmount,
        category: categoryRecord?.name ?? null,
        subcategory: subcatRecord?.name ?? null,
        remarks: remarks ?? null,
        startDate: start?.toISOString() ?? null,
        endDate: end?.toISOString() ?? null,
      },
    });
  } catch (error) {
    logger.error('runTotalSpend - Failed total spend', error as Error);
    return toolFail('INTERNAL_ERROR', 'Failed to calculate total spend.');
  }
}

export const totalSpendTool = ({
  name: 'totalSpend',
  description:
    'Calculates total spending within a timeframe, optionally filtered by category, subcategory or remarks.',
  inputSchema: totalSpendSchema,
  execute: runTotalSpend,
});
