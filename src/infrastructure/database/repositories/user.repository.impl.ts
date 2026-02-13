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
    googleId: record.googleId,
    lastActiveOrgId: record.lastActiveOrgId,
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

  async findByGoogleId(googleId: string): Promise<User | null> {
    const result = await this.db
      .select()
      .from(users)
      .where(eq(users.googleId, googleId))
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
        googleId: input.googleId ?? null,
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
    if (input.googleId !== undefined) updateData.googleId = input.googleId;
    if (input.lastActiveOrgId !== undefined) updateData.lastActiveOrgId = input.lastActiveOrgId;
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

  async updateGoogleSheetsToken(id: string, token: string | null): Promise<void> {
    await this.db
      .update(users)
      .set({
        googleSheetsToken: token,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id));
  }

  async updateLastActiveOrg(id: string, orgId: string): Promise<void> {
    await this.db
      .update(users)
      .set({
        lastActiveOrgId: orgId,
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
