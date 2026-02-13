/**
 * Password Verification API Route
 * POST /api/public/assessments/:id/verify-password - Verify respondent password
 */

import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { password } = await request.json();

    if (!password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const repo = getAssessmentRepository();
    const assessment = await repo.findById(id);

    if (!assessment || !assessment.settings.password) {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const valid = await bcrypt.compare(password, assessment.settings.password);
    return NextResponse.json({ valid });
  } catch (error) {
    console.error('Error verifying password:', error);
    return NextResponse.json(
      { error: 'Failed to verify password' },
      { status: 500 }
    );
  }
}
