import { NextResponse } from 'next/server';
import { z } from 'zod';
import { userReadSchema } from '@/common/schemas';
import { logger } from '@/lib/logger';
import { requireUserSession } from '@/services/auth/guard-service';
import { getUserDetailsService } from '@/services/users/user-service';

export async function GET() {
  try {
    logger.info('GET /api/user/self - Starting user data fetch');

    const session = await requireUserSession();
    if (!session.ok) {
      logger.info('GET /api/user/self - Unauthorized request');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userDetails = await getUserDetailsService(session.data.userUuid);
    if (!userDetails.ok) {
      return NextResponse.json(
        { error: 'Internal Server Error' },
        { status: 500 }
      );
    }

    if (!userDetails.data) {
      throw new Error('User not found');
    }

    const validatedPayload = userReadSchema.parse(userDetails.data);
    return NextResponse.json(validatedPayload, { status: 200 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.issues }, { status: 400 });
    }

    logger.error('GET /api/user/self - Unexpected error', error as Error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
