/**
 * Public Assessment API Route
 * GET /api/public/assessments/:id - Get public assessment data (for respondents)
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';
import { isAssessmentOpen } from '@/domain/entities/assessment';

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
      },
      status: assessment.status,
      isOpen,
      isClosed: assessment.status === 'closed' || !isOpen,
    });
  } catch (error) {
    console.error('Error fetching public assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}
