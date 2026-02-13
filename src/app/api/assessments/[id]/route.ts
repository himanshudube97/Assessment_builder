/**
 * Assessment API Route
 * GET /api/assessments/:id - Get assessment
 * PUT /api/assessments/:id - Update assessment
 * DELETE /api/assessments/:id - Delete assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/infrastructure/auth';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const repo = getAssessmentRepository();
    const assessment = await repo.findById(id);

    if (!assessment) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Verify assessment belongs to user's current organization
    if (assessment.organizationId !== user.currentOrgId) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;
    const body = await request.json();

    const repo = getAssessmentRepository();

    // Verify assessment exists and belongs to org
    const existing = await repo.findById(id);
    if (!existing || existing.organizationId !== user.currentOrgId) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // When published or closed, only allow metadata/settings changes (not flow structure)
    const isFlowLocked = existing.status !== 'draft';

    const updated = await repo.update(id, {
      title: body.title,
      description: body.description,
      settings: body.settings,
      // Only allow node/edge changes when in draft
      ...(isFlowLocked ? {} : {
        nodes: body.nodes,
        edges: body.edges,
      }),
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating assessment:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const user = await requireAuth();
    const { id } = await params;

    const repo = getAssessmentRepository();

    // Verify assessment exists and belongs to org
    const existing = await repo.findById(id);
    if (!existing || existing.organizationId !== user.currentOrgId) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    await repo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
