import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@/firebase/auth/server/config'
import { revokeAllSessions } from '@/firebase/auth/server/definitions'

// The endpoint the client calls to sign out and clear the session.
export async function POST(_request: NextRequest) {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__session')?.value || ''

  // 1. Clear the cookie immediately in the browser response
  cookieStore.set('__session', '', {
    maxAge: 0, // Set maxAge to 0 to immediately expire the cookie
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  })

  if (!sessionCookie) {
    // If no cookie was found, the user was already logged out or session expired.
    return NextResponse.json(
      { message: 'No active session found' },
      { status: 200 },
    )
  }

  try {
    // 2. Decode the session cookie to get the UID
    // Use checkRevoked: true to ensure the cookie hasn't been manually revoked already
    const decodedClaims = await auth.verifySessionCookie(sessionCookie, true)
    const uid = decodedClaims.uid

    // 3. Revoke all refresh tokens for the user (Admin SDK)
    // This immediately invalidates ALL session cookies for this user across all devices.
    await revokeAllSessions(uid)

    return NextResponse.json(
      { message: 'Signed out and session revoked successfully' },
      { status: 200 },
    )
  } catch (error) {
    // If the cookie was invalid, expired, or already revoked, we still clear the client cookie (done above)
    // and just log the error. The response remains successful for the client flow.
    console.error('Error during session revocation, but cookie cleared:', error)
    return NextResponse.json(
      { message: 'Logout successful, session cleanup complete' },
      { status: 200 },
    )
  }
}
