/**
 * Assessment Repository Interface
 * Defines the contract for assessment data access
 */

import type {
  Assessment,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  AssessmentStatus,
} from '../entities/assessment';

export interface AssessmentListOptions {
  limit?: number;
  offset?: number;
  status?: AssessmentStatus;
  orderBy?: 'createdAt' | 'updatedAt' | 'title';
  orderDirection?: 'asc' | 'desc';
}

export interface IAssessmentRepository {
  /**
   * Find an assessment by ID
   */
  findById(id: string): Promise<Assessment | null>;

  /**
   * Find all assessments for a user
   */
  findByUserId(userId: string, options?: AssessmentListOptions): Promise<Assessment[]>;

  /**
   * Count assessments for a user
   */
  countByUserId(userId: string): Promise<number>;

  /**
   * Find a published assessment (for public access)
   */
  findPublished(id: string): Promise<Assessment | null>;

  /**
   * Create a new assessment
   */
  create(input: CreateAssessmentInput): Promise<Assessment>;

  /**
   * Update an existing assessment
   */
  update(id: string, input: UpdateAssessmentInput): Promise<Assessment>;

  /**
   * Delete an assessment
   */
  delete(id: string): Promise<void>;

  /**
   * Publish an assessment
   */
  publish(id: string): Promise<Assessment>;

  /**
   * Unpublish an assessment
   */
  unpublish(id: string): Promise<Assessment>;

  /**
   * Duplicate an assessment
   */
  duplicate(id: string, newTitle: string): Promise<Assessment>;

  /**
   * Increment response count
   */
  incrementResponseCount(id: string): Promise<void>;
}
