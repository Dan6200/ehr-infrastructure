import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import redis from '#root/lib/redis'

// Define the public paths that require no authentication
const PUBLIC_PATHS = ['/sign-in', '/activate-account', '/temp']

// Define paths that MUST be protected
const PROTECTED_PATHS = ['/admin']

/**
 * Middleware to check for the presence of the Firebase session cookie
 * and protect routes.
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const sessionCookie = request.cookies.get('__session')?.value

  let sessionVerified = false // Assume not verified initially

  if (sessionCookie) {
    // Quick check against Upstash Redis deny-list
    const isStale = await redis.get(sessionCookie)
    if (!isStale) {
      // If it's not in the deny-list, we assume it's valid for middleware.
      // Full verification occurs in server actions/page components.
      sessionVerified = true
    }
  }

  const isPublicPath = PUBLIC_PATHS.includes(pathname)
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path),
  )

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = !sessionVerified ? '/sign-in' : '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  // 1. User is trying to access a protected path (e.g., /admin)
  if (isProtectedPath) {
    if (!sessionVerified) {
      const url = request.nextUrl.clone()
      url.pathname = '/sign-in'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // 2. User is authenticated and trying to access a public path (e.g., /sign-in)
  if (isPublicPath && sessionVerified) {
    const url = request.nextUrl.clone()
    url.pathname = '/admin/dashboard'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

/**
 * Configuration to define which paths the middleware should run on.
 */
export const config = {
  matcher: ['/admin/:path*', '/', '/sign-in'],
}
