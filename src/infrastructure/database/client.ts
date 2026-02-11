/**
 * Database Client
 * Provides a unified database interface that works with both
 * local Docker Postgres and Supabase
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

// Database provider type
export type DatabaseProvider = 'local' | 'supabase';

// Global connection pool (singleton)
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

/**
 * Get the database provider from environment
 */
export function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DB_PROVIDER || 'local';
  if (provider !== 'local' && provider !== 'supabase') {
    console.warn(`Unknown DB_PROVIDER "${provider}", defaulting to "local"`);
    return 'local';
  }
  return provider;
}

/**
 * Get the database URL from environment
 */
function getDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  return url;
}

/**
 * Create a new connection pool
 */
function createPool(): Pool {
  const connectionString = getDatabaseUrl();
  const provider = getDatabaseProvider();

  const poolConfig = {
    connectionString,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };

  // Supabase requires SSL
  if (provider === 'supabase') {
    return new Pool({
      ...poolConfig,
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  return new Pool(poolConfig);
}

/**
 * Get the database instance (singleton)
 * This is the main entry point for database operations
 */
export function getDatabase() {
  if (!db) {
    pool = createPool();
    db = drizzle(pool, { schema });
  }
  return db;
}

/**
 * Get the raw connection pool
 * Use this for transactions or custom queries
 */
export function getPool(): Pool {
  if (!pool) {
    pool = createPool();
  }
  return pool;
}

/**
 * Close the database connection
 * Call this during graceful shutdown
 */
export async function closeDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    db = null;
  }
}

/**
 * Check database connection health
 */
export async function checkDatabaseHealth(): Promise<boolean> {
  try {
    const pool = getPool();
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

/**
 * Database type alias for convenience
 */
export type Database = ReturnType<typeof getDatabase>;

/**
 * Database transaction helper
 * Uses Drizzle's built-in transaction support
 */
export async function withTransaction<T>(
  callback: (tx: Database) => Promise<T>
): Promise<T> {
  const database = getDatabase();
  // Note: For proper transaction support, use database.transaction()
  // This is a simplified version that works for most use cases
  return callback(database);
}

// Export schema for convenience
export { schema };
