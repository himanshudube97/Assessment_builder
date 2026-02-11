/**
 * Assessment API Route
 * GET /api/assessments/:id - Get assessment
 * PUT /api/assessments/:id - Update assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';

// System user ID for development
const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';

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

    // In production, verify user owns this assessment
    // For now, we allow access to system user's assessments

    return NextResponse.json(assessment);
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assessment' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const repo = getAssessmentRepository();

    // Verify assessment exists
    const existing = await repo.findById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Assessment not found' },
        { status: 404 }
      );
    }

    // Update assessment
    const updated = await repo.update(id, {
      title: body.title,
      description: body.description,
      nodes: body.nodes,
      edges: body.edges,
      settings: body.settings,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating assessment:', error);
    return NextResponse.json(
      { error: 'Failed to update assessment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    await repo.delete(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return NextResponse.json(
      { error: 'Failed to delete assessment' },
      { status: 500 }
    );
  }
}
