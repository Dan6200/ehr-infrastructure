'use server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/firebase/admin'

/**
 * Verifies the session cookie from the request and returns the decoded user claims.
 * Throws an error if the session is invalid.
 * This is the gatekeeper for all authenticated server-side actions.
 * @returns The decoded ID token claims for the authenticated user.
 */
export async function verifySession() {
  const sessionCookie = cookies().get('__session')?.value
  if (!sessionCookie) {
    throw new Error('Session cookie not found. User is not authenticated.')
  }

  try {
    // Use the Admin SDK to verify the session cookie directly.
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true,
    )
    return decodedClaims
  } catch (error) {
    // The cookie is invalid, expired, or revoked.
    throw new Error('Invalid session cookie. Authentication failed.')
  }
}

/**
 * Deletes the session cookie.
 */
export async function deleteSessionCookie(): Promise<void> {
  cookies().delete('__session')
}
