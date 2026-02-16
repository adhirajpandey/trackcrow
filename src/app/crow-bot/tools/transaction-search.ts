import { z } from 'zod';
import { validateSession } from '@/common/server';
import { toolFail, toolOk, type ToolResult } from '@/app/crow-bot/tools/contracts';

const transactionSearchSchema = z.object({
  recipient: z.string().nullable().optional(),
  category: z.string().nullable().optional(),
  keyword: z.string().nullable().optional(),
  startDate: z.string().nullable().optional(),
  endDate: z.string().nullable().optional(),
});

export async function runTransactionSearch(input: any): Promise<ToolResult<any>> {
  const structured = 'structured_data' in input ? input.structured_data : input;
  const { recipient, category, keyword, startDate, endDate } =
    transactionSearchSchema.parse(structured);

  const session = await validateSession();
  if (!session.success) {
    return toolFail('UNAUTHORIZED', session.error || 'User not authenticated.');
  }

  const queryTerms = [recipient, keyword]
    .filter((v) => v && v.trim().length > 0)
    .join(' ')
    .trim();

  const params = new URLSearchParams({
    page: '1',
    sortBy: 'timestamp',
    sortOrder: 'desc',
    month: 'all',
  });

  if (queryTerms) params.set('q', queryTerms);
  if (category && category.trim()) params.set('category', category.trim());
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const relativeUrl = `/transactions?${params.toString()}`;
  const origin = process.env.NEXT_PUBLIC_APP_URL?.trim();
  const searchUrl = origin ? `${origin}${relativeUrl}` : relativeUrl;

  return toolOk({
    message: 'Your filtered transactions are ready to view.',
    searchUrl,
    filters: { recipient, category, keyword, startDate, endDate },
  });
}

export const transactionSearchTool = ({
  name: 'transactionSearch',
  description:
    'Builds a filtered transaction search link based on recipient, category, or date range.',
  inputSchema: transactionSearchSchema,
  execute: runTransactionSearch,
});
