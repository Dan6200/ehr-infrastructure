import { NextResponse, NextRequest } from 'next/server'
import { cookies } from 'next/headers'
import { auth } from '@/firebase/auth/server/config'
import { SESSION_EXPIRY_MS } from '@/firebase/auth/server/definitions'

// The endpoint the client calls after a successful Firebase client SDK sign-in.
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

    // 1. Create the session cookie from the ID token (Admin SDK function)
    const sessionCookie = await auth.createSessionCookie(idToken, {
      expiresIn: SESSION_EXPIRY_MS,
    })
    // 2. Set the secure, HTTP-only cookie on the client
    cookieStore.set('__session', sessionCookie, {
      maxAge: SESSION_EXPIRY_MS / 1000, // Convert MS to seconds
      httpOnly: true, // Crucial: Prevents client-side JS access (XSS mitigation)
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      path: '/',
      sameSite: 'lax',
    })

    return NextResponse.json(
      { message: 'Session cookie set successfully' },
      { status: 200 },
    )
  } catch (error) {
    console.error('Failed to create session cookie:', error)
    // Send 401 Unauthorized if the ID token is invalid or any Admin SDK error occurs
    return NextResponse.json(
      { message: 'Unauthorized Request' },
      { status: 401 },
    )
  }
}
