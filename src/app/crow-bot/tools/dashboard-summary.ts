import { z } from 'zod';
import { validateSession } from '@/common/server';
import { toolFail, toolOk, type ToolResult } from '@/app/crow-bot/tools/contracts';
import { logger } from '@/lib/logger';

const dashboardSummarySchema = z
  .object({
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
  })
  .passthrough();

function extractDashboardDates(structured_data: any) {
  if (!structured_data || typeof structured_data !== 'object') {
    logger.warn('Invalid structured_data passed to dashboardSummaryTool');
    return {};
  }

  const { startDate = null, endDate = null } = structured_data;

  const parsedStartDate = startDate
    ? new Date(startDate).toISOString()
    : new Date(new Date().setDate(1)).toISOString();

  const parsedEndDate = endDate
    ? new Date(endDate).toISOString()
    : new Date().toISOString();

  return { startDate: parsedStartDate, endDate: parsedEndDate };
}

export async function runDashboardSummary(input: any): Promise<
  ToolResult<{
    message: string;
    startDate?: string;
    endDate?: string;
  }>
> {
  const structured =
    'structured_data' in input
      ? extractDashboardDates(input.structured_data)
      : extractDashboardDates(input);

  const { startDate, endDate } = structured;

  const sessionResult = await validateSession();
  if (!sessionResult.success) {
    return toolFail('UNAUTHORIZED', sessionResult.error || 'User not authenticated.');
  }

  return toolOk({
    message: 'Ready to analyze? Your dashboard has the latest summary view.',
    startDate,
    endDate,
  });
}

export const dashboardSummaryTool = ({
  name: 'dashboardSummary',
  description:
    'Used when the user asks for an overview, summary, or dashboard of their finances',
  inputSchema: dashboardSummarySchema,
  execute: runDashboardSummary,
});
