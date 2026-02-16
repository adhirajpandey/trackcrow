import { NextResponse } from 'next/server';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import {
  createSmsTransaction,
  parseTokenFromAuthHeader,
} from '@/services/transactions/transaction-service';

const requestSchema = z.object({
  data: z.object({
    message: z.string().min(1, 'message is required'),
  }),
  metadata: z.object({
    location: z.string().nullable().optional(),
  }),
});

export async function POST(req: Request) {
  try {
    logger.info('POST /api/transactions/sms - Starting SMS transaction processing');

    const token = parseTokenFromAuthHeader(req.headers.get('authorization'));

    let json: unknown;
    try {
      json = await req.json();
    } catch {
      return NextResponse.json({ message: 'Invalid JSON body' }, { status: 400 });
    }

    const parsed = requestSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid payload', issues: parsed.error.issues },
        { status: 400 }
      );
    }

    const result = await createSmsTransaction({
      token,
      message: parsed.data.data.message,
      location: parsed.data.metadata.location,
    });

    if (!result.ok) {
      if (result.error === 'UNAUTHORIZED') {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
      }

      if (result.error === 'UNPROCESSABLE') {
        return NextResponse.json(
          {
            message: 'Unable to extract required fields from message',
            ...(result.details as Record<string, unknown>),
          },
          { status: 422 }
        );
      }

      return NextResponse.json(
        { message: 'Internal Server Error' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Transaction created',
        id: result.data.id,
        uuid: result.data.uuid,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('POST /api/transactions/sms - Unexpected error', error as Error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
