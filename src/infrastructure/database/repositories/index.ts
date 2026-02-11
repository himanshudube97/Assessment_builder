/**
 * Repository Factory
 * Provides access to all repository implementations
 */

export { getUserRepository } from './user.repository.impl';
export { getAssessmentRepository } from './assessment.repository.impl';
export { getResponseRepository } from './response.repository.impl';

// Re-export types
export type { IUserRepository } from '@/domain/repositories/user.repository';
export type { IAssessmentRepository } from '@/domain/repositories/assessment.repository';
export type { IResponseRepository } from '@/domain/repositories/response.repository';
