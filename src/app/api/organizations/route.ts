/**
 * Organizations API Route
 * GET /api/organizations - List user's organizations
 * POST /api/organizations - Create new organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createToken, setAuthCookie } from '@/infrastructure/auth';
import {
  getOrganizationRepository,
  getMembershipRepository,
  getUserRepository,
} from '@/infrastructure/database/repositories';
import { generateSlug } from '@/domain/entities/organization';

export async function GET() {
  try {
    const user = await requireAuth();

    const membershipRepo = getMembershipRepository();
    const memberships = await membershipRepo.findByUserId(user.id);

    const organizations = memberships.map(m => ({
      id: m.organization.id,
      name: m.organization.name,
      slug: m.organization.slug,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json(organizations);
  } catch (error) {
    console.error('Error fetching organizations:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch organizations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const { name } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Organization name is required' },
        { status: 400 }
      );
    }

    const orgRepo = getOrganizationRepository();
    const membershipRepo = getMembershipRepository();
    const userRepo = getUserRepository();

    // Create organization
    const org = await orgRepo.create({
      name: name.trim(),
      slug: generateSlug(name.trim()),
    });

    // Create owner membership
    await membershipRepo.create({
      organizationId: org.id,
      userId: user.id,
      role: 'owner',
    });

    // Update user's last active org
    await userRepo.updateLastActiveOrg(user.id, org.id);

    // Issue new token with new org context
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: org.id,
      orgRole: 'owner',
    });

    await setAuthCookie(token);

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      role: 'owner',
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating organization:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create organization' },
      { status: 500 }
    );
  }
}
