import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { fetchRecentTransactions, normalizeApiUrl, type Credentials } from './api';

const API_URL_KEY = 'trackcrow.apiUrl';
const TOKEN_KEY = 'trackcrow.token';

type CredentialsState =
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'ready'; credentials: Credentials };

type CredentialsContextValue = {
  state: CredentialsState;
  /** Validates against the transactions API before storing. Throws with a user-facing message. */
  connect: (apiUrl: string, token: string) => Promise<void>;
  disconnect: () => Promise<void>;
};

const CredentialsContext = createContext<CredentialsContextValue | null>(null);

export function CredentialsProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CredentialsState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    Promise.all([SecureStore.getItemAsync(API_URL_KEY), SecureStore.getItemAsync(TOKEN_KEY)])
      .then(([apiUrl, token]) => {
        if (!active) return;
        setState(apiUrl && token ? { status: 'ready', credentials: { apiUrl, token } } : { status: 'missing' });
      })
      .catch(() => {
        if (active) setState({ status: 'missing' });
      });
    return () => {
      active = false;
    };
  }, []);

  const connect = useCallback(async (apiUrl: string, token: string) => {
    const credentials = { apiUrl: normalizeApiUrl(apiUrl), token: token.trim() };
    await fetchRecentTransactions(credentials, 1);
    await SecureStore.setItemAsync(API_URL_KEY, credentials.apiUrl);
    await SecureStore.setItemAsync(TOKEN_KEY, credentials.token);
    setState({ status: 'ready', credentials });
  }, []);

  const disconnect = useCallback(async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(API_URL_KEY);
    setState({ status: 'missing' });
  }, []);

  const value = useMemo(() => ({ state, connect, disconnect }), [state, connect, disconnect]);
  return <CredentialsContext.Provider value={value}>{children}</CredentialsContext.Provider>;
}

export function useCredentials() {
  const value = useContext(CredentialsContext);
  if (!value) throw new Error('useCredentials must be used inside CredentialsProvider');
  return value;
}
