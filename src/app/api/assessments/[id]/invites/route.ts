/**
 * Assessment Invites API Route
 * POST /api/assessments/:id/invites — Create invite(s)
 * GET /api/assessments/:id/invites — List invites with usage stats
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/infrastructure/auth';
import {
  getAssessmentRepository,
  getAssessmentInviteRepository,
} from '@/infrastructure/database/repositories';
import { getShareUrl } from '@/lib/share';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
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
    const invites = await inviteRepo.findByAssessmentId(id);

    return NextResponse.json(
      invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        token: inv.token,
        maxUses: inv.maxUses,
        usedCount: inv.usedCount,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
        link: `${getShareUrl(id)}?invite=${inv.token}`,
      }))
    );
  } catch (error) {
    console.error('Error fetching assessment invites:', error);
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
    const { id } = await params;
    const user = await requireAuth();
    const body = await request.json();

    const assessmentRepo = getAssessmentRepository();
    const assessment = await assessmentRepo.findById(id);

    if (!assessment || assessment.organizationId !== user.currentOrgId) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    const inviteRepo = getAssessmentInviteRepository();
    const { emails, count, maxUses = 1, expiresInDays = null } = body;

    let invites;

    if (emails && Array.isArray(emails) && emails.length > 0) {
      // Email-based invites
      const inputs = emails.slice(0, 100).map((email: string) => ({
        assessmentId: id,
        email: email.trim(),
        maxUses,
        expiresInDays,
      }));
      invites = await inviteRepo.createBulk(inputs);
    } else {
      // Anonymous invite links
      const numInvites = Math.min(count || 1, 100);
      const inputs = Array.from({ length: numInvites }, () => ({
        assessmentId: id,
        email: null,
        maxUses,
        expiresInDays,
      }));
      invites = await inviteRepo.createBulk(inputs);
    }

    return NextResponse.json(
      invites.map((inv) => ({
        id: inv.id,
        email: inv.email,
        token: inv.token,
        maxUses: inv.maxUses,
        link: `${getShareUrl(id)}?invite=${inv.token}`,
        expiresAt: inv.expiresAt,
      })),
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating assessment invites:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create invites' },
      { status: 500 }
    );
  }
}
