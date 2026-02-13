/**
 * Response Repository Interface
 * Defines the contract for response data access
 */

import type { Response, CreateResponseInput } from '../entities/response';

export interface ResponseListOptions {
  limit?: number;
  offset?: number;
  orderBy?: 'submittedAt' | 'score';
  orderDirection?: 'asc' | 'desc';
}

export interface IResponseRepository {
  /**
   * Find a response by ID
   */
  findById(id: string): Promise<Response | null>;

  /**
   * Find all responses for an assessment
   */
  findByAssessmentId(
    assessmentId: string,
    options?: ResponseListOptions
  ): Promise<Response[]>;

  /**
   * Count responses for an assessment
   */
  countByAssessmentId(assessmentId: string): Promise<number>;

  /**
   * Create a new response
   */
  create(input: CreateResponseInput): Promise<Response>;

  /**
   * Delete a response
   */
  delete(id: string): Promise<void>;

  /**
   * Delete all responses for an assessment
   */
  deleteByAssessmentId(assessmentId: string): Promise<void>;

  /**
   * Get response statistics for an assessment
   */
  getStats(assessmentId: string): Promise<{
    total: number;
    averageScore: number | null;
    completionRate: number;
  }>;

  /**
   * Get answer distribution for analytics
   * Returns count of each answer value per question
   */
  getAnswerDistribution(
    assessmentId: string
  ): Promise<Record<string, Record<string, number>>>;
}
