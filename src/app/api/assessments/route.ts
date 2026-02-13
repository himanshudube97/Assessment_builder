/**
 * Assessments API Route
 * GET /api/assessments - List assessments for current organization
 * POST /api/assessments - Create assessment in current organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/infrastructure/auth';
import { getAssessmentRepository, getOrganizationRepository } from '@/infrastructure/database/repositories';
import { canOrgCreateAssessment } from '@/domain/entities/organization';

export async function GET() {
  try {
    const user = await requireAuth();
    const repo = getAssessmentRepository();

    const assessments = await repo.findByOrganizationId(user.currentOrgId, {
      orderBy: 'updatedAt',
      orderDirection: 'desc',
    });

    return NextResponse.json(assessments);
  } catch (error) {
    console.error('Error fetching assessments:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch assessments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireAuth();
    const body = await request.json();

    const assessmentRepo = getAssessmentRepository();
    const orgRepo = getOrganizationRepository();

    // Check if org can create more assessments
    const org = await orgRepo.findById(user.currentOrgId);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const currentCount = await assessmentRepo.countByOrganizationId(user.currentOrgId);
    if (!canOrgCreateAssessment(org, currentCount)) {
      return NextResponse.json(
        { error: 'Assessment limit reached. Upgrade your plan to create more assessments.' },
        { status: 403 }
      );
    }

    const assessment = await assessmentRepo.create({
      organizationId: user.currentOrgId,
      createdBy: user.id,
      title: body.title || 'Untitled Assessment',
      description: body.description || null,
    });

    return NextResponse.json(assessment, { status: 201 });
  } catch (error) {
    console.error('Error creating assessment:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to create assessment' },
      { status: 500 }
    );
  }
}
