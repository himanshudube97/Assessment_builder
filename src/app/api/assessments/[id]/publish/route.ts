/**
 * Publish Assessment API Route
 * POST /api/assessments/:id/publish - Publish an assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const repo = getAssessmentRepository();

    // Verify assessment exists
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // If closeAt is provided, update settings first
    if (body.closeAt) {
      await repo.update(id, {
        settings: {
          ...existing.settings,
          closeAt: new Date(body.closeAt),
        },
      });
    }

    // Publish the assessment
    const published = await repo.publish(id);

    return NextResponse.json(published);
  } catch (error) {
    console.error('Error publishing assessment:', error);
    return NextResponse.json(
      { error: 'Failed to publish assessment' },
      { status: 500 }
    );
  }
}
