/**
 * Switch Organization Route
 * POST /api/organizations/[orgId]/switch - Switch active organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createToken, setAuthCookie } from '@/infrastructure/auth';
import {
  getMembershipRepository,
  getUserRepository,
  getOrganizationRepository,
} from '@/infrastructure/database/repositories';

type RouteParams = { params: Promise<{ orgId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
    const user = await requireAuth();

    const membershipRepo = getMembershipRepository();
    const userRepo = getUserRepository();
    const orgRepo = getOrganizationRepository();

    // Verify membership
    const membership = await membershipRepo.findByOrgAndUser(orgId, user.id);
    if (!membership) {
      return NextResponse.json(
        { error: 'You are not a member of this organization' },
        { status: 403 }
      );
    }

    // Get organization details
    const org = await orgRepo.findById(orgId);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Update last active org
    await userRepo.updateLastActiveOrg(user.id, orgId);

    // Create new token with updated org context
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: org.id,
      orgRole: membership.role,
    });

    await setAuthCookie(token);

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      role: membership.role,
    });
  } catch (error) {
    console.error('Error switching organization:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to switch organization' },
      { status: 500 }
    );
  }
}
