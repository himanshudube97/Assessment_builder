/**
 * Membership Repository Interface
 * Defines the contract for organization membership data access
 */

import type {
  Membership,
  MembershipWithDetails,
  CreateMembershipInput,
  UpdateMembershipInput,
} from '../entities/membership';

export interface IMembershipRepository {
  /**
   * Find a membership by ID
   */
  findById(id: string): Promise<Membership | null>;

  /**
   * Find a membership by organization and user
   */
  findByOrgAndUser(organizationId: string, userId: string): Promise<Membership | null>;

  /**
   * Get all memberships for a user (with org details)
   */
  findByUserId(userId: string): Promise<MembershipWithDetails[]>;

  /**
   * Get all members of an organization (with user details)
   */
  findByOrganizationId(organizationId: string): Promise<MembershipWithDetails[]>;

  /**
   * Create a new membership
   */
  create(input: CreateMembershipInput): Promise<Membership>;

  /**
   * Update a membership
   */
  update(id: string, input: UpdateMembershipInput): Promise<Membership>;

  /**
   * Delete a membership
   */
  delete(id: string): Promise<void>;

  /**
   * Delete a membership by org and user
   */
  deleteByOrgAndUser(organizationId: string, userId: string): Promise<void>;

  /**
   * Count members in an organization
   */
  countByOrganization(organizationId: string): Promise<number>;

  /**
   * Check if user is owner of organization
   */
  isOwner(organizationId: string, userId: string): Promise<boolean>;

  /**
   * Count owners in an organization
   */
  countOwners(organizationId: string): Promise<number>;
}
