import { describe, it, expect } from 'vitest';
import {
  canOrgCreateAssessment,
  canOrgCollectResponse,
  canOrgAddMember,
  generateSlug,
  getOrgPlanLimits,
  ORG_PLAN_LIMITS,
} from './organization';
import { makeOrg } from '@/test/fixtures';

describe('canOrgCreateAssessment', () => {
  it('returns true when currentCount < limit for free plan', () => {
    const org = makeOrg({ plan: 'free' });
    expect(canOrgCreateAssessment(org, 2)).toBe(true);
  });

  it('returns false when currentCount >= limit for free plan (limit 3)', () => {
    const org = makeOrg({ plan: 'free' });
    expect(canOrgCreateAssessment(org, 3)).toBe(false);
    expect(canOrgCreateAssessment(org, 5)).toBe(false);
  });

  it('returns true for pro plan (Infinity limit)', () => {
    const org = makeOrg({ plan: 'pro' });
    expect(canOrgCreateAssessment(org, 999)).toBe(true);
  });
});

describe('canOrgCollectResponse', () => {
  it('returns true when under monthly limit', () => {
    const org = makeOrg({ plan: 'free', responseCountThisMonth: 10 });
    expect(canOrgCollectResponse(org)).toBe(true);
  });

  it('returns false when at or over monthly limit', () => {
    const org = makeOrg({ plan: 'free', responseCountThisMonth: 50 });
    expect(canOrgCollectResponse(org)).toBe(false);
  });
});

describe('canOrgAddMember', () => {
  it('returns true when currentMemberCount < limit', () => {
    const org = makeOrg({ plan: 'pro' });
    expect(canOrgAddMember(org, 3)).toBe(true);
  });

  it('returns false when at limit for free plan (limit 1)', () => {
    const org = makeOrg({ plan: 'free' });
    expect(canOrgAddMember(org, 1)).toBe(false);
  });

  it('returns true for agency plan with many members (Infinity limit)', () => {
    const org = makeOrg({ plan: 'agency' });
    expect(canOrgAddMember(org, 100)).toBe(true);
  });
});

describe('generateSlug', () => {
  it('converts to lowercase', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('replaces special characters with hyphens', () => {
    expect(generateSlug('Test & Co! #1')).toBe('test-co-1');
  });

  it('removes leading/trailing hyphens', () => {
    expect(generateSlug('---Hello---')).toBe('hello');
  });

  it('truncates to 50 characters', () => {
    const long = 'a'.repeat(60);
    expect(generateSlug(long).length).toBeLessThanOrEqual(50);
  });

  it('handles empty string', () => {
    expect(generateSlug('')).toBe('');
  });

  it('collapses multiple hyphens', () => {
    expect(generateSlug('hello   world')).toBe('hello-world');
  });
});

describe('getOrgPlanLimits', () => {
  it('returns correct limits for "free" plan', () => {
    const limits = getOrgPlanLimits('free');
    expect(limits.maxAssessments).toBe(3);
    expect(limits.maxResponsesPerMonth).toBe(50);
    expect(limits.maxMembers).toBe(1);
  });

  it('returns correct limits for "pro" plan', () => {
    const limits = getOrgPlanLimits('pro');
    expect(limits.maxAssessments).toBe(Infinity);
    expect(limits.maxResponsesPerMonth).toBe(1000);
    expect(limits.maxMembers).toBe(5);
  });

  it('returns correct limits for "agency" plan', () => {
    const limits = getOrgPlanLimits('agency');
    expect(limits.maxAssessments).toBe(Infinity);
    expect(limits.maxResponsesPerMonth).toBe(10000);
    expect(limits.maxMembers).toBe(Infinity);
  });
});
