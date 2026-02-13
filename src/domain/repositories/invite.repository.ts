/**
 * Invite Repository Interface
 * Defines the contract for organization invite data access
 */

import type {
  Invite,
  InviteWithDetails,
  CreateInviteInput,
  InviteStatus,
} from '../entities/invite';

export interface IInviteRepository {
  /**
   * Find an invite by ID
   */
  findById(id: string): Promise<Invite | null>;

  /**
   * Find an invite by token
   */
  findByToken(token: string): Promise<InviteWithDetails | null>;

  /**
   * Find pending invite by email and organization
   */
  findPendingByEmailAndOrg(email: string, organizationId: string): Promise<Invite | null>;

  /**
   * Get all invites for an organization
   */
  findByOrganizationId(organizationId: string): Promise<InviteWithDetails[]>;

  /**
   * Create a new invite
   */
  create(input: CreateInviteInput): Promise<Invite>;

  /**
   * Update invite status
   */
  updateStatus(
    id: string,
    status: InviteStatus,
    acceptedBy?: string
  ): Promise<Invite>;

  /**
   * Delete an invite
   */
  delete(id: string): Promise<void>;

  /**
   * Revoke all pending invites for an email in an organization
   */
  revokePendingByEmailAndOrg(email: string, organizationId: string): Promise<void>;

  /**
   * Expire old pending invites (cleanup job)
   */
  expireOldInvites(): Promise<number>;
}
