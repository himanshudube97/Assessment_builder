/**
 * Public Assessment API Route
 * GET /api/public/assessments/:id - Get public assessment data (for respondents)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentRepository, getAssessmentInviteRepository } from '@/infrastructure/database/repositories';
import { isAssessmentOpen } from '@/domain/entities/assessment';
import { isAssessmentInviteValid } from '@/domain/entities/assessmentInvite';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repo = getAssessmentRepository();

    const assessment = await repo.findById(id);

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if assessment is published
    if (assessment.status !== 'published' && assessment.status !== 'closed') {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Check if assessment is open for responses
    const isOpen = isAssessmentOpen(assessment);

    // Check if assessment is scheduled but not yet open
    const now = new Date();
    const isScheduled =
      assessment.settings.openAt !== null &&
      now < new Date(assessment.settings.openAt);

    // Check invite-only restriction
    if (assessment.settings.inviteOnly) {
      const inviteToken = request.nextUrl.searchParams.get('invite');

      if (!inviteToken) {
        return NextResponse.json(
          { error: 'This assessment requires an invitation', requiresInvite: true },
          { status: 403 }
        );
      }

      const inviteRepo = getAssessmentInviteRepository();
      const invite = await inviteRepo.findByToken(inviteToken);

      if (!invite || invite.assessmentId !== assessment.id) {
        return NextResponse.json(
          { error: 'Invalid invite token', requiresInvite: true },
          { status: 403 }
        );
      }

      if (!isAssessmentInviteValid(invite)) {
        return NextResponse.json(
          { error: 'This invitation has expired or been fully used', requiresInvite: true },
          { status: 403 }
        );
      }
    }

    // Return public data only (no userId, googleSheet info, etc.)
    return NextResponse.json({
      id: assessment.id,
      title: assessment.title,
      nodes: assessment.nodes,
      edges: assessment.edges,
      settings: {
        primaryColor: assessment.settings.primaryColor,
        backgroundColor: assessment.settings.backgroundColor,
        showProgressBar: assessment.settings.showProgressBar,
        allowBackNavigation: assessment.settings.allowBackNavigation,
        scoringEnabled: assessment.settings.scoringEnabled,
        fontFamily: assessment.settings.fontFamily,
        borderRadius: assessment.settings.borderRadius,
        buttonStyle: assessment.settings.buttonStyle,
        cardStyle: assessment.settings.cardStyle,
      },
      status: assessment.status,
      isOpen,
      isClosed: assessment.status === 'closed' || !isOpen,
      requiresPassword: assessment.settings.password !== null,
      isScheduled,
      scheduledOpenAt: isScheduled ? assessment.settings.openAt : null,
      inviteOnly: assessment.settings.inviteOnly ?? false,
    });
  } catch (error) {
    console.error('Error fetching public assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}
