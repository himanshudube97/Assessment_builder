/**
 * Response Repository Implementation
 * Concrete implementation using Drizzle ORM
 */

import { eq, and, desc, asc, sql, avg } from 'drizzle-orm';
import { getDatabase } from '../client';
import { responses } from '../schema';
import type {
  IResponseRepository,
  ResponseListOptions,
} from '@/domain/repositories/response.repository';
import type {
  Response,
  CreateResponseInput,
  Answer,
  ResponseMetadata,
} from '@/domain/entities/response';

/**
 * Map database record to domain entity
 */
function mapToDomain(record: typeof responses.$inferSelect): Response {
  return {
    id: record.id,
    assessmentId: record.assessmentId,
    answers: (record.answers as Answer[]) || [],
    score: record.score,
    maxScore: record.maxScore,
    startedAt: record.startedAt,
    submittedAt: record.submittedAt,
    metadata: (record.metadata as ResponseMetadata) || {
      userAgent: '',
      ipCountry: null,
      referrer: null,
    },
  };
}

export class ResponseRepository implements IResponseRepository {
  private db = getDatabase();

  async findById(id: string): Promise<Response | null> {
    const result = await this.db
      .select()
      .from(responses)
      .where(eq(responses.id, id))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByAssessmentId(
    assessmentId: string,
    options: ResponseListOptions = {}
  ): Promise<Response[]> {
    const {
      limit = 100,
      offset = 0,
      orderBy = 'submittedAt',
      orderDirection = 'desc',
    } = options;

    const orderColumn =
      orderBy === 'score' ? responses.score : responses.submittedAt;
    const orderFn = orderDirection === 'asc' ? asc : desc;

    const result = await this.db
      .select()
      .from(responses)
      .where(eq(responses.assessmentId, assessmentId))
      .orderBy(orderFn(orderColumn))
      .limit(limit)
      .offset(offset);

    return result.map(mapToDomain);
  }

  async countByAssessmentId(assessmentId: string): Promise<number> {
    const result = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(responses)
      .where(eq(responses.assessmentId, assessmentId));

    return result[0]?.count ?? 0;
  }

  async create(input: CreateResponseInput): Promise<Response> {
    const result = await this.db
      .insert(responses)
      .values({
        assessmentId: input.assessmentId,
        answers: input.answers,
        score: input.score ?? null,
        maxScore: input.maxScore ?? null,
        metadata: input.metadata,
        startedAt: input.startedAt ? new Date(input.startedAt) : new Date(),
        submittedAt: new Date(),
      })
      .returning();

    return mapToDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(responses).where(eq(responses.id, id));
  }

  async deleteByAssessmentId(assessmentId: string): Promise<void> {
    await this.db
      .delete(responses)
      .where(eq(responses.assessmentId, assessmentId));
  }

  async getStats(assessmentId: string): Promise<{
    total: number;
    averageScore: number | null;
    completionRate: number;
  }> {
    // Get total count
    const countResult = await this.db
      .select({ count: sql<number>`count(*)::int` })
      .from(responses)
      .where(eq(responses.assessmentId, assessmentId));

    const total = countResult[0]?.count ?? 0;

    // Get average score (only for scored responses)
    const avgResult = await this.db
      .select({ avg: avg(responses.score) })
      .from(responses)
      .where(eq(responses.assessmentId, assessmentId));

    const averageScore = avgResult[0]?.avg
      ? parseFloat(avgResult[0].avg)
      : null;

    // For now, completion rate is 100% since we only store completed responses
    // In the future, we might track partial responses
    const completionRate = total > 0 ? 100 : 0;

    return {
      total,
      averageScore,
      completionRate,
    };
  }

  async getAnswerDistribution(
    assessmentId: string
  ): Promise<Record<string, Record<string, number>>> {
    // Get all responses for this assessment
    const allResponses = await this.findByAssessmentId(assessmentId, {
      limit: 10000, // Get all responses
    });

    // Build distribution map: nodeId -> answerValue -> count
    const distribution: Record<string, Record<string, number>> = {};

    for (const response of allResponses) {
      for (const answer of response.answers) {
        if (!distribution[answer.nodeId]) {
          distribution[answer.nodeId] = {};
        }

        // Handle array answers (multi-select)
        const values = Array.isArray(answer.value)
          ? answer.value
          : [String(answer.value)];

        for (const value of values) {
          const valueStr = String(value);
          distribution[answer.nodeId][valueStr] =
            (distribution[answer.nodeId][valueStr] || 0) + 1;
        }
      }
    }

    return distribution;
  }

  async getResponseTimeline(
    assessmentId: string,
    days = 30
  ): Promise<{ date: string; count: number }[]> {
    const result = await this.db
      .select({
        date: sql<string>`to_char(${responses.submittedAt}::date, 'YYYY-MM-DD')`,
        count: sql<number>`count(*)::int`,
      })
      .from(responses)
      .where(
        and(
          eq(responses.assessmentId, assessmentId),
          sql`${responses.submittedAt} >= now() - interval '1 day' * ${days}`
        )
      )
      .groupBy(sql`${responses.submittedAt}::date`)
      .orderBy(sql`${responses.submittedAt}::date`);

    return result;
  }

  async getCompletionTimeStats(assessmentId: string): Promise<{
    median: number | null;
    average: number | null;
    min: number | null;
    max: number | null;
  }> {
    const result = await this.db
      .select({
        median: sql<number>`percentile_cont(0.5) within group (order by extract(epoch from (${responses.submittedAt} - ${responses.startedAt})))`,
        average: sql<number>`avg(extract(epoch from (${responses.submittedAt} - ${responses.startedAt})))`,
        min: sql<number>`min(extract(epoch from (${responses.submittedAt} - ${responses.startedAt})))`,
        max: sql<number>`max(extract(epoch from (${responses.submittedAt} - ${responses.startedAt})))`,
      })
      .from(responses)
      .where(
        and(
          eq(responses.assessmentId, assessmentId),
          sql`extract(epoch from (${responses.submittedAt} - ${responses.startedAt})) > 5`
        )
      );

    const row = result[0];
    return {
      median: row?.median ? Math.round(row.median) : null,
      average: row?.average ? Math.round(row.average) : null,
      min: row?.min ? Math.round(row.min) : null,
      max: row?.max ? Math.round(row.max) : null,
    };
  }

  async getScoreDistribution(
    assessmentId: string,
    bucketCount = 5
  ): Promise<{ range: string; count: number }[]> {
    const allScores = await this.db
      .select({ score: responses.score, maxScore: responses.maxScore })
      .from(responses)
      .where(
        and(
          eq(responses.assessmentId, assessmentId),
          sql`${responses.score} is not null`
        )
      );

    if (allScores.length === 0) return [];

    const maxScore = Math.max(...allScores.map((r) => r.maxScore ?? 0));
    if (maxScore === 0) return [];

    const bucketSize = Math.ceil(maxScore / bucketCount);
    const buckets: { range: string; count: number }[] = [];

    for (let i = 0; i < bucketCount; i++) {
      const min = i * bucketSize;
      const max = Math.min((i + 1) * bucketSize, maxScore);
      const count = allScores.filter(
        (r) =>
          r.score !== null &&
          r.score >= min &&
          (i === bucketCount - 1 ? r.score <= max : r.score < max)
      ).length;
      buckets.push({ range: `${min}-${max}`, count });
    }

    return buckets;
  }

  async getResponsesForAnalytics(
    assessmentId: string
  ): Promise<
    Pick<
      Response,
      'id' | 'answers' | 'metadata' | 'score' | 'maxScore' | 'startedAt' | 'submittedAt'
    >[]
  > {
    const result = await this.db
      .select()
      .from(responses)
      .where(eq(responses.assessmentId, assessmentId));

    return result.map((r) => ({
      id: r.id,
      answers: (r.answers as Answer[]) || [],
      metadata: (r.metadata as ResponseMetadata) || {
        userAgent: '',
        ipCountry: null,
        referrer: null,
      },
      score: r.score,
      maxScore: r.maxScore,
      startedAt: r.startedAt,
      submittedAt: r.submittedAt,
    }));
  }
}

// Singleton instance
let instance: ResponseRepository | null = null;

export function getResponseRepository(): IResponseRepository {
  if (!instance) {
    instance = new ResponseRepository();
  }
  return instance;
}
