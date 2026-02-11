/**
 * User Repository Interface
 * Defines the contract for user data access
 * Implementation can be swapped (local Postgres, Supabase, etc.)
 */

import type { User, CreateUserInput, UpdateUserInput } from '../entities/user';

export interface IUserRepository {
  /**
   * Find a user by their ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Find a user by their email
   */
  findByEmail(email: string): Promise<User | null>;

  /**
   * Create a new user
   */
  create(input: CreateUserInput): Promise<User>;

  /**
   * Update an existing user
   */
  update(id: string, input: UpdateUserInput): Promise<User>;

  /**
   * Delete a user (and all their data)
   */
  delete(id: string): Promise<void>;

  /**
   * Increment the response count for the current month
   */
  incrementResponseCount(id: string): Promise<void>;

  /**
   * Reset response count (called monthly)
   */
  resetResponseCount(id: string): Promise<void>;

  /**
   * Update Google Sheets token
   */
  updateGoogleSheetsToken(id: string, token: string | null): Promise<void>;

  /**
   * Update Stripe customer ID
   */
  updateStripeCustomerId(id: string, customerId: string): Promise<void>;
}
