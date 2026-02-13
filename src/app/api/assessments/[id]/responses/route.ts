/**
 * Responses API Route
 * POST /api/assessments/:id/responses - Submit a response
 * GET /api/assessments/:id/responses - List responses (owner only)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAssessmentRepository,
  getResponseRepository,
  getOrganizationRepository,
  getAssessmentInviteRepository,
} from '@/infrastructure/database/repositories';
import type { CreateResponseInput } from '@/domain/entities/response';
import { canOrgCollectResponse } from '@/domain/entities/organization';
import { isAssessmentInviteValid } from '@/domain/entities/assessmentInvite';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;
    const body = await request.json();

    const assessmentRepo = getAssessmentRepository();
    const responseRepo = getResponseRepository();
    const orgRepo = getOrganizationRepository();

    // Verify assessment exists and is published
    const assessment = await assessmentRepo.findById(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    if (assessment.status !== 'published') {
      return NextResponse.json(
        { error: 'Assessment is not accepting responses' },
        { status: 400 }
      );
    }

    // Check if assessment is still open
    const now = new Date();
    if (assessment.settings.openAt && now < new Date(assessment.settings.openAt)) {
      return NextResponse.json(
        { error: 'Assessment has not opened yet' },
        { status: 400 }
      );
    }
    if (assessment.settings.closeAt && now > new Date(assessment.settings.closeAt)) {
      return NextResponse.json(
        { error: 'Assessment has closed' },
        { status: 400 }
      );
    }

    if (
      assessment.settings.maxResponses &&
      assessment.responseCount >= assessment.settings.maxResponses
    ) {
      return NextResponse.json(
        { error: 'Assessment has reached maximum responses' },
        { status: 400 }
      );
    }

    // Check organization's response limit
    const org = await orgRepo.findById(assessment.organizationId);
    if (org && !canOrgCollectResponse(org)) {
      return NextResponse.json(
        { error: 'This assessment has reached its monthly response limit' },
        { status: 400 }
      );
    }

    // Check invite-only restriction
    if (assessment.settings.inviteOnly) {
      const inviteToken = body.inviteToken;
      if (!inviteToken) {
        return NextResponse.json(
          { error: 'Invite token required' },
          { status: 403 }
        );
      }

      const inviteRepo = getAssessmentInviteRepository();
      const invite = await inviteRepo.findByToken(inviteToken);

      if (!invite || invite.assessmentId !== assessmentId) {
        return NextResponse.json(
          { error: 'Invalid invite token' },
          { status: 403 }
        );
      }

      if (!isAssessmentInviteValid(invite)) {
        return NextResponse.json(
          { error: 'This invitation has expired or been fully used' },
          { status: 403 }
        );
      }

      await inviteRepo.incrementUsedCount(invite.id);
    }

    // Create response
    const input: CreateResponseInput = {
      assessmentId,
      answers: body.answers || [],
      score: body.score ?? null,
      maxScore: body.maxScore ?? null,
      metadata: body.metadata || {
        userAgent: request.headers.get('user-agent') || '',
        ipCountry: null,
        referrer: request.headers.get('referer') || null,
      },
    };

    const response = await responseRepo.create(input);

    // Increment response counts (both assessment and organization)
    await assessmentRepo.incrementResponseCount(assessmentId);
    if (org) {
      await orgRepo.incrementResponseCount(org.id);
    }

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error submitting response:', error);
    return NextResponse.json(
      { error: 'Failed to submit response' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Import auth helper here to keep POST route public
    const { requireAuth } = await import('@/infrastructure/auth');
    const user = await requireAuth();

    const { id: assessmentId } = await params;
    const { searchParams } = new URL(request.url);

    const limit = parseInt(searchParams.get('limit') || '100', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const assessmentRepo = getAssessmentRepository();
    const responseRepo = getResponseRepository();

    // Verify assessment exists and belongs to user's org
    const assessment = await assessmentRepo.findById(assessmentId);
    if (!assessment || assessment.organizationId !== user.currentOrgId) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const responses = await responseRepo.findByAssessmentId(assessmentId, {
      limit,
      offset,
    });

    const total = await responseRepo.countByAssessmentId(assessmentId);

    return NextResponse.json({
      responses,
      total,
      limit,
      offset,
    });
  } catch (error) {
    console.error('Error fetching responses:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch responses' },
      { status: 500 }
    );
  }
}
