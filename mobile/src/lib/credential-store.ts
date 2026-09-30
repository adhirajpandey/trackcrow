import * as SecureStore from 'expo-secure-store';
import type { Credentials } from './api';

const API_URL_KEY = 'trackcrow.apiUrl';
const TOKEN_KEY = 'trackcrow.token';
const METHOD_KEY = 'trackcrow.method';
const EMAIL_KEY = 'trackcrow.email';

export async function readStoredCredentials(): Promise<Credentials | null> {
  const [apiUrl, token, method, email] = await Promise.all(
    [API_URL_KEY, TOKEN_KEY, METHOD_KEY, EMAIL_KEY].map((key) => SecureStore.getItemAsync(key)),
  );
  if (!apiUrl || !token) return null;
  if (await SecureStore.getItemAsync(TOKEN_KEY) !== token) return null;
  if (method === 'google' && email) return { apiUrl, token, method: 'google', email };
  return { apiUrl, token, method: 'token' };
}

export async function storeCredentials(credentials: Credentials) {
  await SecureStore.setItemAsync(API_URL_KEY, credentials.apiUrl);
  await SecureStore.setItemAsync(METHOD_KEY, credentials.method);
  if (credentials.method === 'google') await SecureStore.setItemAsync(EMAIL_KEY, credentials.email);
  else await SecureStore.deleteItemAsync(EMAIL_KEY);
  // Commit the token last so background work sees only a complete new session.
  await SecureStore.setItemAsync(TOKEN_KEY, credentials.token);
}

export async function clearCredentials() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(EMAIL_KEY);
  await SecureStore.deleteItemAsync(METHOD_KEY);
  await SecureStore.deleteItemAsync(API_URL_KEY);
}
