/**
 * Database Infrastructure
 * Main export for database-related modules
 */

// Client and utilities
export {
  getDatabase,
  getPool,
  closeDatabase,
  checkDatabaseHealth,
  withTransaction,
  getDatabaseProvider,
  schema,
} from './client';
export type { DatabaseProvider } from './client';

// Repositories
export {
  getUserRepository,
  getAssessmentRepository,
  getResponseRepository,
} from './repositories';
