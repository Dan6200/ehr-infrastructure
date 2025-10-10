'use server'
import { initializeServerApp } from 'firebase/app'
import { cookies, headers } from 'next/headers'
import { firebaseConfig } from '@/firebase/config'

// Environment variables for Cloud Function URLs
const REVOKE_SESSIONS_FUNCTION_URL = process.env.REVOKE_SESSIONS_FUNCTION_URL
const VERIFY_SESSION_COOKIE_AND_CREATE_CUSTOM_TOKEN_FUNCTION_URL =
  process.env.VERIFY_SESSION_COOKIE_AND_CREATE_CUSTOM_TOKEN_FUNCTION_URL
const VERIFY_SESSION_COOKIE_FUNCTION_URL =
  process.env.VERIFY_SESSION_COOKIE_FUNCTION_URL

/**
 * Revokes all sessions for the given user by calling a Cloud Function.
 * @param uid The user ID.
 */
export async function getRevokeSessions(uid: string) {
  try {
    if (!REVOKE_SESSIONS_FUNCTION_URL) {
      throw new Error('REVOKE_SESSIONS_FUNCTION_URL is not set.')
    }
    if (!uid) throw new Error('Must provide uid to revoke session')
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
  return (await cookies()).get('__session')
}

/**
 * Deletes the session cookie and returns a NextResponse to apply the change.
 * @returns A NextResponse that clears the session cookie.
 */
export async function deleteSessionCookie(): Promise<void> {
  ;(await cookies()).delete('__session')
}

export async function getVerifiedSessionCookie(): Promise<any> {
  try {
    const sessionCookie = (await getSessionCookie())?.value
    if (!sessionCookie) return null
    if (!VERIFY_SESSION_COOKIE_FUNCTION_URL) {
      console.error('VERIFY_SESSION_COOKIE_FUNCTION_URL is not set.')
      return null
    }
    const response = await fetch(VERIFY_SESSION_COOKIE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionCookie }),
    })
    return await response.json()
  } catch (error) {
    console.warn(
      'Session cookie verification failed via Cloud Function:',
      error,
    )
    await deleteSessionCookie() // Delete invalid session cookie
    return null
  }
}

/**
 * Attempts to authenticate the user by checking the Authorization header (service worker) first,
 * then falling back to the __session cookie (Cloud Function).
 * Returns a FirebaseServerApp instance and decoded ID token claims.
 * @returns An object containing the FirebaseServerApp instance and the decoded ID token, or null if authentication fails.
 */
export async function getAuthenticatedAppAndClaims(): Promise<{
  app: ReturnType<typeof initializeServerApp>
  idToken: any // This will be the decoded ID token
} | null> {
  let authIdToken: string | undefined
  let decodedIdToken: any // This will hold the decoded ID token from the Cloud Function

  // 1. Try to get ID token from Authorization header (Service Worker path)
  const authorizationHeader = (await headers()).get('Authorization')
  const idTokenFromHeader = authorizationHeader?.split('Bearer ')[1]

  if (idTokenFromHeader) {
    authIdToken = idTokenFromHeader // Use the original ID token for FirebaseServerApp
  }

  // 2. Fallback to __session cookie if no valid ID token from header path
  if (!authIdToken) {
    const sessionCookie = (await cookies()).get('__session')?.value
    if (sessionCookie) {
      if (!VERIFY_SESSION_COOKIE_AND_CREATE_CUSTOM_TOKEN_FUNCTION_URL) {
        console.error(
          'VERIFY_SESSION_COOKIE_AND_CREATE_CUSTOM_TOKEN_FUNCTION_URL is not set.',
        )
        return null
      }
      try {
        const response = await fetch(
          VERIFY_SESSION_COOKIE_AND_CREATE_CUSTOM_TOKEN_FUNCTION_URL,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sessionCookie }),
          },
        )
        const result = await response.json()

        if (!response.ok || !result.customToken || !result.decodedClaims) {
          throw new Error(
            result.error ||
              'Failed to verify session cookie or create custom token via Cloud Function',
          )
        }
        authIdToken = result.customToken // Use the custom token from CF as authIdToken
        decodedIdToken = result.decodedClaims // Get decoded claims from CF
      } catch (error) {
        console.warn(
          'Session cookie verification/custom token creation failed via Cloud Function:',
          error,
        )
        await deleteSessionCookie() // Delete invalid session cookie
        return null
      }
    }
  }

  // If we have a valid authIdToken (from either source), initialize FirebaseServerApp
  if (authIdToken) {
    try {
      const serverApp = initializeServerApp(firebaseConfig, {
        authIdToken,
        releaseOnDeref: headers(),
      })

      return { app: serverApp, idToken: decodedIdToken }
    } catch (error: any) {
      console.error('Failed to initialize FirebaseServerApp with token:', error)
      return null
    }
  }

  return null
}
