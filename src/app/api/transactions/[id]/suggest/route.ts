import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireUserSession } from '@/services/auth/guard-service';
import { suggestCategory } from '@/services/transactions/transaction-service';

export async function GET(request: NextRequest, context: any) {
  try {
    logger.info('GET /api/transactions/[id]/suggest - Starting suggestion request');

    const session = await requireUserSession();
    if (!session.ok) {
      logger.info('GET /api/transactions/[id]/suggest - Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const transactionId = Number(params.id);

    const result = await suggestCategory({
      userUuid: session.data.userUuid,
      transactionId,
    });

    if (!result.ok) {
      if (result.error === 'VALIDATION_ERROR') {
        return NextResponse.json({ error: 'Invalid transaction ID' }, { status: 400 });
      }
      if (result.error === 'NOT_FOUND') {
        return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
      }

      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (error) {
    logger.error('GET /api/transactions/[id]/suggest - Unexpected error', error as Error, {
      transactionId: (await context.params)?.id,
    });
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
