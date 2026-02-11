/**
 * Drizzle ORM Schema
 * Database table definitions - works with both local Postgres and Supabase
 */

import {
  pgTable,
  uuid,
  varchar,
  text,
  timestamp,
  integer,
  jsonb,
  pgEnum,
  boolean,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===========================================
// Enums
// ===========================================

export const userPlanEnum = pgEnum('user_plan', ['free', 'pro', 'agency']);
export const assessmentStatusEnum = pgEnum('assessment_status', [
  'draft',
  'published',
  'closed',
]);

// ===========================================
// Users Table
// ===========================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  plan: userPlanEnum('plan').notNull().default('free'),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  responseCountThisMonth: integer('response_count_this_month').notNull().default(0),
  responseCountResetAt: timestamp('response_count_reset_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  googleSheetsToken: text('google_sheets_token'), // Encrypted
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================
// Assessments Table
// ===========================================

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description'),
  status: assessmentStatusEnum('status').notNull().default('draft'),

  // Canvas data stored as JSON
  nodes: jsonb('nodes').notNull().default([]),
  edges: jsonb('edges').notNull().default([]),

  // Settings stored as JSON
  settings: jsonb('settings').notNull().default({}),

  // Google Sheets integration
  googleSheetId: varchar('google_sheet_id', { length: 255 }),
  googleSheetName: varchar('google_sheet_name', { length: 255 }),

  // Stats
  responseCount: integer('response_count').notNull().default(0),

  // Timestamps
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
  publishedAt: timestamp('published_at', { withTimezone: true }),
});

// ===========================================
// Responses Table
// ===========================================

export const responses = pgTable('responses', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id')
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),

  // Answers stored as JSON array
  answers: jsonb('answers').notNull().default([]),

  // Scoring
  score: integer('score'),
  maxScore: integer('max_score'),

  // Metadata
  metadata: jsonb('metadata').notNull().default({}),

  // Timestamps
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================
// Sessions Table (for JWT management)
// ===========================================

export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================
// Relations
// ===========================================

export const usersRelations = relations(users, ({ many }) => ({
  assessments: many(assessments),
  sessions: many(sessions),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  user: one(users, {
    fields: [assessments.userId],
    references: [users.id],
  }),
  responses: many(responses),
}));

export const responsesRelations = relations(responses, ({ one }) => ({
  assessment: one(assessments, {
    fields: [responses.assessmentId],
    references: [assessments.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

// ===========================================
// Type Exports
// ===========================================

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

export type AssessmentRecord = typeof assessments.$inferSelect;
export type NewAssessmentRecord = typeof assessments.$inferInsert;

export type ResponseRecord = typeof responses.$inferSelect;
export type NewResponseRecord = typeof responses.$inferInsert;

export type SessionRecord = typeof sessions.$inferSelect;
export type NewSessionRecord = typeof sessions.$inferInsert;
