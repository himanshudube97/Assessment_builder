/**
 * Google OAuth Initiation Route
 * GET /api/auth/google - Redirects to Google OAuth
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getGoogleAuthUrl, createOAuthState } from '@/infrastructure/auth';

export async function GET(request: NextRequest) {
  try {
    // Check if Google OAuth is configured
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      console.error('Google OAuth not configured. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env.local');
      return NextResponse.redirect(
        new URL('/login?error=oauth_not_configured', request.url)
      );
    }

    // Get optional invite token from query params
    const searchParams = request.nextUrl.searchParams;
    const inviteToken = searchParams.get('invite') || undefined;

    // Generate state with optional invite token
    const state = createOAuthState(inviteToken);

    // Store state in cookie for CSRF validation
    const cookieStore = await cookies();
    cookieStore.set('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 10, // 10 minutes
      path: '/',
    });

    // Get Google OAuth URL
    const authUrl = getGoogleAuthUrl(state);

    // Redirect to Google
    return NextResponse.redirect(authUrl);
  } catch (error) {
    console.error('Error initiating Google OAuth:', error);
    return NextResponse.redirect(
      new URL('/login?error=oauth_init_failed', request.url)
    );
  }
}
