import { ApiError, normalizeApiUrl, send, readJson, responseError, getJson, type Credentials } from './client';

export type GoogleSession = { token: string; user: { name: string; email: string } };

/** Reads the Google web client ID the server verifies ID tokens against. */
export async function fetchGoogleClientId(apiUrl: string): Promise<string> {
  const response = await send(`${normalizeApiUrl(apiUrl)}/api/mobile/auth/google`, {});
  if (response.status === 404) throw new ApiError('This server does not support Google sign-in.', 404);
  if (response.status === 503) throw new ApiError('Google sign-in is not configured on this server.', 503);
  if (!response.ok) throw await responseError(response);
  const { webClientId } = await readJson<{ webClientId?: unknown }>(response);
  if (typeof webClientId !== 'string' || !webClientId) {
    throw new ApiError('TrackCrow returned an unreadable response.', response.status);
  }
  return webClientId;
}

/** Exchanges a Google ID token for a TrackCrow token. */
export async function exchangeGoogleIdToken(apiUrl: string, idToken: string): Promise<GoogleSession> {
  const response = await send(`${normalizeApiUrl(apiUrl)}/api/mobile/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  if (response.status === 401) {
    throw new ApiError('TrackCrow could not verify this Google account. Use a verified Google account.', 401);
  }
  if (!response.ok) throw await responseError(response);
  const session = await readJson<Partial<GoogleSession>>(response);
  if (typeof session.token !== 'string' || typeof session.user?.email !== 'string') {
    throw new ApiError('TrackCrow returned an unreadable response.', response.status);
  }
  return { token: session.token, user: { name: session.user.name ?? '', email: session.user.email } };
}

/** Revokes the stored token on the server. A token that is already invalid counts as revoked. */
export async function revokeSession(credentials: Credentials): Promise<void> {
  const response = await send(`${normalizeApiUrl(credentials.apiUrl)}/api/mobile/auth/session`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${credentials.token}` },
  });
  if (!response.ok && response.status !== 401) throw await responseError(response);
}

export type CurrentUser = {
  uuid: string;
  id: number;
  email: string;
  name: string | null;
  image: string | null;
  subscription: number;
};
export const fetchMe = (credentials: Credentials, signal?: AbortSignal) =>
  getJson<CurrentUser>(credentials, '/api/me', signal);
