import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { requireUserSession } from '@/services/auth/guard-service';
import { listTransactions } from '@/services/transactions/transaction-service';

export async function GET(req: Request) {
  try {
    logger.info('GET /api/transactions - Starting transaction fetch');

    const session = await requireUserSession();
    if (!session.ok) {
      logger.info('GET /api/transactions - Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceResult = await listTransactions({
      userUuid: session.data.userUuid,
      searchParams: new URL(req.url).searchParams,
    });

    if (!serviceResult.ok) {
      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    }

    logger.info('GET /api/transactions - Successfully fetched transactions', {
      userUuid: session.data.userUuid,
      returnedCount: serviceResult.data.transactions.length,
      total: serviceResult.data.total,
      page: serviceResult.data.page,
      pageSize: serviceResult.data.pageSize,
    });

    return NextResponse.json(serviceResult.data, { status: 200 });
  } catch (error) {
    logger.error('GET /api/transactions - Unexpected error', error as Error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
