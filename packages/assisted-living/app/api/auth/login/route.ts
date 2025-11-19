import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { getAdminAuth } from '#/firebase/admin'

const SESSION_EXPIRY_MS = 60 * 60 * 24 * 5 * 1000 // 5 days

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json()
    const cookieStore = await cookies()
    if (!idToken) {
      return NextResponse.json(
        { message: 'ID Token required' },
        { status: 400 },
      )
    }

    const adminAuth = await getAdminAuth()

    // Create the session cookie. This will also verify the ID token.
    const sessionCookie = await adminAuth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    })

    // Set the cookie on the response
    cookieStore.set('__session', sessionCookie, {
      maxAge: SESSION_EXPIRY_MS / 1000, // Convert MS to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      sameSite: 'strict',
    })

    return NextResponse.json(
      { message: 'Session cookie set successfully' },
      { status: 200 },
    )
  } catch (error: any) {
    console.error('Session cookie creation failed:', error)
    return NextResponse.json(
      { message: 'Failed to set session cookie.' },
      { status: 401 },
    )
  }
}
