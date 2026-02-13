/**
 * Auth Domain Entity
 * Types and interfaces for authentication
 */

import type { MembershipRole } from './membership';

/**
 * JWT Token Payload
 */
export interface JWTPayload {
  sub: string; // User ID
  email: string;
  name: string;
  orgId: string;
  orgRole: MembershipRole;
  iat: number;
  exp: number;
}

/**
 * Current authenticated user context
 */
export interface AuthUser {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  currentOrgId: string;
  currentOrgRole: MembershipRole;
}

/**
 * Session info returned to client
 */
export interface SessionInfo {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string;
    role: MembershipRole;
    plan: string;
  };
  organizations: Array<{
    id: string;
    name: string;
    slug: string;
    role: MembershipRole;
  }>;
}

/**
 * Google OAuth profile
 */
export interface GoogleProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

/**
 * OAuth callback result
 */
export interface OAuthResult {
  user: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
  };
  isNewUser: boolean;
  organization: {
    id: string;
    name: string;
    slug: string;
    role: MembershipRole;
  };
}
