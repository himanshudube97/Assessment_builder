/**
 * Organization Membership Domain Entity
 * Represents a user's membership in an organization
 */

export type MembershipRole = 'owner' | 'member';

export interface Membership {
  id: string;
  organizationId: string;
  userId: string;
  role: MembershipRole;
  joinedAt: Date;
  invitedBy: string | null;
}

export interface MembershipWithDetails extends Membership {
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
  };
}

export interface CreateMembershipInput {
  organizationId: string;
  userId: string;
  role?: MembershipRole;
  invitedBy?: string | null;
}

export interface UpdateMembershipInput {
  role?: MembershipRole;
}

/**
 * Check if a role has permission for an action
 */
export function hasPermission(role: MembershipRole, action: MembershipAction): boolean {
  return ROLE_PERMISSIONS[role].includes(action);
}

export type MembershipAction =
  | 'view_assessments'
  | 'create_assessment'
  | 'edit_assessment'
  | 'delete_assessment'
  | 'view_responses'
  | 'view_analytics'
  | 'invite_members'
  | 'remove_members'
  | 'manage_settings'
  | 'manage_billing'
  | 'delete_organization';

const ROLE_PERMISSIONS: Record<MembershipRole, MembershipAction[]> = {
  member: [
    'view_assessments',
    'create_assessment',
    'edit_assessment',
    'view_responses',
    'view_analytics',
  ],
  owner: [
    'view_assessments',
    'create_assessment',
    'edit_assessment',
    'delete_assessment',
    'view_responses',
    'view_analytics',
    'invite_members',
    'remove_members',
    'manage_settings',
    'manage_billing',
    'delete_organization',
  ],
};

export function canPerformAction(membership: Membership, action: MembershipAction): boolean {
  return hasPermission(membership.role, action);
}
