'use server'
import { cookies } from 'next/headers'
import { adminAuth } from '@/firebase/admin'
import redis from '@/lib/redis'

const STALE_COOKIE_TTL = 60 * 5 // 5 minutes

/**
 * Verifies the session cookie. It first checks a Redis cache for known-stale cookies
 * for performance. If not found in cache, it verifies with Firebase. If Firebase
 * verification fails, it adds the stale cookie to the Redis cache.
 * @returns The decoded ID token claims for the authenticated user.
 */
export async function verifySession() {
  const sessionCookie = (await cookies()).get('__session')?.value
  if (!sessionCookie) {
    throw new Error('Session cookie not found. User is not authenticated.')
  }

  try {
    // 1. Check Redis for a known stale cookie first.
    const isStale = await redis.get(sessionCookie)
    if (isStale) {
      throw new Error('Stale session cookie found in cache.')
    }

    // 2. If not stale, verify with Firebase.
    const decodedClaims = await adminAuth.verifySessionCookie(
      sessionCookie,
      true,
    )
    return decodedClaims
  } catch (error) {
    // 3. If verification fails, add the cookie to the stale cache.
    if (error instanceof Error && error.message.includes('Stale')) {
      // Do nothing if it was our own stale error
    } else {
      await redis.set(sessionCookie, 'stale', 'EX', STALE_COOKIE_TTL)
    }
    // The cookie is invalid, expired, or revoked.
    throw new Error('Invalid session cookie. Authentication failed.')
  }
}

/**
 * Deletes the session cookie from the browser and proactively adds it to the
 * Redis stale-cookie cache to invalidate it immediately.
 */
export async function deleteSessionCookie(): Promise<void> {
  const sessionCookie = (await cookies()).get('__session')?.value
  if (sessionCookie) {
    // Proactively add to stale cache upon logout.
    await redis.set(sessionCookie, 'stale', 'EX', STALE_COOKIE_TTL)
  }
  ;(await cookies()).delete('__session')
}
