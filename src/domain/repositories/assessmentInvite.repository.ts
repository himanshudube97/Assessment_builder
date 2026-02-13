/**
 * Assessment Invite Repository Interface
 * Defines the contract for assessment invite data access
 */

import type { AssessmentInvite, CreateAssessmentInviteInput } from '../entities/assessmentInvite';

export interface IAssessmentInviteRepository {
  findById(id: string): Promise<AssessmentInvite | null>;
  findByToken(token: string): Promise<AssessmentInvite | null>;
  findByAssessmentId(assessmentId: string): Promise<AssessmentInvite[]>;
  create(input: CreateAssessmentInviteInput): Promise<AssessmentInvite>;
  createBulk(inputs: CreateAssessmentInviteInput[]): Promise<AssessmentInvite[]>;
  incrementUsedCount(id: string): Promise<void>;
  delete(id: string): Promise<void>;
  deleteByAssessmentId(assessmentId: string): Promise<void>;
}
