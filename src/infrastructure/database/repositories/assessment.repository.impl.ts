/**
 * Assessment Repository Implementation
 * Concrete implementation using Drizzle ORM
 */

import { eq, desc, asc, and, sql } from 'drizzle-orm';
import { getDatabase } from '../client';
import { assessments } from '../schema';
import type {
  IAssessmentRepository,
  AssessmentListOptions,
} from '@/domain/repositories/assessment.repository';
import type {
  Assessment,
  CreateAssessmentInput,
  UpdateAssessmentInput,
  AssessmentSettings,
} from '@/domain/entities/assessment';
import {
  DEFAULT_ASSESSMENT_SETTINGS,
  createDefaultNodes,
  createDefaultEdges,
} from '@/domain/entities/assessment';
import type { FlowNode, FlowEdge } from '@/domain/entities/flow';

/**
 * Map database record to domain entity
 */
function mapToDomain(record: typeof assessments.$inferSelect): Assessment {
  return {
    id: record.id,
    userId: record.userId,
    title: record.title,
    description: record.description,
    status: record.status,
    nodes: (record.nodes as FlowNode[]) || [],
    edges: (record.edges as FlowEdge[]) || [],
    settings: {
      ...DEFAULT_ASSESSMENT_SETTINGS,
      ...(record.settings as Partial<AssessmentSettings>),
    },
    googleSheetId: record.googleSheetId,
    googleSheetName: record.googleSheetName,
    responseCount: record.responseCount,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    publishedAt: record.publishedAt,
  };
}

export class AssessmentRepository implements IAssessmentRepository {
  private db = getDatabase();

  async findById(id: string): Promise<Assessment | null> {
    const result = await this.db
      .select()
      .from(assessments)
      .where(eq(assessments.id, id))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByUserId(
    userId: string,
    options: AssessmentListOptions = {}
  ): Promise<Assessment[]> {
    const {
      limit = 50,
      offset = 0,
      status,
      orderBy = 'updatedAt',
      orderDirection = 'desc',
    } = options;

    const conditions = [eq(assessments.userId, userId)];
    if (status) {
      conditions.push(eq(assessments.status, status));
    }

    const orderColumn =
      orderBy === 'title'
        ? assessments.title
        : orderBy === 'createdAt'
          ? assessments.createdAt
          : assessments.updatedAt;

    const orderFn = orderDirection === 'asc' ? asc : desc;

    const result = await this.db
      .select()
      .from(assessments)
      .where(and(...conditions))
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(offset);

    return result.map(mapToDomain);
  }

  async countByUserId(userId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(assessments)
      .where(eq(assessments.userId, userId));

    return result[0]?.count ?? 0;
  }

  async findPublished(id: string): Promise<Assessment | null> {
    const result = await this.db
      .select()
      .from(assessments)
      .where(and(eq(assessments.id, id), eq(assessments.status, 'published')))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async create(input: CreateAssessmentInput): Promise<Assessment> {
    const result = await this.db
      .insert(assessments)
      .values({
        userId: input.userId,
        title: input.title,
        description: input.description ?? null,
        nodes: createDefaultNodes(),
        edges: createDefaultEdges(),
        settings: DEFAULT_ASSESSMENT_SETTINGS,
      })
      .returning();

    return mapToDomain(result[0]);
  }

  async update(id: string, input: UpdateAssessmentInput): Promise<Assessment> {
    const current = await this.findById(id);
    if (!current) {
      throw new Error(`Assessment not found: ${id}`);
    }

    const updateData: Partial<typeof assessments.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.title !== undefined) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.nodes !== undefined) updateData.nodes = input.nodes;
    if (input.edges !== undefined) updateData.edges = input.edges;
    if (input.settings !== undefined) {
      updateData.settings = { ...current.settings, ...input.settings };
    }
    if (input.googleSheetId !== undefined)
      updateData.googleSheetId = input.googleSheetId;
    if (input.googleSheetName !== undefined)
      updateData.googleSheetName = input.googleSheetName;

    const result = await this.db
      .update(assessments)
      .set(updateData)
      .where(eq(assessments.id, id))
      .returning();

    return mapToDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(assessments).where(eq(assessments.id, id));
  }

  async publish(id: string): Promise<Assessment> {
    const result = await this.db
      .update(assessments)
      .set({
        status: 'published',
        publishedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, id))
      .returning();

    if (!result[0]) {
      throw new Error(`Assessment not found: ${id}`);
    }

    return mapToDomain(result[0]);
  }

  async unpublish(id: string): Promise<Assessment> {
    const result = await this.db
      .update(assessments)
      .set({
        status: 'draft',
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, id))
      .returning();

    if (!result[0]) {
      throw new Error(`Assessment not found: ${id}`);
    }

    return mapToDomain(result[0]);
  }

  async duplicate(id: string, newTitle: string): Promise<Assessment> {
    const original = await this.findById(id);
    if (!original) {
      throw new Error(`Assessment not found: ${id}`);
    }

    const result = await this.db
      .insert(assessments)
      .values({
        userId: original.userId,
        title: newTitle,
        description: original.description,
        nodes: original.nodes,
        edges: original.edges,
        settings: original.settings,
        // Don't copy: id, status (draft), googleSheet*, responseCount, publishedAt
      })
      .returning();

    return mapToDomain(result[0]);
  }

  async incrementResponseCount(id: string): Promise<void> {
    await this.db
      .update(assessments)
      .set({
        responseCount: sql`${assessments.responseCount} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(assessments.id, id));
  }
}

// Singleton instance
let instance: AssessmentRepository | null = null;

export function getAssessmentRepository(): IAssessmentRepository {
  if (!instance) {
    instance = new AssessmentRepository();
  }
  return instance;
}
