/**
 * Database Seed Script
 * Creates a system user for development
 *
 * Run with: npx tsx scripts/seed.ts
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { users, assessments } from '../src/infrastructure/database/schema';
import { createDefaultNodes, createDefaultEdges } from '../src/domain/entities/assessment';
import { DEFAULT_ASSESSMENT_SETTINGS } from '../src/domain/entities/assessment';

// Load environment
dotenv.config({ path: '.env.local' });

const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_ASSESSMENT_ID = '00000000-0000-0000-0000-000000000002';

async function seed() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const db = drizzle(pool);

  console.log('🌱 Seeding database...\n');

  try {
    // Create system user
    console.log('Creating system user...');
    await db
      .insert(users)
      .values({
        id: SYSTEM_USER_ID,
        email: 'system@flowform.dev',
        name: 'System User',
        avatarUrl: null,
        plan: 'agency', // Full access for development
        responseCountResetAt: new Date(),
      })
      .onConflictDoNothing();

    console.log('✓ System user created (or already exists)');

    // Create a demo assessment
    console.log('Creating demo assessment...');
    await db
      .insert(assessments)
      .values({
        id: DEMO_ASSESSMENT_ID,
        userId: SYSTEM_USER_ID,
        title: 'Demo Assessment',
        description: 'A sample assessment to test the canvas editor',
        status: 'draft',
        nodes: createDefaultNodes(),
        edges: createDefaultEdges(),
        settings: DEFAULT_ASSESSMENT_SETTINGS,
      })
      .onConflictDoNothing();

    console.log('✓ Demo assessment created (or already exists)');

    console.log('\n✅ Seed complete!\n');
    console.log('System User ID:', SYSTEM_USER_ID);
    console.log('Demo Assessment ID:', DEMO_ASSESSMENT_ID);
    console.log('\nOpen: http://localhost:3000/dashboard/' + DEMO_ASSESSMENT_ID + '/edit');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
