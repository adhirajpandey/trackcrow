'use server';

import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';

export type TokenActionState = {
  token?: string | null;
  error?: string | null;
};

export type RevokeTokenActionState = {
  success?: boolean;
  error?: string | null;
};

export async function getOrCreateTokenAction(): Promise<TokenActionState> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return { error: 'Unauthorized' };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { uuid: session.user.uuid },
      select: { lt_token: true },
    });

    if (user?.lt_token) {
      return { token: user.lt_token };
    }

    const token = randomBytes(16).toString('hex');
    await prisma.user.update({ where: { uuid: session.user.uuid }, data: { lt_token: token } });
    return { token };
  } catch {
    return { error: 'Failed to get token' };
  }
}

export async function revokeTokenAction(): Promise<RevokeTokenActionState> {
  const session = await getServerSession(authOptions);
  if (!session || !session.user?.uuid) {
    return { error: 'Unauthorized' };
  }

  try {
    await prisma.user.update({
      where: { uuid: session.user.uuid },
      data: { lt_token: null },
      select: { uuid: true },
    });
    return { success: true };
  } catch {
    return { error: 'Failed to revoke token' };
  }
}
