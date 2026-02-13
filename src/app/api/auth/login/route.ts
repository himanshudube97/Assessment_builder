/**
 * Email/Password Login Route
 * POST /api/auth/login - Authenticate with email and password
 */

import { NextRequest, NextResponse } from 'next/server';
import { createToken, setAuthCookie } from '@/infrastructure/auth';
import {
  getUserRepository,
  getMembershipRepository,
  getOrganizationRepository,
} from '@/infrastructure/database/repositories';
import { generateSlug } from '@/domain/entities/organization';

// Development system user credentials
const DEV_CREDENTIALS = {
  email: 'system@flowform.dev',
  password: 'system123',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const userRepo = getUserRepository();
    const membershipRepo = getMembershipRepository();
    const orgRepo = getOrganizationRepository();

    // For development: check if it's the system user
    const isDev = process.env.NODE_ENV !== 'production';
    const isSystemUser =
      isDev &&
      email.toLowerCase() === DEV_CREDENTIALS.email &&
      password === DEV_CREDENTIALS.password;

    // Find user by email
    let user = await userRepo.findByEmail(email.toLowerCase());

    if (!user) {
      // In development, create system user if credentials match
      if (isSystemUser) {
        user = await userRepo.create({
          email: DEV_CREDENTIALS.email,
          name: 'System User',
        });
      } else {
        return NextResponse.json(
          { error: 'Invalid email or password' },
          { status: 401 }
        );
      }
    } else if (!isSystemUser) {
      // For now, only system user can login with password
      // In production, you'd verify password hash here
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Get user's memberships
    let memberships = await membershipRepo.findByUserId(user.id);

    // If no memberships, create a personal organization
    if (memberships.length === 0) {
      const orgName = `${user.name}'s Workspace`;
      const org = await orgRepo.create({
        name: orgName,
        slug: generateSlug(orgName),
      });

      await membershipRepo.create({
        organizationId: org.id,
        userId: user.id,
        role: 'owner',
      });

      // Refresh memberships
      memberships = await membershipRepo.findByUserId(user.id);
    }

    // Get current organization (last active or first)
    const lastActiveOrgId = user.lastActiveOrgId;
    const membership = lastActiveOrgId
      ? memberships.find((m) => m.organizationId === lastActiveOrgId) || memberships[0]
      : memberships[0];

    // Update last active org
    await userRepo.updateLastActiveOrg(user.id, membership.organizationId);

    // Create JWT token
    const token = await createToken({
      userId: user.id,
      email: user.email,
      name: user.name,
      orgId: membership.organizationId,
      orgRole: membership.role,
    });

    // Set auth cookie
    await setAuthCookie(token);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      organization: {
        id: membership.organization.id,
        name: membership.organization.name,
        slug: membership.organization.slug,
        role: membership.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}
