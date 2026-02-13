/**
 * Unpublish Assessment API Route
 * POST /api/assessments/:id/unpublish - Revert to draft status
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/infrastructure/auth';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const repo = getAssessmentRepository();

    const existing = await repo.findById(id);
    if (!existing || existing.organizationId !== user.currentOrgId) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    if (existing.status === 'draft') {
      return NextResponse.json(
        { error: 'Assessment is already a draft' },
        { status: 400 }
      );
    }

    const unpublished = await repo.unpublish(id);

    return NextResponse.json(unpublished);
  } catch (error) {
    console.error('Error unpublishing assessment:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to unpublish assessment' },
      { status: 500 }
    );
  }
}
