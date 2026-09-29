import * as SecureStore from 'expo-secure-store';
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

const API_URL_KEY = 'trackcrow.apiUrl';
const TOKEN_KEY = 'trackcrow.token';
const METHOD_KEY = 'trackcrow.method';
const EMAIL_KEY = 'trackcrow.email';

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

// Installs from before Google sign-in have no stored method and load as token credentials.
function loadCredentials(
  apiUrl: string | null,
  token: string | null,
  method: string | null,
  email: string | null,
): Credentials | null {
  if (!apiUrl || !token) return null;
  if (method === 'google' && email) return { apiUrl, token, method: 'google', email };
  return { apiUrl, token, method: 'token' };
}

async function storeCredentials(credentials: Credentials) {
  await SecureStore.setItemAsync(API_URL_KEY, credentials.apiUrl);
  await SecureStore.setItemAsync(TOKEN_KEY, credentials.token);
  await SecureStore.setItemAsync(METHOD_KEY, credentials.method);
  if (credentials.method === 'google') {
    await SecureStore.setItemAsync(EMAIL_KEY, credentials.email);
  } else {
    await SecureStore.deleteItemAsync(EMAIL_KEY);
  }
}

async function clearCredentials() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(METHOD_KEY);
  await SecureStore.deleteItemAsync(API_URL_KEY);
}

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CredentialsState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    Promise.all([API_URL_KEY, TOKEN_KEY, METHOD_KEY, EMAIL_KEY].map((key) => SecureStore.getItemAsync(key)))
      .then(([apiUrl, token, method, email]) => {
        if (!active) return;
        const credentials = loadCredentials(apiUrl, token, method, email);
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
      storeCredentials,
    });
    if (result.status === 'signed-in') setState({ status: 'ready', credentials: result.credentials });
    return result;
  }, []);

  const connectWithToken = useCallback(async (apiUrl: string, token: string) => {
    const credentials: Credentials = { apiUrl: normalizeApiUrl(apiUrl), token: token.trim(), method: 'token' };
    await fetchRecentTransactions(credentials, 1);
    await storeCredentials(credentials);
    setState({ status: 'ready', credentials });
  }, []);

  const current = state.status === 'ready' ? state.credentials : null;
  const disconnect = useCallback(async () => {
    try {
      return await session.signOut(current, { revokeSession, googleSignOut, clearCredentials });
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
