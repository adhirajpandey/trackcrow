'use server';

import {
  getOrCreateTokenService,
  revokeTokenService,
} from '@/services/profile/profile-service';
import { requireUserSession } from '@/services/auth/guard-service';

export type TokenActionState = {
  token?: string | null;
  error?: string | null;
};

export type RevokeTokenActionState = {
  success?: boolean;
  error?: string | null;
};

export async function getOrCreateTokenAction(): Promise<TokenActionState> {
  const session = await requireUserSession();
  if (!session.ok) {
    return { error: 'Unauthorized' };
  }

  const result = await getOrCreateTokenService({
    userUuid: session.data.userUuid,
  });

  if (!result.ok) {
    return { error: 'Failed to get token' };
  }

  return { token: result.data.token };
}

export async function revokeTokenAction(): Promise<RevokeTokenActionState> {
  const session = await requireUserSession();
  if (!session.ok) {
    return { error: 'Unauthorized' };
  }

  const result = await revokeTokenService({
    userUuid: session.data.userUuid,
  });

  if (!result.ok) {
    return { error: 'Failed to revoke token' };
  }

  return { success: true };
}
