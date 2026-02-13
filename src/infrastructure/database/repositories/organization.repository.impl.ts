/**
 * Organization Repository Implementation
 * Concrete implementation using Drizzle ORM
 */

import { eq, ne, and, count } from 'drizzle-orm';
import { getDatabase } from '../client';
import { organizations, assessments } from '../schema';
import type { IOrganizationRepository } from '@/domain/repositories/organization.repository';
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationSettings,
} from '@/domain/entities/organization';
import { generateSlug } from '@/domain/entities/organization';

/**
 * Map database record to domain entity
 */
function mapToDomain(record: typeof organizations.$inferSelect): Organization {
  return {
    id: record.id,
    name: record.name,
    slug: record.slug,
    plan: record.plan,
    planExpiresAt: record.planExpiresAt,
    stripeCustomerId: record.stripeCustomerId,
    stripeSubscriptionId: record.stripeSubscriptionId,
    responseCountThisMonth: record.responseCountThisMonth,
    responseCountResetAt: record.responseCountResetAt,
    settings: (record.settings as OrganizationSettings) || {},
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class OrganizationRepository implements IOrganizationRepository {
  private db = getDatabase();

  async findById(id: string): Promise<Organization | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.id, id))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const result = await this.db
      .select()
      .from(organizations)
      .where(eq(organizations.slug, slug.toLowerCase()))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async create(input: CreateOrganizationInput): Promise<Organization> {
    let slug = input.slug || generateSlug(input.name);

    // Ensure unique slug
    let counter = 0;
    const baseSlug = slug;
    while (!(await this.isSlugAvailable(slug))) {
      counter++;
      slug = `${baseSlug}-${counter}`;
    }

    const result = await this.db
      .insert(organizations)
      .values({
        name: input.name,
        slug,
        plan: input.plan || 'free',
        responseCountResetAt: new Date(),
      })
      .returning();

    return mapToDomain(result[0]);
  }

  async update(id: string, input: UpdateOrganizationInput): Promise<Organization> {
    const updateData: Partial<typeof organizations.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.slug !== undefined) updateData.slug = input.slug;
    if (input.plan !== undefined) updateData.plan = input.plan;
    if (input.planExpiresAt !== undefined) updateData.planExpiresAt = input.planExpiresAt;
    if (input.stripeCustomerId !== undefined) updateData.stripeCustomerId = input.stripeCustomerId;
    if (input.stripeSubscriptionId !== undefined)
      updateData.stripeSubscriptionId = input.stripeSubscriptionId;
    if (input.settings !== undefined) updateData.settings = input.settings;

    const result = await this.db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, id))
      .returning();

    if (!result[0]) {
      throw new Error(`Organization not found: ${id}`);
    }

    return mapToDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(organizations).where(eq(organizations.id, id));
  }

  async incrementResponseCount(id: string): Promise<void> {
    const org = await this.findById(id);
    if (!org) {
      throw new Error(`Organization not found: ${id}`);
    }

    // Check if we need to reset the counter (new month)
    const now = new Date();
    const resetAt = new Date(org.responseCountResetAt);
    const isNewMonth =
      now.getMonth() !== resetAt.getMonth() ||
      now.getFullYear() !== resetAt.getFullYear();

    if (isNewMonth) {
      await this.db
        .update(organizations)
        .set({
          responseCountThisMonth: 1,
          responseCountResetAt: now,
          updatedAt: now,
        })
        .where(eq(organizations.id, id));
    } else {
      await this.db
        .update(organizations)
        .set({
          responseCountThisMonth: org.responseCountThisMonth + 1,
          updatedAt: now,
        })
        .where(eq(organizations.id, id));
    }
  }

  async resetResponseCount(id: string): Promise<void> {
    await this.db
      .update(organizations)
      .set({
        responseCountThisMonth: 0,
        responseCountResetAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(organizations.id, id));
  }

  async isSlugAvailable(slug: string, excludeId?: string): Promise<boolean> {
    const query = excludeId
      ? and(eq(organizations.slug, slug.toLowerCase()), ne(organizations.id, excludeId))
      : eq(organizations.slug, slug.toLowerCase());

    const result = await this.db
      .select({ count: count() })
      .from(organizations)
      .where(query);

    return result[0].count === 0;
  }

  async getAssessmentCount(id: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(assessments)
      .where(eq(assessments.organizationId, id));

    return result[0].count;
  }
}

// Singleton instance
let instance: OrganizationRepository | null = null;

export function getOrganizationRepository(): IOrganizationRepository {
  if (!instance) {
    instance = new OrganizationRepository();
  }
  return instance;
}
