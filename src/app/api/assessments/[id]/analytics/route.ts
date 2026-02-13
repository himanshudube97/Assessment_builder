/**
 * Analytics API Route
 * GET /api/assessments/:id/analytics - Get analytics data for an assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getAssessmentRepository,
  getResponseRepository,
} from '@/infrastructure/database/repositories';
import type { QuestionNodeData } from '@/domain/entities/flow';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: assessmentId } = await params;

    const assessmentRepo = getAssessmentRepository();
    const responseRepo = getResponseRepository();

    // Verify assessment exists
    const assessment = await assessmentRepo.findById(assessmentId);
    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // TODO: In production, verify user owns this assessment

    // Get total responses
    const totalResponses = await responseRepo.countByAssessmentId(assessmentId);

    // Get answer distribution
    const distribution = await responseRepo.getAnswerDistribution(assessmentId);

    // Build question stats with node info
    const questionNodes = assessment.nodes.filter((n) => n.type === 'question');
    const questionStats = questionNodes.map((node) => {
      const data = node.data as QuestionNodeData;
      return {
        nodeId: node.id,
        questionText: data.questionText,
        questionType: data.questionType,
        distribution: distribution[node.id] || {},
      };
    });

    // Get response stats (average score, etc.)
    const stats = await responseRepo.getStats(assessmentId);

    return NextResponse.json({
      totalResponses,
      averageScore: stats.averageScore,
      completionRate: stats.completionRate,
      questionStats,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
