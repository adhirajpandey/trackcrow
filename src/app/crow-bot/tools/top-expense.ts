import { z } from 'zod';
import prisma from '@/lib/prisma';
import { validateSession } from '@/common/server';
import { toolFail, toolOk, type ToolResult } from '@/app/crow-bot/tools/contracts';
import { logger } from '@/lib/logger';

const topExpenseSchema = z.object({
  category: z.string().nullable().optional(),
  startDate: z.string().datetime().nullable().optional(),
  endDate: z.string().datetime().nullable().optional(),
});

export async function runTopExpense(input: any): Promise<ToolResult<any>> {
  const structured = 'structured_data' in input ? input.structured_data : input;
  const parsed = topExpenseSchema.parse(structured);
  const { category, startDate, endDate } = parsed;

  const start = startDate ? new Date(startDate) : undefined;
  const end = endDate ? new Date(endDate) : undefined;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return toolFail('UNAUTHORIZED', sessionResult.error || 'User not authenticated.');
  }

  const { userUuid } = sessionResult;

  try {
    const mode =
      category && start && end
        ? 'category+time'
        : category
          ? 'category-only'
          : start || end
            ? 'time-only'
            : 'all';

    const whereClause: any = { user_uuid: userUuid };

    if (start && end) whereClause.timestamp = { gte: start, lte: end };
    else if (start) whereClause.timestamp = { gte: start };
    else if (end) whereClause.timestamp = { lte: end };

    let categoryRecord: any = null;
    if (category) {
      categoryRecord = await prisma.category.findFirst({
        where: {
          user_uuid: userUuid,
          name: { equals: category, mode: 'insensitive' },
        },
      });

      if (!categoryRecord) {
        return toolFail('NOT_FOUND', `❌ Category "${category}" not found.`);
      }

      whereClause.categoryId = categoryRecord.id;
    }

    const [topTransaction] = await prisma.transaction.findMany({
      where: whereClause,
      orderBy: { amount: 'desc' },
      take: 1,
      select: {
        id: true,
        amount: true,
        remarks: true,
        timestamp: true,
        Category: { select: { name: true } },
        Subcategory: { select: { name: true } },
      },
    });

    if (!topTransaction) {
      return toolFail('NOT_FOUND', '⚠️ No transactions found for the selected filters.');
    }

    const result = {
      id: topTransaction.id,
      category:
        topTransaction.Category?.name ?? categoryRecord?.name ?? 'Unknown',
      subcategory: topTransaction.Subcategory?.name ?? null,
      amount: Number(topTransaction.amount),
      note: topTransaction.remarks ?? null,
      startDate: start?.toISOString() ?? null,
      endDate: end?.toISOString() ?? null,
    };

    let message = '';
    switch (mode) {
      case 'category+time':
        message = `Top ${category} expense between ${start?.toDateString()} and ${end?.toDateString()}.`;
        break;
      case 'category-only':
        message = `Top ${category} expense across all time.`;
        break;
      case 'time-only':
        message = `Top expense for the selected time window.`;
        break;
      default:
        message = 'Top expense across all transactions.';
        break;
    }

    return toolOk({ message, result });
  } catch (error) {
    logger.error('runTopExpense - Failed to fetch top expense', error as Error);
    return toolFail('INTERNAL_ERROR', 'Failed to calculate top expense.');
  }
}

export const topExpenseTool = ({
  name: 'topExpense',
  description:
    'Finds the single highest-value transaction, adapting automatically to whether category/time filters are provided.',
  inputSchema: topExpenseSchema,
  execute: runTopExpense,
});
