/**
 * Current User Route
 * GET /api/auth/me - Get current authenticated user and session info
 */

import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/infrastructure/auth';
import {
  getUserRepository,
  getOrganizationRepository,
  getMembershipRepository,
} from '@/infrastructure/database/repositories';
import type { SessionInfo } from '@/domain/entities/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get full user info
    const userRepo = getUserRepository();
    const orgRepo = getOrganizationRepository();
    const membershipRepo = getMembershipRepository();

    const fullUser = await userRepo.findById(user.id);
    if (!fullUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get current organization
    const currentOrg = await orgRepo.findById(user.currentOrgId);
    if (!currentOrg) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Get all user memberships
    const memberships = await membershipRepo.findByUserId(user.id);

    // Build session info
    const sessionInfo: SessionInfo = {
      user: {
        id: fullUser.id,
        email: fullUser.email,
        name: fullUser.name,
        avatarUrl: fullUser.avatarUrl,
      },
      organization: {
        id: currentOrg.id,
        name: currentOrg.name,
        slug: currentOrg.slug,
        role: user.currentOrgRole,
        plan: currentOrg.plan,
      },
      organizations: memberships.map(m => ({
        id: m.organization.id,
        name: m.organization.name,
        slug: m.organization.slug,
        role: m.role,
      })),
    };

    return NextResponse.json(sessionInfo);
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user info' },
      { status: 500 }
    );
  }
}
