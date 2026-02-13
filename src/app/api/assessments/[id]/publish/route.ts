/**
 * Publish Assessment API Route
 * POST /api/assessments/:id/publish - Publish an assessment
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';
import { validateFlow } from '@/domain/entities/flow';
import type { FlowNode, FlowEdge } from '@/domain/entities/flow';
import type { AssessmentSettings } from '@/domain/entities/assessment';

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

    // Validate flow before publishing
    const validationErrors = validateFlow(
      existing.nodes as FlowNode[],
      existing.edges as FlowEdge[]
    );
    const blockingErrors = validationErrors.filter((e) => e.type === 'error');

    if (blockingErrors.length > 0) {
      return NextResponse.json(
        { error: 'Flow validation failed', validationErrors },
        { status: 400 }
      );
    }

    // Build updated settings from request body
    const settingsUpdate: Partial<AssessmentSettings> = {};

    if (body.closeAt) {
      settingsUpdate.closeAt = new Date(body.closeAt);
    }
    if (body.openAt) {
      settingsUpdate.openAt = new Date(body.openAt);
    }
    if (body.maxResponses !== undefined) {
      settingsUpdate.maxResponses = body.maxResponses;
    }
    if (body.password !== undefined) {
      settingsUpdate.password = body.password
        ? await bcrypt.hash(body.password, 10)
        : null;
    }
    if (body.inviteOnly !== undefined) {
      settingsUpdate.inviteOnly = body.inviteOnly;
    }

    // Update settings if any were provided
    if (Object.keys(settingsUpdate).length > 0) {
      await repo.update(id, {
        settings: { ...existing.settings, ...settingsUpdate },
      });
    }

    // Publish the assessment
    const published = await repo.publish(id);

    return NextResponse.json({
      ...published,
      validationWarnings: validationErrors.filter((e) => e.type === 'warning'),
    });
  } catch (error) {
    console.error('Error publishing assessment:', error);
    return NextResponse.json(
      { error: 'Failed to publish assessment' },
      { status: 500 }
    );
  }
}
