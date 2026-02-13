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
import type { Answer, ResponseMetadata } from '@/domain/entities/response';

function computeNpsStats(
  allResponses: { answers: Answer[] }[],
  npsNodeIds: string[]
): {
  score: number;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
  distribution: Record<string, number>;
} | null {
  if (npsNodeIds.length === 0) return null;

  const npsAnswers: number[] = [];
  const distribution: Record<string, number> = {};
  for (let i = 0; i <= 10; i++) distribution[String(i)] = 0;

  for (const response of allResponses) {
    for (const answer of response.answers) {
      if (npsNodeIds.includes(answer.nodeId)) {
        const val = typeof answer.value === 'number' ? answer.value : parseInt(String(answer.value), 10);
        if (!isNaN(val) && val >= 0 && val <= 10) {
          npsAnswers.push(val);
          distribution[String(val)] = (distribution[String(val)] || 0) + 1;
        }
      }
    }
  }

  if (npsAnswers.length === 0) return null;

  const total = npsAnswers.length;
  const detractors = npsAnswers.filter((v) => v <= 6).length;
  const passives = npsAnswers.filter((v) => v === 7 || v === 8).length;
  const promoters = npsAnswers.filter((v) => v >= 9).length;
  const score = Math.round(((promoters - detractors) / total) * 100);

  return { score, promoters, passives, detractors, total, distribution };
}

function parseDevice(userAgent: string): 'Mobile' | 'Tablet' | 'Desktop' {
  if (/Mobi|Android.*Mobile|iPhone|iPod/i.test(userAgent)) return 'Mobile';
  if (/iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent)) return 'Tablet';
  return 'Desktop';
}

function computeDeviceBreakdown(
  allResponses: { metadata: ResponseMetadata }[]
): { device: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of allResponses) {
    const device = parseDevice(r.metadata.userAgent || '');
    counts[device] = (counts[device] || 0) + 1;
  }
  return Object.entries(counts)
    .filter(([, count]) => count > 0)
    .map(([device, count]) => ({ device, count }))
    .sort((a, b) => b.count - a.count);
}

function parseSource(referrer: string | null): string {
  if (!referrer) return 'Direct';
  try {
    const url = new URL(referrer);
    const host = url.hostname.replace('www.', '');
    if (host.includes('google')) return 'Google';
    if (host.includes('facebook') || host.includes('fb.com')) return 'Facebook';
    if (host.includes('twitter') || host.includes('x.com')) return 'Twitter/X';
    if (host.includes('linkedin')) return 'LinkedIn';
    if (host.includes('instagram')) return 'Instagram';
    return host;
  } catch {
    return 'Other';
  }
}

function computeSourceBreakdown(
  allResponses: { metadata: ResponseMetadata }[]
): { source: string; count: number }[] {
  const counts: Record<string, number> = {};
  for (const r of allResponses) {
    const source = parseSource(r.metadata.referrer);
    counts[source] = (counts[source] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([source, count]) => ({ source, count }))
    .sort((a, b) => b.count - a.count);
}

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

    // Parallel data fetching
    const [
      totalResponses,
      distribution,
      stats,
      timeline,
      completionTime,
      scoreDistribution,
      allResponses,
    ] = await Promise.all([
      responseRepo.countByAssessmentId(assessmentId),
      responseRepo.getAnswerDistribution(assessmentId),
      responseRepo.getStats(assessmentId),
      responseRepo.getResponseTimeline(assessmentId),
      responseRepo.getCompletionTimeStats(assessmentId),
      responseRepo.getScoreDistribution(assessmentId),
      responseRepo.getResponsesForAnalytics(assessmentId),
    ]);

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

    // NPS computation
    const npsNodeIds = questionNodes
      .filter((n) => (n.data as QuestionNodeData).questionType === 'nps')
      .map((n) => n.id);
    const npsStats = computeNpsStats(allResponses, npsNodeIds);

    // Device and source breakdown
    const deviceBreakdown = computeDeviceBreakdown(allResponses);
    const sourceBreakdown = computeSourceBreakdown(allResponses);

    return NextResponse.json({
      totalResponses,
      averageScore: stats.averageScore,
      completionRate: stats.completionRate,
      questionStats,
      timeline,
      completionTime,
      scoreDistribution,
      npsStats,
      deviceBreakdown,
      sourceBreakdown,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
