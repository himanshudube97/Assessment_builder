/**
 * User Repository Implementation
 * Concrete implementation using Drizzle ORM
 */

import { eq } from 'drizzle-orm';
import { getDatabase } from '../client';
import { users } from '../schema';
import type { IUserRepository } from '@/domain/repositories/user.repository';
import type { User, CreateUserInput, UpdateUserInput } from '@/domain/entities/user';

/**
 * Map database record to domain entity
 */
function mapToDomain(record: typeof users.$inferSelect): User {
  return {
    id: record.id,
    email: record.email,
    name: record.name,
    avatarUrl: record.avatarUrl,
    plan: record.plan,
    planExpiresAt: record.planExpiresAt,
    responseCountThisMonth: record.responseCountThisMonth,
    responseCountResetAt: record.responseCountResetAt,
    stripeCustomerId: record.stripeCustomerId,
    googleSheetsToken: record.googleSheetsToken,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class UserRepository implements IUserRepository {
  private db = getDatabase();

  async findById(id: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.id, id))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);

    return result[0] ? mapToDomain(result[0]) : null;
  }

  async create(input: CreateUserInput): Promise<User> {
    const result = await this.db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        name: input.name,
        avatarUrl: input.avatarUrl ?? null,
        responseCountResetAt: new Date(),
      })
      .returning();

    return mapToDomain(result[0]);
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const updateData: Partial<typeof users.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (input.name !== undefined) updateData.name = input.name;
    if (input.avatarUrl !== undefined) updateData.avatarUrl = input.avatarUrl;
    if (input.plan !== undefined) updateData.plan = input.plan;
    if (input.planExpiresAt !== undefined)
      updateData.planExpiresAt = input.planExpiresAt;
    if (input.stripeCustomerId !== undefined)
      updateData.stripeCustomerId = input.stripeCustomerId;
    if (input.googleSheetsToken !== undefined)
      updateData.googleSheetsToken = input.googleSheetsToken;

    const result = await this.db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();

    if (!result[0]) {
      throw new Error(`User not found: ${id}`);
    }

    return mapToDomain(result[0]);
  }

  async delete(id: string): Promise<void> {
    await this.db.delete(users).where(eq(users.id, id));
  }

  async incrementResponseCount(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) {
      throw new Error(`User not found: ${id}`);
    }

    // Check if we need to reset the counter (new month)
    const now = new Date();
    const resetAt = new Date(user.responseCountResetAt);
    const isNewMonth =
      now.getMonth() !== resetAt.getMonth() ||
      now.getFullYear() !== resetAt.getFullYear();

    if (isNewMonth) {
      await this.db
        .update(users)
        .set({
          responseCountThisMonth: 1,
          responseCountResetAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, id));
    } else {
      await this.db
        .update(users)
        .set({
          responseCountThisMonth: user.responseCountThisMonth + 1,
          updatedAt: now,
        })
        .where(eq(users.id, id));
    }
  }

  async resetResponseCount(id: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        responseCountThisMonth: 0,
        responseCountResetAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateGoogleSheetsToken(id: string, token: string | null): Promise<void> {
    await this.db
      .update(users)
      .set({
        googleSheetsToken: token,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateStripeCustomerId(id: string, customerId: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        stripeCustomerId: customerId,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }
}

// Singleton instance
let instance: UserRepository | null = null;

export function getUserRepository(): IUserRepository {
  if (!instance) {
    instance = new UserRepository();
  }
  return instance;
}
