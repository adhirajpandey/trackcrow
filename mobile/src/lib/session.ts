// Sign-in and sign-out sequencing, kept free of native modules so it runs under node:test.
import { normalizeApiUrl, type Credentials, type GoogleSession } from './api';
import type { GoogleIdTokenResult } from './google-sign-in';

export type GoogleSignInDeps = {
  fetchGoogleClientId: (apiUrl: string) => Promise<string>;
  getGoogleIdToken: (webClientId: string) => Promise<GoogleIdTokenResult>;
  exchangeGoogleIdToken: (apiUrl: string, idToken: string) => Promise<GoogleSession>;
  storeCredentials: (credentials: Credentials) => Promise<void>;
};

export type GoogleSignInResult = { status: 'signed-in'; credentials: Credentials } | { status: 'cancelled' };

/**
 * Credentials are stored only after the TrackCrow exchange succeeds. The Google ID token
 * is never persisted. Throws with a user-facing message on failure.
 */
export async function signInWithGoogle(apiUrl: string, deps: GoogleSignInDeps): Promise<GoogleSignInResult> {
  const normalizedUrl = normalizeApiUrl(apiUrl);
  const webClientId = await deps.fetchGoogleClientId(normalizedUrl);
  const google = await deps.getGoogleIdToken(webClientId);
  if (google.status === 'cancelled') return { status: 'cancelled' };
  const session = await deps.exchangeGoogleIdToken(normalizedUrl, google.idToken);
  const credentials: Credentials = {
    apiUrl: normalizedUrl,
    token: session.token,
    method: 'google',
    email: session.user.email,
  };
  await deps.storeCredentials(credentials);
  return { status: 'signed-in', credentials };
}

export type SignOutDeps = {
  revokeSession: (credentials: Credentials) => Promise<void>;
  googleSignOut: () => Promise<void>;
  clearCredentials: () => Promise<void>;
};

export type ServerRevocation = 'revoked' | 'failed' | 'not-applicable';

/** Always signs out locally. Server revocation applies only to Google sessions and may fail. */
export async function signOut(credentials: Credentials | null, deps: SignOutDeps): Promise<ServerRevocation> {
  let revocation: ServerRevocation = 'not-applicable';
  if (credentials?.method === 'google') {
    try {
      await deps.revokeSession(credentials);
      revocation = 'revoked';
    } catch {
      revocation = 'failed';
    }
  }
  await deps.googleSignOut();
  await deps.clearCredentials();
  return revocation;
}
