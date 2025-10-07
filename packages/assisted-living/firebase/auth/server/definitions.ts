import 'server-only'
import { cookies } from 'next/headers'

// Environment variables for Cloud Function URLs
const REVOKE_SESSIONS_FUNCTION_URL = process.env.REVOKE_SESSIONS_FUNCTION_URL || 'YOUR_REVOKE_SESSIONS_FUNCTION_URL';
const VERIFY_SESSION_COOKIE_FUNCTION_URL = process.env.VERIFY_SESSION_COOKIE_FUNCTION_URL || 'YOUR_VERIFY_SESSION_COOKIE_FUNCTION_URL';

/**
 * Revokes all sessions for the given user by calling a Cloud Function.
 * @param uid The user ID.
 */
export async function revokeAllSessions(uid: string) {
  if (!REVOKE_SESSIONS_FUNCTION_URL) {
    console.error('REVOKE_SESSIONS_FUNCTION_URL is not set.');
    return { success: false, message: 'Function URL not configured.' };
  }
  try {
    const response = await fetch(REVOKE_SESSIONS_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'Failed to revoke sessions via Cloud Function');
    }
    console.log(`Sessions revoked for user: ${uid}`);
    return { success: true, message: 'Sessions revoked successfully.' };
  } catch (error: any) {
    console.error('Error calling revokeAllSessionsFunction:', error);
    return { success: false, message: error.message || 'Failed to revoke sessions.' };
  }
}

/**
 * Retrieves and verifies the Firebase session cookie on the server by calling a Cloud Function.
 * @returns The decoded user claims or null if authentication fails.
 */
export async function verifySessionCookie() {
  const sessionCookie = (await cookies()).get('__session')?.value;

  if (!sessionCookie) {
    return null;
  }

  if (!VERIFY_SESSION_COOKIE_FUNCTION_URL) {
    console.error('VERIFY_SESSION_COOKIE_FUNCTION_URL is not set.');
    (await cookies()).delete('__session'); // Clean up invalid cookie
    return null;
  }

  try {
    const response = await fetch(VERIFY_SESSION_COOKIE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCookie }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || 'Session verification failed via Cloud Function');
    }

    return result; // This should be the decodedIdToken
  } catch (error: any) {
    console.error('Session verification failed:', error);
    (await cookies()).delete('__session'); // If verification fails (expired, invalid), delete the expired cookie
    return null;
  }
}