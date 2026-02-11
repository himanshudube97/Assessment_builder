/**
 * User Domain Entity
 * Core business object - independent of database/framework
 */

export type UserPlan = 'free' | 'pro' | 'agency';

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  plan: UserPlan;
  planExpiresAt: Date | null;
  responseCountThisMonth: number;
  responseCountResetAt: Date;
  stripeCustomerId: string | null;
  googleSheetsToken: string | null; // Encrypted
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserInput {
  email: string;
  name: string;
  avatarUrl?: string | null;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string | null;
  plan?: UserPlan;
  planExpiresAt?: Date | null;
  stripeCustomerId?: string | null;
  googleSheetsToken?: string | null;
}

/**
 * User plan limits
 */
export const PLAN_LIMITS = {
  free: {
    maxAssessments: 3,
    maxResponsesPerMonth: 50,
    canRemoveWatermark: false,
    canCustomizeBranding: false,
    canUseCustomDomain: false,
  },
  pro: {
    maxAssessments: Infinity,
    maxResponsesPerMonth: 1000,
    canRemoveWatermark: true,
    canCustomizeBranding: true,
    canUseCustomDomain: false,
  },
  agency: {
    maxAssessments: Infinity,
    maxResponsesPerMonth: 10000,
    canRemoveWatermark: true,
    canCustomizeBranding: true,
    canUseCustomDomain: true,
  },
} as const;

export function getUserPlanLimits(plan: UserPlan) {
  return PLAN_LIMITS[plan];
}

export function canUserCreateAssessment(user: User, currentCount: number): boolean {
  const limits = getUserPlanLimits(user.plan);
  return currentCount < limits.maxAssessments;
}

export function canUserCollectResponse(user: User): boolean {
  const limits = getUserPlanLimits(user.plan);
  return user.responseCountThisMonth < limits.maxResponsesPerMonth;
}
