/**
 * Organization Domain Entity
 * Core business object for multitenancy
 */

export type OrganizationPlan = 'free' | 'pro' | 'agency';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: OrganizationPlan;
  planExpiresAt: Date | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  responseCountThisMonth: number;
  responseCountResetAt: Date;
  settings: OrganizationSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationSettings {
  branding?: {
    logoUrl?: string;
    primaryColor?: string;
    customDomain?: string;
  };
  notifications?: {
    emailOnResponse?: boolean;
    slackWebhookUrl?: string;
  };
}

export interface CreateOrganizationInput {
  name: string;
  slug?: string;
  plan?: OrganizationPlan;
}

export interface UpdateOrganizationInput {
  name?: string;
  slug?: string;
  plan?: OrganizationPlan;
  planExpiresAt?: Date | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  settings?: OrganizationSettings;
}

/**
 * Organization plan limits (same as user plan limits, but per-org)
 */
export const ORG_PLAN_LIMITS = {
  free: {
    maxAssessments: 3,
    maxResponsesPerMonth: 50,
    maxMembers: 1,
    canRemoveWatermark: false,
    canCustomizeBranding: false,
    canUseCustomDomain: false,
  },
  pro: {
    maxAssessments: Infinity,
    maxResponsesPerMonth: 1000,
    maxMembers: 5,
    canRemoveWatermark: true,
    canCustomizeBranding: true,
    canUseCustomDomain: false,
  },
  agency: {
    maxAssessments: Infinity,
    maxResponsesPerMonth: 10000,
    maxMembers: Infinity,
    canRemoveWatermark: true,
    canCustomizeBranding: true,
    canUseCustomDomain: true,
  },
} as const;

export function getOrgPlanLimits(plan: OrganizationPlan) {
  return ORG_PLAN_LIMITS[plan];
}

export function canOrgCreateAssessment(org: Organization, currentCount: number): boolean {
  const limits = getOrgPlanLimits(org.plan);
  return currentCount < limits.maxAssessments;
}

export function canOrgCollectResponse(org: Organization): boolean {
  const limits = getOrgPlanLimits(org.plan);
  return org.responseCountThisMonth < limits.maxResponsesPerMonth;
}

export function canOrgAddMember(org: Organization, currentMemberCount: number): boolean {
  const limits = getOrgPlanLimits(org.plan);
  return currentMemberCount < limits.maxMembers;
}

/**
 * Generate a URL-safe slug from organization name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}
