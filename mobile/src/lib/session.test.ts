import assert from 'node:assert/strict';
import { test } from 'node:test';

import type { Credentials } from './api';
import { signInWithGoogle, signOut, type GoogleSignInDeps } from './session';

function signInDeps(exchange: GoogleSignInDeps['exchangeGoogleIdToken']) {
  const stored: Credentials[] = [];
  const deps: GoogleSignInDeps = {
    fetchGoogleClientId: async () => 'web-client-id',
    getGoogleIdToken: async () => ({ status: 'success', idToken: 'google-id-token' }),
    exchangeGoogleIdToken: exchange,
    storeCredentials: async (credentials) => {
      stored.push(credentials);
    },
  };
  return { deps, stored };
}

const googleCredentials: Credentials = {
  apiUrl: 'http://127.0.0.1:3000',
  token: 'trackcrow-token',
  method: 'google',
  email: 'person@example.com',
};

test('stores nothing when the TrackCrow exchange fails, then succeeds on retry', async () => {
  let fail = true;
  const { deps, stored } = signInDeps(async (apiUrl, idToken) => {
    assert.equal(apiUrl, 'http://127.0.0.1:3000');
    assert.equal(idToken, 'google-id-token');
    if (fail) throw new Error('Could not reach TrackCrow.');
    return { token: 'trackcrow-token', user: { name: 'Person', email: 'person@example.com' } };
  });

  await assert.rejects(signInWithGoogle('http://127.0.0.1:3000/', deps), /Could not reach TrackCrow/);
  assert.deepEqual(stored, []);

  fail = false;
  const result = await signInWithGoogle('http://127.0.0.1:3000/', deps);
  assert.deepEqual(result, { status: 'signed-in', credentials: googleCredentials });
  assert.deepEqual(stored, [googleCredentials]);
});

test('a cancelled picker stores nothing and does not call TrackCrow', async () => {
  const { deps, stored } = signInDeps(async () => assert.fail('exchange must not run'));
  deps.getGoogleIdToken = async () => ({ status: 'cancelled' });

  assert.deepEqual(await signInWithGoogle('https://trackcrow.in', deps), { status: 'cancelled' });
  assert.deepEqual(stored, []);
});

test('signs out locally even when server revocation fails', async () => {
  const calls: string[] = [];
  const revocation = await signOut(googleCredentials, {
    revokeSession: async () => {
      calls.push('revoke');
      throw new Error('offline');
    },
    googleSignOut: async () => {
      calls.push('google');
    },
    clearCredentials: async () => {
      calls.push('clear');
    },
    clearSmsQueue: async () => { calls.push('sms'); },
  });

  assert.equal(revocation, 'failed');
  assert.deepEqual(calls, ['revoke', 'google', 'clear', 'sms']);
});

test('does not revoke personal access tokens on sign-out', async () => {
  const calls: string[] = [];
  const revocation = await signOut(
    { apiUrl: 'https://trackcrow.in', token: 'pat', method: 'token' },
    {
      revokeSession: async () => {
        calls.push('revoke');
      },
      googleSignOut: async () => {
        calls.push('google');
      },
      clearCredentials: async () => {
        calls.push('clear');
      },
      clearSmsQueue: async () => { calls.push('sms'); },
    },
  );

  assert.equal(revocation, 'not-applicable');
  assert.deepEqual(calls, ['google', 'clear', 'sms']);
});

test('clears credentials and SMS even if Google sign-out fails', async () => {
  const calls: string[] = [];
  await assert.rejects(signOut(googleCredentials, {
    revokeSession: async () => undefined,
    googleSignOut: async () => { throw new Error('credential manager failed'); },
    clearCredentials: async () => { calls.push('clear'); },
    clearSmsQueue: async () => { calls.push('sms'); },
  }), /credential manager failed/);
  assert.deepEqual(calls, ['clear', 'sms']);
});

test('clears the SMS queue even if local credential removal fails', async () => {
  let queueCleared = false;
  await assert.rejects(signOut(null, {
    revokeSession: async () => undefined,
    googleSignOut: async () => undefined,
    clearCredentials: async () => { throw new Error('storage unavailable'); },
    clearSmsQueue: async () => { queueCleared = true; },
  }), /storage unavailable/);
  assert.equal(queueCleared, true);
});
