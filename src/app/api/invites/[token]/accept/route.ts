/**
 * Accept Invite Route
 * POST /api/invites/[token]/accept - Accept an invite (for authenticated users)
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, createToken, setAuthCookie } from '@/infrastructure/auth';
import {
  getInviteRepository,
  getMembershipRepository,
  getUserRepository,
  getOrganizationRepository,
} from '@/infrastructure/database/repositories';
import { isInviteValid } from '@/domain/entities/invite';

type RouteParams = { params: Promise<{ token: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;
    const user = await requireAuth();

    const inviteRepo = getInviteRepository();
    const membershipRepo = getMembershipRepository();
    const userRepo = getUserRepository();
    const orgRepo = getOrganizationRepository();

    // Find invite
    const invite = await inviteRepo.findByToken(token);
    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    // Check if invite is valid
    if (!isInviteValid(invite)) {
      return NextResponse.json(
        { error: 'This invite has expired or is no longer valid' },
        { status: 400 }
      );
    }

    // Check if email matches
    if (invite.email.toLowerCase() !== user.email.toLowerCase()) {
      return NextResponse.json(
        { error: 'This invite is for a different email address' },
        { status: 403 }
      );
    }

    // Check if already a member
    const existingMembership = await membershipRepo.findByOrgAndUser(
      invite.organizationId,
      user.id
    );

    if (existingMembership) {
      return NextResponse.json(
        { error: 'You are already a member of this organization' },
        { status: 400 }
      );
    }

    // Create membership
    await membershipRepo.create({
      organizationId: invite.organizationId,
      userId: user.id,
      role: invite.role,
      invitedBy: invite.invitedBy,
    });

    // Mark invite as accepted
    await inviteRepo.updateStatus(invite.id, 'accepted', user.id);

    // Update user's last active org
    await userRepo.updateLastActiveOrg(user.id, invite.organizationId);

    // Get organization details
    const org = await orgRepo.findById(invite.organizationId);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // Create new token with new org context
    const newToken = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: org.id,
      orgRole: invite.role,
    });

    await setAuthCookie(newToken);

    return NextResponse.json({
      success: true,
      organization: {
        id: org.id,
        name: org.name,
        slug: org.slug,
        role: invite.role,
      },
    });
  } catch (error) {
    console.error('Error accepting invite:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to accept invite' },
      { status: 500 }
    );
  }
}
