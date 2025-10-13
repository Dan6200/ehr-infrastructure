import { NextResponse, NextRequest } from 'next/server'
import {
  getRevokeSessions,
  deleteSessionCookie,
  getSessionCookie,
  getVerifiedSessionCookie,
  clearAuthHeader,
} from '@/auth/server/definitions'

// The endpoint the client calls to sign out and clear the session.
export async function POST(_request: NextRequest) {
  try {
    // FOR SERVICE-WORKER AUTH FLOW, THERE SHOULD BE NO SESSION COOKIE SET!
    if (!(await getSessionCookie())) {
      await clearAuthHeader()
      return NextResponse.json(
        { message: 'Signed out successfully' },
        { status: 200 },
      )
    }
    console.log('clearing session cookies...')
    // 2. Decode the session cookie to get the UID
    // Use checkRevoked: true to ensure the cookie hasn't been manually revoked already
    const result = await getVerifiedSessionCookie()
    if (!result) throw new Error('Failed to retrive idToken')
    const uid = result.idToken?.uid
    await Promise.all([
      // This immediately invalidates ALL session cookies for this user across all devices.
      getRevokeSessions(uid),
      deleteSessionCookie(),
    ])

    return NextResponse.json(
      { message: 'Signed out and session revoked successfully' },
      { status: 200 },
    )
  } catch (error) {
    // If the cookie was invalid, expired, or already revoked, we still clear the client cookie (done above)
    // and just log the error. The response remains successful for the client flow.
    console.error('Error during session revocation, but cookie cleared:', error)
    await deleteSessionCookie()
    return NextResponse.json(
      { message: 'Logout successful, session cleanup complete' },
      { status: 200 },
    )
  }
}
