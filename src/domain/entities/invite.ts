/**
 * Organization Invite Domain Entity
 * Represents an invitation to join an organization
 */

import type { MembershipRole } from './membership';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'revoked';

export interface Invite {
  id: string;
  organizationId: string;
  email: string;
  role: MembershipRole;
  token: string;
  status: InviteStatus;
  invitedBy: string;
  expiresAt: Date;
  acceptedAt: Date | null;
  acceptedBy: string | null;
  createdAt: Date;
}

export interface InviteWithDetails extends Invite {
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  inviter: {
    id: string;
    name: string;
    email: string;
  };
}

export interface CreateInviteInput {
  organizationId: string;
  email: string;
  role?: MembershipRole;
  invitedBy: string;
  expiresInDays?: number;
}

/**
 * Check if an invite is valid (pending and not expired)
 */
export function isInviteValid(invite: Invite): boolean {
  if (invite.status !== 'pending') {
    return false;
  }
  return new Date() < invite.expiresAt;
}

/**
 * Generate a secure random token for invites
 */
export function generateInviteToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

/**
 * Calculate invite expiration date
 */
export function calculateInviteExpiry(days: number = 7): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}
