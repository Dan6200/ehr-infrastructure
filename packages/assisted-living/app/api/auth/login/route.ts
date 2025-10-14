import { NextResponse, NextRequest } from 'next/server'
import { cookies, headers } from 'next/headers'
import { initializeServerApp } from 'firebase/app'
import { firebaseConfig } from '@/firebase/config'
import { connectAuthEmulator, getAuth } from 'firebase/auth'

const SESSION_EXPIRY_MS = 3600 * 1000
const CREATE_SESSION_COOKIE_FUNCTION_URL =
  process.env.CREATE_SESSION_COOKIE_FUNCTION_URL!
const authHost = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_HOST!

export async function POST(request: NextRequest) {
  // 1. Try to get ID token from Authorization header (Service Worker path)
  const authorizationHeader = (await headers()).get('Authorization')
  const authIdToken = authorizationHeader?.split('Bearer ')[1]
  if (authIdToken) {
    try {
      const serverApp = initializeServerApp(firebaseConfig, {
        authIdToken,
        releaseOnDeref: headers(),
      })

      process.nextTick(() => {
        const serverAuth = getAuth(serverApp)
        if (process.env.NODE_ENV === 'development')
          try {
            connectAuthEmulator(serverAuth, authHost) // Always throws an error due to race-conditions
          } catch {}
      })
      return NextResponse.json(
        { message: 'Session cookie set successfully' },
        { status: 200 },
      )
    } catch (error) {
      console.error('Failed to initialize FirebaseServerApp: ', error)
    }
  }

  try {
    // 2. __session cookie fallback...
    const { idToken } = await request.json()
    const cookieStore = await cookies()

    if (!idToken) {
      return NextResponse.json(
        { message: 'ID Token required' },
        { status: 400 },
      )
    }

    const response = await fetch(CREATE_SESSION_COOKIE_FUNCTION_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken, expiresIn: SESSION_EXPIRY_MS }),
    })
    const result = await response.json()
    if (!response.ok) {
      throw new Error(result.error || 'Failed to set session cookie')
    }

    const sessionCookie = result
    cookieStore.set('__session', sessionCookie, {
      maxAge: SESSION_EXPIRY_MS / 1000, // Convert MS to seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // Use secure in production
      path: '/',
      sameSite: 'strict',
    })

    return NextResponse.json(
      { message: 'Session cookie set successfully' },
      { status: 200 },
    )
  } catch (error: any) {
    console.error(`Error calling ${CREATE_SESSION_COOKIE_FUNCTION_URL}:`, error)
    return NextResponse.json(
      { message: 'Failed to set session cookie.' },
      { status: 401 },
    )
  }
}
