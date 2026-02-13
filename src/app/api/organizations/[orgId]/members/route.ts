/**
 * Organization Members API Route
 * GET /api/organizations/[orgId]/members - List members
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgMember } from '@/infrastructure/auth';
import { getMembershipRepository } from '@/infrastructure/database/repositories';

type RouteParams = { params: Promise<{ orgId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
    await requireOrgMember(orgId);

    const membershipRepo = getMembershipRepository();
    const memberships = await membershipRepo.findByOrganizationId(orgId);

    const members = memberships.map(m => ({
      id: m.id,
      userId: m.userId,
      email: m.user.email,
      name: m.user.name,
      avatarUrl: m.user.avatarUrl,
      role: m.role,
      joinedAt: m.joinedAt,
    }));

    return NextResponse.json(members);
  } catch (error) {
    console.error('Error fetching members:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch members' },
      { status: 500 }
    );
  }
}
