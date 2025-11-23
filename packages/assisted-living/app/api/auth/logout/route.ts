import { NextResponse, NextRequest } from 'next/server'
import {
  deleteSessionCookie,
  verifySession,
  revokeAllSessions,
} from '#root/auth/server/definitions'

// The endpoint the client calls to sign out and clear the session.
export async function POST(_request: NextRequest) {
  try {
    // verifySession will throw if the cookie is missing or invalid.
    const decodedClaims = await verifySession()
    const uid = decodedClaims.uid

    // Revoke all refresh tokens for the user and delete the session cookie.
    await Promise.all([revokeAllSessions(uid), deleteSessionCookie()])

    return NextResponse.json(
      { message: 'Signed out and all sessions revoked successfully' },
      { status: 200 },
    )
  } catch (error) {
    // This block will run if the cookie is already invalid, expired, or missing.
    // In this case, we still want to ensure the client-side cookie is cleared.
    console.error(
      'Error during logout, forcing cookie deletion.\nDetails:',
      error,
    )
    await deleteSessionCookie() // Ensure client cookie is removed
    return NextResponse.json(
      { message: 'Logout successful, session cleanup complete' },
      { status: 200 },
    )
  }
}
