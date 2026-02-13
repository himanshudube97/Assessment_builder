/**
 * Single Assessment Invite API Route
 * DELETE /api/assessments/:id/invites/:inviteId — Revoke an invite
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/infrastructure/auth';
import {
  getAssessmentRepository,
  getAssessmentInviteRepository,
} from '@/infrastructure/database/repositories';

type RouteParams = { params: Promise<{ id: string; inviteId: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id, inviteId } = await params;
    const user = await requireAuth();

    const assessmentRepo = getAssessmentRepository();
    const assessment = await assessmentRepo.findById(id);

    if (!assessment || assessment.organizationId !== user.currentOrgId) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const inviteRepo = getAssessmentInviteRepository();
    const invite = await inviteRepo.findById(inviteId);

    if (!invite || invite.assessmentId !== id) {
      return NextResponse.json(
        { error: 'Invite not found' },
        { status: 404 }
      );
    }

    await inviteRepo.delete(inviteId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error revoking assessment invite:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to revoke invite' },
      { status: 500 }
    );
  }
}
