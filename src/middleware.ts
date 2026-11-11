import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'tennis_auth';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/trial'];

// Routes that require admin authentication
const ADMIN_PREFIX = '/admin';

/**
 * Parse the auth cookie to extract role and expiry.
 *
 * This does NOT verify the HMAC signature — that is the job of
 * requireAuth() / requireAdmin() in every server action (Node.js runtime).
 * Middleware only needs to know "is there a plausible session?" so it can
 * redirect unauthenticated visitors for a better UX.
 */
function parseAuthCookie(cookieValue: string): { role: string } | null {
  try {
    const dotIndex = cookieValue.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const encodedValue = cookieValue.slice(0, dotIndex);

    // Decode base64url → raw bytes → UTF-8 string
    let base64 = encodedValue.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) base64 += '=';
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const value = new TextDecoder().decode(bytes);

    const data = JSON.parse(value) as { user: { role: string }; expiresAt: number };
    if (Date.now() > data.expiresAt) return null;

    return { role: data.user.role };
  } catch {
    return null;
  }
}

// Paths that require member or admin auth
const MEMBER_PATHS = [
  '/dashboard',
  '/reserve',
  '/my-',
  '/chat',
  '/events',
  '/transfer',
  '/notifications',
  '/profile',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes — allow through
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    return NextResponse.next();
  }

  // Static files and API routes — allow through
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') // static files (favicon, images, etc.)
  ) {
    return NextResponse.next();
  }

  const cookie = request.cookies.get(COOKIE_NAME);
  const auth = cookie ? parseAuthCookie(cookie.value) : null;

  // Admin routes
  if (pathname.startsWith(ADMIN_PREFIX)) {
    if (!auth || auth.role !== 'admin') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // Member-protected routes
  const isMemberRoute = MEMBER_PATHS.some(
    (p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p)
  );

  if (isMemberRoute) {
    if (!auth) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
