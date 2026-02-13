/**
 * Single Member API Route
 * PATCH /api/organizations/[orgId]/members/[memberId] - Update member role
 * DELETE /api/organizations/[orgId]/members/[memberId] - Remove member
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgOwner } from '@/infrastructure/auth';
import { getMembershipRepository } from '@/infrastructure/database/repositories';

type RouteParams = { params: Promise<{ orgId: string; memberId: string }> };

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, memberId } = await params;
    await requireOrgOwner(orgId);

    const body = await request.json();
    const { role } = body;

    if (!role || !['owner', 'member'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role' },
        { status: 400 }
      );
    }

    const membershipRepo = getMembershipRepository();
    const membership = await membershipRepo.findById(memberId);

    if (!membership || membership.organizationId !== orgId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent demoting the last owner
    if (membership.role === 'owner' && role === 'member') {
      const ownerCount = await membershipRepo.countOwners(orgId);
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner' },
          { status: 400 }
        );
      }
    }

    const updated = await membershipRepo.update(memberId, { role });

    return NextResponse.json({
      id: updated.id,
      role: updated.role,
    });
  } catch (error) {
    console.error('Error updating member:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update member' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId, memberId } = await params;
    const user = await requireOrgOwner(orgId);

    const membershipRepo = getMembershipRepository();
    const membership = await membershipRepo.findById(memberId);

    if (!membership || membership.organizationId !== orgId) {
      return NextResponse.json(
        { error: 'Member not found' },
        { status: 404 }
      );
    }

    // Prevent removing yourself as owner if you're the last owner
    if (membership.userId === user.id && membership.role === 'owner') {
      const ownerCount = await membershipRepo.countOwners(orgId);
      if (ownerCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last owner' },
          { status: 400 }
        );
      }
    }

    await membershipRepo.delete(memberId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to remove member' },
      { status: 500 }
    );
  }
}
