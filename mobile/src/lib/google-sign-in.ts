// The only module that talks to the native Google sign-in library.
import {
  GoogleOneTapSignIn,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from 'react-native-nitro-google-signin';

export type GoogleIdTokenResult = { status: 'success'; idToken: string } | { status: 'cancelled' };

/**
 * Shows the Credential Manager account picker and returns a Google ID token issued for
 * `webClientId`. Requests identity only: no extra scopes, offline access, or auth code.
 * Throws with a user-facing message on failure.
 */
export async function getGoogleIdToken(webClientId: string): Promise<GoogleIdTokenResult> {
  try {
    GoogleOneTapSignIn.configure({ webClientId });
    await GoogleOneTapSignIn.checkPlayServices();
    let response = await GoogleOneTapSignIn.signIn();
    if (response.type === 'noSavedCredentialFound') response = await GoogleOneTapSignIn.createAccount();
    if (response.type === 'noSavedCredentialFound') response = await GoogleOneTapSignIn.presentExplicitSignIn();
    if (response.type === 'cancelled') return { status: 'cancelled' };
    if (isSuccessResponse(response) && response.data.idToken) {
      return { status: 'success', idToken: response.data.idToken };
    }
  } catch (error) {
    if (isErrorWithCode(error)) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) return { status: 'cancelled' };
      if (error.code === statusCodes.DEVELOPER_ERROR) {
        throw new Error('Google sign-in is not set up for this app build.');
      }
      if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        throw new Error('Google Play services is missing or out of date.');
      }
    }
  }
  throw new Error('Google sign-in failed. Try again.');
}

/** Clears Credential Manager state so the next sign-in shows the account picker. */
export async function googleSignOut(): Promise<void> {
  try {
    await GoogleOneTapSignIn.signOut();
  } catch {
    // Local sign-out must still complete when Google state cannot be cleared.
  }
}
