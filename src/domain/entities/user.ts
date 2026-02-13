/**
 * User Domain Entity
 * Core business object - independent of database/framework
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  googleId: string | null;
  lastActiveOrgId: string | null;
  googleSheetsToken: string | null; // Encrypted
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  avatarUrl?: string | null;
  googleId?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string | null;
  googleId?: string | null;
  lastActiveOrgId?: string | null;
  googleSheetsToken?: string | null;
}
