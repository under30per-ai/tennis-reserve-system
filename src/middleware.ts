import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'tennis_auth';

// Routes that don't require authentication
const PUBLIC_PATHS = ['/login', '/register', '/trial'];

// Routes that require admin authentication
const ADMIN_PREFIX = '/admin';

function base64urlDecode(str: string): string {
  // Convert base64url to base64
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  return atob(base64);
}

function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(message));
  return base64urlEncode(sig);
}

async function verifyAuthCookie(cookieValue: string): Promise<{ role: string; expiresAt: number } | null> {
  try {
    const secret = process.env.COOKIE_SECRET?.trim();
    if (!secret) return null;

    const dotIndex = cookieValue.lastIndexOf('.');
    if (dotIndex === -1) return null;

    const encodedValue = cookieValue.slice(0, dotIndex);
    const providedSig = cookieValue.slice(dotIndex + 1);

    let value: string;
    try {
      value = base64urlDecode(encodedValue);
    } catch {
      return null;
    }

    const expectedSig = await hmacSha256(secret, value);

    // Length check for timing safety
    if (providedSig.length !== expectedSig.length) return null;
    if (providedSig !== expectedSig) return null;

    const data = JSON.parse(value) as { user: { role: string }; expiresAt: number };
    if (Date.now() > data.expiresAt) return null;

    return { role: data.user.role, expiresAt: data.expiresAt };
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

export async function middleware(request: NextRequest) {
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
  const auth = cookie ? await verifyAuthCookie(cookie.value) : null;

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
