import 'server-only'
import { cookies } from 'next/headers'
import { auth } from './config'

// Default session expiration time (e.g., 5 days)
export const SESSION_EXPIRY_MS = 60 * 60 * 24 * 5 * 1000

/**
 * Revokes all sessions for the given user, typically used during logout.
 * @param uid The user ID.
 */
export async function revokeAllSessions(uid: string) {
  await auth.revokeRefreshTokens(uid)
  console.log(`Sessions revoked for user: ${uid}`)
}

/**
 * Retrieves and verifies the Firebase session cookie on the server.
 * @returns The decoded user claims or null if authentication fails.
 */
export async function verifySessionCookie() {
  const sessionCookie = (await cookies()).get('__session')?.value

  if (!sessionCookie) {
    return null
  }

  // Optional: Add admin role check here if needed, using decodedToken.uid or custom claims
  // For example, if you have a custom claim 'admin: true'
  // if (!decodedIdToken.admin) {
  //   return { error: 'Forbidden: Not an admin' };
  // }

  try {
    // 1. Verify the cookie using the Admin SDK
    // The second argument 'true' ensures the session is revoked if the user is disabled
    const decodedIdToken = await auth.verifySessionCookie(
      sessionCookie,
      true, // Check if the user is disabled
    )

    return decodedIdToken
  } catch (error) {
    console.error('Session verification failed:', error)
    // If verification fails (expired, invalid), delete the expired cookie
    ;(await cookies()).delete('__session')
    return null
  }
}
