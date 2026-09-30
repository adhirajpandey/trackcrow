import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  exchangeGoogleIdToken,
  fetchGoogleClientId,
  fetchRecentTransactions,
  normalizeApiUrl,
  revokeSession,
  type Credentials,
} from './api';
import { getGoogleIdToken, googleSignOut } from './google-sign-in';
import * as session from './session';
import { readStoredCredentials, storeCredentials, clearCredentials } from './credential-store';
import { smsImporter } from './sms-import-native';

type CredentialsState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; credentials: Credentials };

type CredentialsContextValue = {
  state: CredentialsState;
  /** Throws with a user-facing message. Leaves the current state unchanged on failure or cancel. */
  signInWithGoogle: (apiUrl: string) => Promise<session.GoogleSignInResult>;
  /** Validates against the transactions API before storing. Throws with a user-facing message. */
  connectWithToken: (apiUrl: string, token: string) => Promise<void>;
  /** Always clears local credentials, and reports whether the server token was revoked. */
  disconnect: () => Promise<session.ServerRevocation>;
};

const CredentialsContext = createContext<CredentialsContextValue | null>(null);

async function storeNewSession(credentials: Credentials) {
  await smsImporter.clear();
  await clearCredentials();
  await storeCredentials(credentials);
}

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CredentialsState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    readStoredCredentials()
      .then((credentials) => {
        if (!active) return;
        setState(credentials ? { status: 'ready', credentials } : { status: 'missing' });
      })
      .catch(() => {
        if (active) setState({ status: 'missing' });
      });
    return () => {
      active = false;
    };
  }, []);

  const signInWithGoogle = useCallback(async (apiUrl: string) => {
    const result = await session.signInWithGoogle(apiUrl, {
      fetchGoogleClientId,
      getGoogleIdToken,
      exchangeGoogleIdToken,
      storeCredentials: storeNewSession,
    });
    if (result.status === 'signed-in') setState({ status: 'ready', credentials: result.credentials });
    return result;
  }, []);

  const connectWithToken = useCallback(async (apiUrl: string, token: string) => {
    const credentials: Credentials = { apiUrl: normalizeApiUrl(apiUrl), token: token.trim(), method: 'token' };
    await fetchRecentTransactions(credentials, 1);
    await storeNewSession(credentials);
    setState({ status: 'ready', credentials });
  }, []);

  const current = state.status === 'ready' ? state.credentials : null;
  const disconnect = useCallback(async () => {
    try {
      return await session.signOut(current, { revokeSession, googleSignOut, clearCredentials, clearSmsQueue: smsImporter.clear });
    } finally {
      setState({ status: 'missing' });
    }
  }, [current]);

  const value = useMemo(
    () => ({ state, signInWithGoogle, connectWithToken, disconnect }),
    [state, signInWithGoogle, connectWithToken, disconnect],
  );
  return <CredentialsContext.Provider value={value}>{children}</CredentialsContext.Provider>;
}

export function useCredentials() {
  const value = useContext(CredentialsContext);
  if (!value) throw new Error('useCredentials must be used inside CredentialsProvider');
  return value;
}
