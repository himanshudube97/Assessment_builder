/**
 * Auth Helpers
 * Utilities for authentication and authorization
 */

import { headers } from 'next/headers';
import { getAuthCookie } from './cookies';
import { verifyToken } from './jwt';
import type { AuthUser, JWTPayload } from '@/domain/entities/auth';
import { getMembershipRepository } from '@/infrastructure/database/repositories';

/**
 * Get the current authenticated user from the request
 * Returns null if not authenticated
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const token = await getAuthCookie();
  if (!token) {
    return null;
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return null;
  }

  return {
    id: payload.sub,
    email: payload.email,
    name: payload.name,
    avatarUrl: null, // Would need to fetch from DB if needed
    currentOrgId: payload.orgId,
    currentOrgRole: payload.orgRole,
  };
}

/**
 * Get the JWT payload from the request
 * Returns null if not authenticated
 */
export async function getJWTPayload(): Promise<JWTPayload | null> {
  const token = await getAuthCookie();
  if (!token) {
    return null;
  }

  return verifyToken(token);
}

/**
 * Require authentication - throws if not authenticated
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError('Authentication required', 401);
  }
  return user;
}

/**
 * Require specific organization membership
 */
export async function requireOrgMember(organizationId: string): Promise<AuthUser> {
  const user = await requireAuth();

  // If current org matches, use JWT info
  if (user.currentOrgId === organizationId) {
    return user;
  }

  // Check membership in target org
  const membershipRepo = getMembershipRepository();
  const membership = await membershipRepo.findByOrgAndUser(organizationId, user.id);

  if (!membership) {
    throw new AuthError('Access denied to this organization', 403);
  }

  return {
    ...user,
    currentOrgId: organizationId,
    currentOrgRole: membership.role,
  };
}

/**
 * Require owner role in organization
 */
export async function requireOrgOwner(organizationId: string): Promise<AuthUser> {
  const user = await requireOrgMember(organizationId);

  if (user.currentOrgRole !== 'owner') {
    throw new AuthError('Owner access required', 403);
  }

  return user;
}

/**
 * Custom auth error class
 */
export class AuthError extends Error {
  constructor(
    message: string,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Get client IP address from request headers
 */
export async function getClientIP(): Promise<string | null> {
  const headersList = await headers();

  // Try various headers (in order of preference)
  const forwardedFor = headersList.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = headersList.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
}

/**
 * Get user agent from request headers
 */
export async function getUserAgent(): Promise<string | null> {
  const headersList = await headers();
  return headersList.get('user-agent');
}
