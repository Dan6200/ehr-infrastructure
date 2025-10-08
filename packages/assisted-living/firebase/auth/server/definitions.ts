'use server'
import { cookies } from 'next/headers'

// Environment variables for Cloud Function URLs
const REVOKE_SESSIONS_FUNCTION_URL = process.env.REVOKE_SESSIONS_FUNCTION_URL
const VERIFY_SESSION_COOKIE_FUNCTION_URL =
  process.env.VERIFY_SESSION_COOKIE_FUNCTION_URL

/**
 * Revokes all sessions for the given user by calling a Cloud Function.
 * @param uid The user ID.
 */
export async function getRevokeSessions(uid: string) {
  if (!REVOKE_SESSIONS_FUNCTION_URL) {
    console.error('REVOKE_SESSIONS_FUNCTION_URL is not set.')
    return { success: false, message: 'Function URL not configured.' }
  }
  try {
    const response = await fetch(REVOKE_SESSIONS_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid }),
    })
    const result = await response.json()
    if (!response.ok) {
      throw new Error(
        result.error || 'Failed to revoke sessions via Cloud Function',
      )
    }
    console.log(`Sessions revoked for user: ${uid}`)
    return { success: true, message: 'Sessions revoked successfully.' }
  } catch (error: any) {
    console.error(`Error calling ${REVOKE_SESSIONS_FUNCTION_URL}:`, error)
    return {
      success: false,
      message: error.message || 'Failed to revoke sessions.',
    }
  }
}

/**
 * Retrieves the session cookie.
 */
export async function getSessionCookie() {
  return (await cookies()).get('__session') ?? ''
}

/**
 * Deletes the session cookie.
 */
export async function deleteSessionCookie() {
  ;(await cookies()).delete('__session')
}

/**
 * Retrieves and verifies the Firebase session cookie on the server by calling a Cloud Function.
 * This function does NOT modify cookies.
 * @returns The decoded user claims or null if authentication fails.
 */
export async function getVerifiedSessionCookie() {
  const sessionCookie = (await cookies()).get('__session')?.value

  if (!sessionCookie) {
    return null
  }

  if (!VERIFY_SESSION_COOKIE_FUNCTION_URL) {
    console.error('VERIFY_SESSION_COOKIE_FUNCTION_URL is not set.')
    // In this scenario, we don't delete the cookie here. It will be handled on sign-out.
    return null
  }

  try {
    const response = await fetch(VERIFY_SESSION_COOKIE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCookie }),
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(
        result.error || 'Session verification failed via Cloud Function',
      )
    }

    return result // This should be the decodedIdToken
  } catch (error: any) {
    console.error(`Error calling ${VERIFY_SESSION_COOKIE_FUNCTION_URL}:`, error)
    // In this scenario, we don't delete the cookie here. It will be handled on sign-out.
    return null
  }
}
