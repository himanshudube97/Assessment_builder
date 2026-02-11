/**
 * Assessments API Route
 * GET /api/assessments - List assessments
 * POST /api/assessments - Create assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';

// System user ID for development
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

export async function GET(request: NextRequest) {
  try {
    const repo = getAssessmentRepository();

    // For now, get all assessments for system user
    const assessments = await repo.findByUserId(SYSTEM_USER_ID, {
      orderBy: 'updatedAt',
      orderDirection: 'desc',
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const repo = getAssessmentRepository();

    const assessment = await repo.create({
      userId: SYSTEM_USER_ID,
      title: body.title || 'Untitled Assessment',
      description: body.description || null,
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
