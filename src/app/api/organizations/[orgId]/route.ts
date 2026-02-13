/**
 * Single Organization API Route
 * GET /api/organizations/[orgId] - Get organization details
 * PATCH /api/organizations/[orgId] - Update organization
 * DELETE /api/organizations/[orgId] - Delete organization
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireOrgMember, requireOrgOwner } from '@/infrastructure/auth';
import {
  getOrganizationRepository,
  getMembershipRepository,
} from '@/infrastructure/database/repositories';

type RouteParams = { params: Promise<{ orgId: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
    const user = await requireOrgMember(orgId);

    const orgRepo = getOrganizationRepository();
    const membershipRepo = getMembershipRepository();

    const org = await orgRepo.findById(orgId);
    if (!org) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const memberCount = await membershipRepo.countByOrganization(orgId);
    const assessmentCount = await orgRepo.getAssessmentCount(orgId);

    return NextResponse.json({
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      planExpiresAt: org.planExpiresAt,
      responseCountThisMonth: org.responseCountThisMonth,
      settings: org.settings,
      memberCount,
      assessmentCount,
      role: user.currentOrgRole,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching organization:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch organization' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
    await requireOrgOwner(orgId);

    const body = await request.json();
    const { name, slug, settings } = body;

    const orgRepo = getOrganizationRepository();

    // Validate slug uniqueness if changing
    if (slug) {
      const isAvailable = await orgRepo.isSlugAvailable(slug, orgId);
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'Slug is already taken' },
          { status: 400 }
        );
      }
    }

    const updated = await orgRepo.update(orgId, {
      ...(name && { name }),
      ...(slug && { slug: slug.toLowerCase() }),
      ...(settings && { settings }),
    });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      plan: updated.plan,
      settings: updated.settings,
      updatedAt: updated.updatedAt,
    });
  } catch (error) {
    console.error('Error updating organization:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update organization' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { orgId } = await params;
    const user = await requireOrgOwner(orgId);

    const orgRepo = getOrganizationRepository();
    const membershipRepo = getMembershipRepository();

    // Check if this is the user's only organization
    const memberships = await membershipRepo.findByUserId(user.id);
    if (memberships.length <= 1) {
      return NextResponse.json(
        { error: 'Cannot delete your only organization' },
        { status: 400 }
      );
    }

    // Delete organization (cascades to memberships, invites, assessments)
    await orgRepo.delete(orgId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting organization:', error);
    if (error instanceof Error && 'statusCode' in error) {
      return NextResponse.json(
        { error: error.message },
        { status: (error as { statusCode: number }).statusCode }
      );
    }
    return NextResponse.json(
      { error: 'Failed to delete organization' },
      { status: 500 }
    );
  }
}
