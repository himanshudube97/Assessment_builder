/**
 * Next.js Middleware
 * Handles authentication and route protection
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'development-secret-change-in-production';
const JWT_ISSUER = 'flowform';
const JWT_AUDIENCE = 'flowform-app';

const AUTH_COOKIE_NAME = 'flowform_auth';

// Routes that require authentication
const PROTECTED_ROUTES = [
  '/dashboard',
  '/api/assessments',
  '/api/organizations',
];

// Routes that should redirect to dashboard if already authenticated
const AUTH_ROUTES = [
  '/login',
  '/signup',
];

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/',
  '/a/', // Public assessment routes
  '/api/public/',
  '/api/auth/',
  '/api/invites/',
  '/invite/',
];

/**
 * Check if a path matches any of the given routes
 */
function matchesRoutes(path: string, routes: string[]): boolean {
  return routes.some(route => {
    if (route.endsWith('/')) {
      return path.startsWith(route) || path === route.slice(0, -1);
    }
    return path === route || path.startsWith(route + '/');
  });
}

/**
 * Verify JWT token
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const secret = new TextEncoder().encode(JWT_SECRET);
    await jose.jwtVerify(token, secret, {
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    });
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip middleware for static files and Next.js internals
  if (
    path.startsWith('/_next') ||
    path.startsWith('/favicon') ||
    path.includes('.') // Static files
  ) {
    return NextResponse.next();
  }

  // Check for auth token
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  const isAuthenticated = token ? await verifyToken(token) : false;

  // Handle public routes - always allow
  if (matchesRoutes(path, PUBLIC_ROUTES)) {
    return NextResponse.next();
  }

  // Handle auth routes (login/signup) - redirect to dashboard if authenticated
  if (matchesRoutes(path, AUTH_ROUTES)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  // Handle protected routes - redirect to login if not authenticated
  if (matchesRoutes(path, PROTECTED_ROUTES)) {
    if (!isAuthenticated) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Default: allow the request
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
