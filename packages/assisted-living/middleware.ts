import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getVerifiedSessionCookie } from './auth/server/definitions'

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
  const authorizationHeader = request.headers.get('Authorization')
  const sessionVerified = authorizationHeader
    ? true
    : !!(await getVerifiedSessionCookie())

  const isPublicPath = PUBLIC_PATHS.includes(pathname)
  const isProtectedPath = PROTECTED_PATHS.some((path) =>
    pathname.startsWith(path),
  )

  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = !sessionVerified ? '/sign-in' : '/admin'
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
      url.pathname = '/admin'
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
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - /api/auth (our specific auth API, to avoid infinite loops)
     * - error
     */
    '/((?!_next/static|_next/image|favicon.ico|api/auth|error).*)',
  ],
}
