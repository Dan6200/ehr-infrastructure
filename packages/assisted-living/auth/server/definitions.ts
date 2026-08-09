'use server'

import { cookies } from 'next/headers'
import { getAdminAuth } from '#root/firebase/admin'
import redis from '#root/lib/redis'

const STALE_COOKIE_TTL = 60 * 5 // 5 minutes

/**
 * Verifies the session cookie. It first checks a Redis cache for known-stale cookies
 * for performance. If not found in cache, it verifies with Firebase. If Firebase
 * verification fails, it adds the stale cookie to the Redis cache.
 * @returns The decoded ID token claims for the authenticated user.
 */
export async function verifySession() {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__session')?.value

  if (!sessionCookie) {
    throw new Error('Session cookie not found. User is not authenticated.')
  }

  try {
    const isStale = await redis.get(sessionCookie)
    if (isStale) {
      throw new Error('Stale session cookie found in cache.')
    }

    const adminAuth = await getAdminAuth()
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true,
    )

    if (!decodedClaims.provider_id) {
      throw new Error('Provider ID not found in session claims.')
    }

    return decodedClaims
  } catch (error) {
    if (!(error instanceof Error && error.message.includes('Stale'))) {
      await redis.set(sessionCookie, 'stale', { ex: STALE_COOKIE_TTL })
    }
    throw new Error('Invalid session cookie. Authentication failed.')
  }
}

/**
 * Deletes the session cookie from the browser and proactively adds it to the
 * Redis stale-cookie cache to invalidate it immediately.
 */
export async function deleteSessionCookie(): Promise<void> {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__session')?.value

  if (sessionCookie) {
    await redis.set(sessionCookie, 'stale', { ex: STALE_COOKIE_TTL })
  }
  cookieStore.delete('__session')
}

/**
 * Sets a custom role for a user.
 * @param uid The user's ID.
 * @param role The role to set (e.g., 'ADMIN').
 */
export async function setCustomUserRole(uid: string, role: string) {
  const validRoles = ['ADMIN', 'CLINICIAN', 'CAREGIVER', 'VIEWER']
  const upperCaseRole = role.toUpperCase()

  if (!validRoles.includes(upperCaseRole)) {
    throw new Error(`Invalid role: ${role}.`)
  }

  try {
    const adminAuth = await getAdminAuth()
    await adminAuth.setCustomUserClaims(uid, { roles: [upperCaseRole] })
    console.log(`Custom role '${upperCaseRole}' set for user ${uid}.`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error setting custom user claims:', error)
    throw new Error(`Error setting custom role: ${message}`)
  }
}

/**
 * Sets a custom provider ID for a user.
 * @param uid The user's ID.
 * @param providerId The provider ID to set.
 */
export async function setCustomUserProviderId(uid: string, providerId: string) {
  try {
    const adminAuth = await getAdminAuth()
    const { customClaims } = await adminAuth.getUser(uid)
    await adminAuth.setCustomUserClaims(uid, {
      ...customClaims,
      provider_id: providerId,
    })
    console.log(`Custom provider ID '${providerId}' set for user ${uid}.`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error setting custom provider ID:', error)
    throw new Error(`Error setting custom provider ID: ${message}`)
  }
}

/**
 * Revokes all refresh tokens for a given user.
 * @param uid The user ID.
 */
export async function revokeAllSessions(uid: string) {
  try {
    const adminAuth = await getAdminAuth()
    await adminAuth.revokeRefreshTokens(uid)
    console.log(`Sessions revoked for user: ${uid}`)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error revoking sessions:', error)
    throw new Error(`Error revoking sessions: ${message}`)
  }
}
