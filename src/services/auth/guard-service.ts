import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { logger } from '@/lib/logger';
import { fail, ok, type ServiceResult } from '@/services/shared/result';

type SessionUserData = { userUuid: string };
type OwnershipData = { transaction: any };

export async function requireUserSession(): Promise<
  ServiceResult<SessionUserData, 'UNAUTHORIZED' | 'INTERNAL_ERROR'>
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.uuid) {
      return fail('UNAUTHORIZED');
    }
    return ok({ userUuid: session.user.uuid });
  } catch (error) {
    logger.error('requireUserSession - Failed to resolve session', error as Error);
    return fail('INTERNAL_ERROR');
  }
}

export async function requireOwnedTransaction(
  transactionId: number,
  userUuid: string
): Promise<ServiceResult<OwnershipData, 'NOT_FOUND' | 'INTERNAL_ERROR'>> {
  logger.debug('requireOwnedTransaction - Checking transaction ownership', {
    transactionId,
    userUuid,
  });

  try {
    const transaction = await prisma.transaction.findFirst({
      where: { id: transactionId, user_uuid: userUuid },
    });

    if (!transaction) {
      return fail('NOT_FOUND');
    }

    return ok({ transaction });
  } catch (error) {
    logger.error('requireOwnedTransaction - Database error', error as Error, {
      transactionId,
      userUuid,
    });
    return fail('INTERNAL_ERROR');
  }
}
