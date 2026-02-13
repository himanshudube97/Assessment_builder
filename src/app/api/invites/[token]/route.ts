/**
 * Invite Details Route
 * GET /api/invites/[token] - Get invite details
 */

import { NextRequest, NextResponse } from 'next/server';
import { getInviteRepository } from '@/infrastructure/database/repositories';
import { isInviteValid } from '@/domain/entities/invite';

type RouteParams = { params: Promise<{ token: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { token } = await params;

    const inviteRepo = getInviteRepository();
    const invite = await inviteRepo.findByToken(token);

    if (!invite) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    // Check if invite is valid
    const valid = isInviteValid(invite);

    return NextResponse.json({
      id: invite.id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      valid,
      organization: {
        id: invite.organization.id,
        name: invite.organization.name,
      },
      inviter: {
        name: invite.inviter.name,
      },
      expiresAt: invite.expiresAt,
    });
  } catch (error) {
    console.error('Error fetching invite:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invite' },
      { status: 500 }
    );
  }
}
