/**
 * Organization Invites API Route
 * GET /api/organizations/[orgId]/invites - List invites
 * POST /api/organizations/[orgId]/invites - Create invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgOwner } from '@/infrastructure/auth';
import {
  getInviteRepository,
  getMembershipRepository,
  getOrganizationRepository,
} from '@/infrastructure/database/repositories';
import { canOrgAddMember, getOrgPlanLimits } from '@/domain/entities/organization';

type RouteParams = { params: Promise<{ orgId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
    await requireOrgOwner(orgId);

    const inviteRepo = getInviteRepository();
    const invites = await inviteRepo.findByOrganizationId(orgId);

    return NextResponse.json(
      invites.map(i => ({
        id: i.id,
        email: i.email,
        role: i.role,
        status: i.status,
        invitedBy: i.inviter.name,
        expiresAt: i.expiresAt,
        createdAt: i.createdAt,
      }))
    );
  } catch (error) {
    console.error('Error fetching invites:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch invites' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
    const user = await requireOrgOwner(orgId);

    const body = await request.json();
    const { email, role = 'member' } = body;

    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    // Validate role
    if (!['owner', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const orgRepo = getOrganizationRepository();
    const membershipRepo = getMembershipRepository();
    const inviteRepo = getInviteRepository();

    // Get organization
    const org = await orgRepo.findById(orgId);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Check member limit
    const memberCount = await membershipRepo.countByOrganization(orgId);
    if (!canOrgAddMember(org, memberCount)) {
      const limits = getOrgPlanLimits(org.plan);
      return NextResponse.json(
        { error: `Your plan allows a maximum of ${limits.maxMembers} members. Upgrade to add more.` },
        { status: 403 }
      );
    }

    // Check if email is already a member
    const memberships = await membershipRepo.findByOrganizationId(orgId);
    const existingMember = memberships.find(
      m => m.user.email.toLowerCase() === email.toLowerCase()
    );

    if (existingMember) {
      return NextResponse.json(
        { error: 'This user is already a member' },
        { status: 400 }
      );
    }

    // Check for existing pending invite
    const existingInvite = await inviteRepo.findPendingByEmailAndOrg(email, orgId);
    if (existingInvite) {
      return NextResponse.json(
        { error: 'An invite is already pending for this email' },
        { status: 400 }
      );
    }

    // Create invite
    const invite = await inviteRepo.create({
      organizationId: orgId,
      email: email.toLowerCase(),
      role,
      invitedBy: user.id,
      expiresInDays: 7,
    });

    // TODO: Send invite email
    // For now, return the invite token in the response for manual testing

    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      token: invite.token,
      expiresAt: invite.expiresAt,
      inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/invite/${invite.token}`,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating invite:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create invite' },
      { status: 500 }
    );
  }
}
