/**
 * Organization Repository Interface
 * Defines the contract for organization data access
 */

import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
} from '../entities/organization';

export interface IOrganizationRepository {
  /**
   * Find an organization by ID
   */
  findById(id: string): Promise<Organization | null>;

  /**
   * Find an organization by slug
   */
  findBySlug(slug: string): Promise<Organization | null>;

  /**
   * Create a new organization
   */
  create(input: CreateOrganizationInput): Promise<Organization>;

  /**
   * Update an organization
   */
  update(id: string, input: UpdateOrganizationInput): Promise<Organization>;

  /**
   * Delete an organization
   */
  delete(id: string): Promise<void>;

  /**
   * Increment response count for the current month
   */
  incrementResponseCount(id: string): Promise<void>;

  /**
   * Reset response count (called monthly)
   */
  resetResponseCount(id: string): Promise<void>;

  /**
   * Check if a slug is available
   */
  isSlugAvailable(slug: string, excludeId?: string): Promise<boolean>;

  /**
   * Get assessment count for an organization
   */
  getAssessmentCount(id: string): Promise<number>;
}
