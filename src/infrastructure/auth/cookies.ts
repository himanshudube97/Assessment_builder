/**
 * Cookie Management
 * Secure HTTP-only cookie handling for auth tokens
 */

import { cookies } from 'next/headers';

const AUTH_COOKIE_NAME = 'flowform_auth';
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export interface CookieOptions {
  maxAge?: number;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Get default cookie options based on environment
 */
function getDefaultOptions(): CookieOptions {
  const isProduction = process.env.NODE_ENV === 'production';

  return {
    maxAge: COOKIE_MAX_AGE,
    path: '/',
    secure: isProduction,
    httpOnly: true,
    sameSite: 'lax',
  };
}

/**
 * Set the auth token cookie
 */
export async function setAuthCookie(token: string, options?: Partial<CookieOptions>): Promise<void> {
  const cookieStore = await cookies();
  const opts = { ...getDefaultOptions(), ...options };

  cookieStore.set(AUTH_COOKIE_NAME, token, {
    maxAge: opts.maxAge,
    path: opts.path,
    secure: opts.secure,
    httpOnly: opts.httpOnly,
    sameSite: opts.sameSite,
  });
}

/**
 * Get the auth token from cookies
 */
export async function getAuthCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(AUTH_COOKIE_NAME);
  return cookie?.value ?? null;
}

/**
 * Clear the auth cookie (logout)
 */
export async function clearAuthCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}

/**
 * Check if auth cookie exists
 */
export async function hasAuthCookie(): Promise<boolean> {
  const token = await getAuthCookie();
  return token !== null;
}
