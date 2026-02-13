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
  unique,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// ===========================================
// Enums
// ===========================================

export const organizationPlanEnum = pgEnum('organization_plan', ['free', 'pro', 'agency']);
export const assessmentStatusEnum = pgEnum('assessment_status', [
  'draft',
  'published',
  'closed',
]);
export const membershipRoleEnum = pgEnum('membership_role', ['owner', 'member']);
export const inviteStatusEnum = pgEnum('invite_status', ['pending', 'accepted', 'expired', 'revoked']);

// ===========================================
// Organizations Table
// ===========================================

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  plan: organizationPlanEnum('plan').notNull().default('free'),
  planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
  stripeCustomerId: varchar('stripe_customer_id', { length: 255 }),
  stripeSubscriptionId: varchar('stripe_subscription_id', { length: 255 }),
  responseCountThisMonth: integer('response_count_this_month').notNull().default(0),
  responseCountResetAt: timestamp('response_count_reset_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
  settings: jsonb('settings').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================
// Users Table
// ===========================================

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  avatarUrl: text('avatar_url'),
  googleId: varchar('google_id', { length: 255 }).unique(),
  lastActiveOrgId: uuid('last_active_org_id').references(() => organizations.id, { onDelete: 'set null' }),
  googleSheetsToken: text('google_sheets_token'), // Encrypted
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================
// Organization Memberships Table
// ===========================================

export const organizationMemberships = pgTable(
  'organization_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: membershipRoleEnum('role').notNull().default('member'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
    invitedBy: uuid('invited_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    unique('org_user_unique').on(table.organizationId, table.userId),
  ]
);

// ===========================================
// Organization Invites Table
// ===========================================

export const organizationInvites = pgTable('organization_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }).notNull(),
  role: membershipRoleEnum('role').notNull().default('member'),
  token: varchar('token', { length: 255 }).notNull().unique(),
  status: inviteStatusEnum('status').notNull().default('pending'),
  invitedBy: uuid('invited_by')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  acceptedAt: timestamp('accepted_at', { withTimezone: true }),
  acceptedBy: uuid('accepted_by').references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ===========================================
// Assessments Table
// ===========================================

export const assessments = pgTable('assessments', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, { onDelete: 'cascade' }),
  createdBy: uuid('created_by')
    .references(() => users.id, { onDelete: 'set null' }),
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
// Assessment Invites Table
// ===========================================

export const assessmentInvites = pgTable('assessment_invites', {
  id: uuid('id').primaryKey().defaultRandom(),
  assessmentId: uuid('assessment_id')
    .notNull()
    .references(() => assessments.id, { onDelete: 'cascade' }),
  email: varchar('email', { length: 255 }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  maxUses: integer('max_uses').notNull().default(1),
  usedCount: integer('used_count').notNull().default(0),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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

export const organizationsRelations = relations(organizations, ({ many }) => ({
  memberships: many(organizationMemberships),
  assessments: many(assessments),
  invites: many(organizationInvites),
}));

export const usersRelations = relations(users, ({ many, one }) => ({
  memberships: many(organizationMemberships),
  sessions: many(sessions),
  createdAssessments: many(assessments),
  lastActiveOrg: one(organizations, {
    fields: [users.lastActiveOrgId],
    references: [organizations.id],
  }),
}));

export const organizationMembershipsRelations = relations(organizationMemberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationMemberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [organizationMemberships.userId],
    references: [users.id],
  }),
  inviter: one(users, {
    fields: [organizationMemberships.invitedBy],
    references: [users.id],
  }),
}));

export const organizationInvitesRelations = relations(organizationInvites, ({ one }) => ({
  organization: one(organizations, {
    fields: [organizationInvites.organizationId],
    references: [organizations.id],
  }),
  inviter: one(users, {
    fields: [organizationInvites.invitedBy],
    references: [users.id],
  }),
  accepter: one(users, {
    fields: [organizationInvites.acceptedBy],
    references: [users.id],
  }),
}));

export const assessmentsRelations = relations(assessments, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [assessments.organizationId],
    references: [organizations.id],
  }),
  creator: one(users, {
    fields: [assessments.createdBy],
    references: [users.id],
  }),
  responses: many(responses),
  invites: many(assessmentInvites),
}));

export const assessmentInvitesRelations = relations(assessmentInvites, ({ one }) => ({
  assessment: one(assessments, {
    fields: [assessmentInvites.assessmentId],
    references: [assessments.id],
  }),
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

export type OrganizationRecord = typeof organizations.$inferSelect;
export type NewOrganizationRecord = typeof organizations.$inferInsert;

export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;

export type OrganizationMembershipRecord = typeof organizationMemberships.$inferSelect;
export type NewOrganizationMembershipRecord = typeof organizationMemberships.$inferInsert;

export type OrganizationInviteRecord = typeof organizationInvites.$inferSelect;
export type NewOrganizationInviteRecord = typeof organizationInvites.$inferInsert;

export type AssessmentRecord = typeof assessments.$inferSelect;
export type NewAssessmentRecord = typeof assessments.$inferInsert;

export type ResponseRecord = typeof responses.$inferSelect;
export type NewResponseRecord = typeof responses.$inferInsert;

export type SessionRecord = typeof sessions.$inferSelect;
export type NewSessionRecord = typeof sessions.$inferInsert;

export type AssessmentInviteRecord = typeof assessmentInvites.$inferSelect;
export type NewAssessmentInviteRecord = typeof assessmentInvites.$inferInsert;
