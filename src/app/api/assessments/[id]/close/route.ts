/**
 * Close Assessment API Route
 * POST /api/assessments/:id/close - Close an assessment (stop accepting responses)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const repo = getAssessmentRepository();

    // Verify assessment exists
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Close the assessment
    const closed = await repo.close(id);

    return NextResponse.json(closed);
  } catch (error) {
    console.error('Error closing assessment:', error);
    return NextResponse.json(
      { error: 'Failed to close assessment' },
      { status: 500 }
    );
  }
}
