/**
 * Logout Route
 * POST /api/auth/logout - Clear auth cookie and logout
 */

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/infrastructure/auth';

export async function POST() {
  try {
    // Clear the auth cookie
    await clearAuthCookie();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
