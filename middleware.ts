import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const PUBLIC_ROUTES = ['/signin', '/signup', '/reset-password']
const EMAIL_VERIFICATION_ROUTE = '/verify-email'

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  const path = request.nextUrl.pathname

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => path.startsWith(route))) {
    return NextResponse.next()
  }

  // Redirect unauthenticated users
  if (!token) {
    return NextResponse.redirect(new URL('/signin', request.url))
  }

  // Redirect unverified users
  if (!token.email_verified && path !== EMAIL_VERIFICATION_ROUTE) {
    return NextResponse.redirect(new URL(EMAIL_VERIFICATION_ROUTE, request.url))
  }

  // Prevent verified users from accessing verification page
  if (token.email_verified && path === EMAIL_VERIFICATION_ROUTE) {
    return NextResponse.redirect(new URL('/projects', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, etc.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}