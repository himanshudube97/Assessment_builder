import { describe, it, expect } from 'vitest';
import { isAssessmentInviteValid } from './assessmentInvite';
import { makeInvite } from '@/test/fixtures';

describe('isAssessmentInviteValid', () => {
  it('returns true when usedCount < maxUses and no expiry', () => {
    const invite = makeInvite({ usedCount: 0, maxUses: 10, expiresAt: null });
    expect(isAssessmentInviteValid(invite)).toBe(true);
  });

  it('returns false when usedCount >= maxUses', () => {
    const invite = makeInvite({ usedCount: 10, maxUses: 10 });
    expect(isAssessmentInviteValid(invite)).toBe(false);
  });

  it('returns false when usedCount exceeds maxUses', () => {
    const invite = makeInvite({ usedCount: 15, maxUses: 10 });
    expect(isAssessmentInviteValid(invite)).toBe(false);
  });

  it('returns false when expiresAt is in the past', () => {
    const past = new Date(Date.now() - 86_400_000);
    const invite = makeInvite({ expiresAt: past });
    expect(isAssessmentInviteValid(invite)).toBe(false);
  });

  it('returns true when expiresAt is in the future', () => {
    const future = new Date(Date.now() + 86_400_000);
    const invite = makeInvite({ expiresAt: future });
    expect(isAssessmentInviteValid(invite)).toBe(true);
  });

  it('returns true when expiresAt is null (no expiry)', () => {
    const invite = makeInvite({ expiresAt: null });
    expect(isAssessmentInviteValid(invite)).toBe(true);
  });
});
