/**
 * Assessment Invite Repository Implementation
 * Concrete implementation using Drizzle ORM
 */

import { eq, sql } from 'drizzle-orm';
import { getDatabase } from '../client';
import { assessmentInvites } from '../schema';
import type { IAssessmentInviteRepository } from '@/domain/repositories/assessmentInvite.repository';
import type { AssessmentInvite, CreateAssessmentInviteInput } from '@/domain/entities/assessmentInvite';
import { generateInviteToken, calculateInviteExpiry } from '@/domain/entities/invite';

function mapToDomain(record: typeof assessmentInvites.$inferSelect): AssessmentInvite {
  return {
    id: record.id,
    assessmentId: record.assessmentId,
    email: record.email,
    token: record.token,
    maxUses: record.maxUses,
    usedCount: record.usedCount,
    expiresAt: record.expiresAt,
    createdAt: record.createdAt,
  };
}

export class AssessmentInviteRepository implements IAssessmentInviteRepository {
  private db = getDatabase();

  async findById(id: string): Promise<AssessmentInvite | null> {
    const result = await this.db
      .select()
      .from(assessmentInvites)
      .where(eq(assessmentInvites.id, id))
      .limit(1);
    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByToken(token: string): Promise<AssessmentInvite | null> {
    const result = await this.db
      .select()
      .from(assessmentInvites)
      .where(eq(assessmentInvites.token, token))
      .limit(1);
    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByAssessmentId(assessmentId: string): Promise<AssessmentInvite[]> {
    const result = await this.db
      .select()
      .from(assessmentInvites)
      .where(eq(assessmentInvites.assessmentId, assessmentId));
    return result.map(mapToDomain);
  }

  async create(input: CreateAssessmentInviteInput): Promise<AssessmentInvite> {
    const token = generateInviteToken();
    const expiresAt =
      input.expiresInDays != null
        ? calculateInviteExpiry(input.expiresInDays)
        : null;

    const result = await this.db
      .insert(assessmentInvites)
      .values({
        assessmentId: input.assessmentId,
        email: input.email?.toLowerCase() ?? null,
        token,
        maxUses: input.maxUses ?? 1,
        expiresAt,
      })
      .returning();

    return mapToDomain(result[0]);
  }

  async createBulk(inputs: CreateAssessmentInviteInput[]): Promise<AssessmentInvite[]> {
    if (inputs.length === 0) return [];

    const values = inputs.map((input) => ({
      assessmentId: input.assessmentId,
      email: input.email?.toLowerCase() ?? null,
      token: generateInviteToken(),
      maxUses: input.maxUses ?? 1,
      expiresAt:
        input.expiresInDays != null
          ? calculateInviteExpiry(input.expiresInDays)
          : null,
    }));

    const result = await this.db
      .insert(assessmentInvites)
      .values(values)
      .returning();

    return result.map(mapToDomain);
  }

  async incrementUsedCount(id: string): Promise<void> {
    await this.db
      .update(assessmentInvites)
      .set({ usedCount: sql`${assessmentInvites.usedCount} + 1` })
      .where(eq(assessmentInvites.id, id));
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(assessmentInvites).where(eq(assessmentInvites.id, id));
  }

  async deleteByAssessmentId(assessmentId: string): Promise<void> {
    await this.db
      .delete(assessmentInvites)
      .where(eq(assessmentInvites.assessmentId, assessmentId));
  }
}

let instance: AssessmentInviteRepository | null = null;

export function getAssessmentInviteRepository(): IAssessmentInviteRepository {
  if (!instance) {
    instance = new AssessmentInviteRepository();
  }
  return instance;
}
