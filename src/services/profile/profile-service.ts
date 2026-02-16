import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { logger } from '@/lib/logger';
import { fail, ok, type ServiceResult } from '@/services/shared/result';

export async function getOrCreateTokenService(input: {
  userUuid: string;
}): Promise<ServiceResult<{ token: string }, 'INTERNAL_ERROR'>> {
  try {
    const user = await prisma.user.findUnique({
      where: { uuid: input.userUuid },
      select: { lt_token: true },
    });

    if (user?.lt_token) {
      return ok({ token: user.lt_token });
    }

    const token = randomBytes(16).toString('hex');
    await prisma.user.update({
      where: { uuid: input.userUuid },
      data: { lt_token: token },
    });

    return ok({ token });
  } catch (error) {
    logger.error('getOrCreateTokenService - Failed token operation', error as Error, {
      userUuid: input.userUuid,
    });
    return fail('INTERNAL_ERROR');
  }
}

export async function revokeTokenService(input: {
  userUuid: string;
}): Promise<ServiceResult<{ success: true }, 'INTERNAL_ERROR'>> {
  try {
    await prisma.user.update({
      where: { uuid: input.userUuid },
      data: { lt_token: null },
      select: { uuid: true },
    });

    return ok({ success: true });
  } catch (error) {
    logger.error('revokeTokenService - Failed token revocation', error as Error, {
      userUuid: input.userUuid,
    });
    return fail('INTERNAL_ERROR');
  }
}
