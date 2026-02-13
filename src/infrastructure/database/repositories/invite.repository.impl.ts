/**
 * Invite Repository Implementation
 * Concrete implementation using Drizzle ORM
 */

import { eq, and, lt } from 'drizzle-orm';
import { getDatabase } from '../client';
import { organizationInvites, users, organizations } from '../schema';
import type { IInviteRepository } from '@/domain/repositories/invite.repository';
import type {
  Invite,
  InviteWithDetails,
  CreateInviteInput,
  InviteStatus,
} from '@/domain/entities/invite';
import { generateInviteToken, calculateInviteExpiry } from '@/domain/entities/invite';

/**
 * Map database record to domain entity
 */
function mapToDomain(record: typeof organizationInvites.$inferSelect): Invite {
  return {
    id: record.id,
    organizationId: record.organizationId,
    email: record.email,
    role: record.role,
    token: record.token,
    status: record.status,
    invitedBy: record.invitedBy,
    expiresAt: record.expiresAt,
    acceptedAt: record.acceptedAt,
    acceptedBy: record.acceptedBy,
    createdAt: record.createdAt,
  };
}

export class InviteRepository implements IInviteRepository {
  private db = getDatabase();

  async findById(id: string): Promise<Invite | null> {
    const result = await this.db
      .select()
      .from(organizationInvites)
      .where(eq(organizationInvites.id, id))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByToken(token: string): Promise<InviteWithDetails | null> {
    const result = await this.db
      .select({
        invite: organizationInvites,
        organization: {
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        },
        inviter: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(organizationInvites)
      .innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id))
      .innerJoin(users, eq(organizationInvites.invitedBy, users.id))
      .where(eq(organizationInvites.token, token))
      .limit(1);

    if (!result[0]) return null;

    return {
      ...mapToDomain(result[0].invite),
      organization: result[0].organization,
      inviter: result[0].inviter,
    };
  }

  async findPendingByEmailAndOrg(email: string, organizationId: string): Promise<Invite | null> {
    const result = await this.db
      .select()
      .from(organizationInvites)
      .where(
        and(
          eq(organizationInvites.email, email.toLowerCase()),
          eq(organizationInvites.organizationId, organizationId),
          eq(organizationInvites.status, 'pending')
        )
      )
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByOrganizationId(organizationId: string): Promise<InviteWithDetails[]> {
    const result = await this.db
      .select({
        invite: organizationInvites,
        organization: {
          id: organizations.id,
          name: organizations.name,
          slug: organizations.slug,
        },
        inviter: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(organizationInvites)
      .innerJoin(organizations, eq(organizationInvites.organizationId, organizations.id))
      .innerJoin(users, eq(organizationInvites.invitedBy, users.id))
      .where(eq(organizationInvites.organizationId, organizationId));

    return result.map((row) => ({
      ...mapToDomain(row.invite),
      organization: row.organization,
      inviter: row.inviter,
    }));
  }

  async create(input: CreateInviteInput): Promise<Invite> {
    const token = generateInviteToken();
    const expiresAt = calculateInviteExpiry(input.expiresInDays);

    const result = await this.db
      .insert(organizationInvites)
      .values({
        organizationId: input.organizationId,
        email: input.email.toLowerCase(),
        role: input.role || 'member',
        token,
        invitedBy: input.invitedBy,
        expiresAt,
      })
      .returning();

    return mapToDomain(result[0]);
  }

  async updateStatus(
    id: string,
    status: InviteStatus,
    acceptedBy?: string
  ): Promise<Invite> {
    const updateData: Partial<typeof organizationInvites.$inferInsert> = {
      status,
    };

    if (status === 'accepted' && acceptedBy) {
      updateData.acceptedAt = new Date();
      updateData.acceptedBy = acceptedBy;
    }

    const result = await this.db
      .update(organizationInvites)
      .set(updateData)
      .where(eq(organizationInvites.id, id))
      .returning();

    if (!result[0]) {
      throw new Error(`Invite not found: ${id}`);
    }

    return mapToDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(organizationInvites).where(eq(organizationInvites.id, id));
  }

  async revokePendingByEmailAndOrg(email: string, organizationId: string): Promise<void> {
    await this.db
      .update(organizationInvites)
      .set({ status: 'revoked' })
      .where(
        and(
          eq(organizationInvites.email, email.toLowerCase()),
          eq(organizationInvites.organizationId, organizationId),
          eq(organizationInvites.status, 'pending')
        )
      );
  }

  async expireOldInvites(): Promise<number> {
    const now = new Date();

    const result = await this.db
      .update(organizationInvites)
      .set({ status: 'expired' })
      .where(
        and(
          eq(organizationInvites.status, 'pending'),
          lt(organizationInvites.expiresAt, now)
        )
      )
      .returning();

    return result.length;
  }
}

// Singleton instance
let instance: InviteRepository | null = null;

export function getInviteRepository(): IInviteRepository {
  if (!instance) {
    instance = new InviteRepository();
  }
  return instance;
}
