import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import redis from '@/lib/redis'

// Exported so we can set up GCP Memorystore with ioredis client...
export const runtime = 'nodejs'

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
    // Quick check against Redis deny-list.
    const isStale = await redis.get(sessionCookie)
    if (!isStale) {
      // If it's not in the deny-list, we can assume it's valid for middleware purposes.
      // The full verification will happen in the server action.
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
  // 1. User is trying to access a protected path (e.g., /dashboard)
  if (isProtectedPath) {
    if (!sessionVerified) {
      // Cookie is missing -> Redirect to login
      const url = request.nextUrl.clone()
      url.pathname = '/sign-in'
      // Optionally add a redirect parameter to return to the requested page later
      // url.searchParams.set('redirect', pathname);
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // 2. User is already authenticated and trying to access a public path (e.g., /login)
  if (isPublicPath) {
    if (sessionVerified) {
      // Cookie exists -> Redirect authenticated users from login/register pages to dashboard
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // Allow the request to proceed if no specific logic applies
  return NextResponse.next()
}

/**
 * Configuration to define which paths the middleware should run on.
 * It's generally best to exclude static assets, API routes, and Next.js internal files.
 */
export const config = {
  matcher: ['/admin/:path*', '/', '/sign-in'],
}
