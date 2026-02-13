/**
 * Membership Repository Implementation
 * Concrete implementation using Drizzle ORM
 */

import { eq, and, count } from 'drizzle-orm';
import { getDatabase } from '../client';
import { organizationMemberships, users, organizations } from '../schema';
import type { IMembershipRepository } from '@/domain/repositories/membership.repository';
import type {
  Membership,
  MembershipWithDetails,
  CreateMembershipInput,
  UpdateMembershipInput,
} from '@/domain/entities/membership';

/**
 * Map database record to domain entity
 */
function mapToDomain(record: typeof organizationMemberships.$inferSelect): Membership {
  return {
    id: record.id,
    organizationId: record.organizationId,
    userId: record.userId,
    role: record.role,
    joinedAt: record.joinedAt,
    invitedBy: record.invitedBy,
  };
}

export class MembershipRepository implements IMembershipRepository {
  private db = getDatabase();

  async findById(id: string): Promise<Membership | null> {
    const result = await this.db
      .select()
      .from(organizationMemberships)
      .where(eq(organizationMemberships.id, id))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByOrgAndUser(organizationId: string, userId: string): Promise<Membership | null> {
    const result = await this.db
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, userId)
        )
      )
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByUserId(userId: string): Promise<MembershipWithDetails[]> {
    const result = await this.db
      .select({
        membership: organizationMemberships,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        organization: {
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        },
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(organizationMemberships.userId, users.id))
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(eq(organizationMemberships.userId, userId));

    return result.map((row) => ({
      ...mapToDomain(row.membership),
      user: row.user,
      organization: row.organization,
    }));
  }

  async findByOrganizationId(organizationId: string): Promise<MembershipWithDetails[]> {
    const result = await this.db
      .select({
        membership: organizationMemberships,
        user: {
          id: users.id,
          email: users.email,
          name: users.name,
          avatarUrl: users.avatarUrl,
        },
        organization: {
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        },
      })
      .from(organizationMemberships)
      .innerJoin(users, eq(organizationMemberships.userId, users.id))
      .innerJoin(organizations, eq(organizationMemberships.organizationId, organizations.id))
      .where(eq(organizationMemberships.organizationId, organizationId));

    return result.map((row) => ({
      ...mapToDomain(row.membership),
      user: row.user,
      organization: row.organization,
    }));
  }

  async create(input: CreateMembershipInput): Promise<Membership> {
    const result = await this.db
      .insert(organizationMemberships)
      .values({
        organizationId: input.organizationId,
        userId: input.userId,
        role: input.role || 'member',
        invitedBy: input.invitedBy ?? null,
      })
      .returning();

    return mapToDomain(result[0]);
  }

  async update(id: string, input: UpdateMembershipInput): Promise<Membership> {
    const updateData: Partial<typeof organizationMemberships.$inferInsert> = {};

    if (input.role !== undefined) updateData.role = input.role;

    const result = await this.db
      .update(organizationMemberships)
      .set(updateData)
      .where(eq(organizationMemberships.id, id))
      .returning();

    if (!result[0]) {
      throw new Error(`Membership not found: ${id}`);
    }

    return mapToDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(organizationMemberships).where(eq(organizationMemberships.id, id));
  }

  async deleteByOrgAndUser(organizationId: string, userId: string): Promise<void> {
    await this.db
      .delete(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, userId)
        )
      );
  }

  async countByOrganization(organizationId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(organizationMemberships)
      .where(eq(organizationMemberships.organizationId, organizationId));

    return result[0].count;
  }

  async isOwner(organizationId: string, userId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.userId, userId),
          eq(organizationMemberships.role, 'owner')
        )
      )
      .limit(1);

    return result.length > 0;
  }

  async countOwners(organizationId: string): Promise<number> {
    const result = await this.db
      .select({ count: count() })
      .from(organizationMemberships)
      .where(
        and(
          eq(organizationMemberships.organizationId, organizationId),
          eq(organizationMemberships.role, 'owner')
        )
      );

    return result[0].count;
  }
}

// Singleton instance
let instance: MembershipRepository | null = null;

export function getMembershipRepository(): IMembershipRepository {
  if (!instance) {
    instance = new MembershipRepository();
  }
  return instance;
}
