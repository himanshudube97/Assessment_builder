/**
 * Assessment Invite Domain Entity
 * Represents an invitation to take a specific assessment
 */

export interface AssessmentInvite {
  id: string;
  assessmentId: string;
  email: string | null;
  token: string;
  maxUses: number;
  usedCount: number;
  expiresAt: Date | null;
  createdAt: Date;
}

export interface CreateAssessmentInviteInput {
  assessmentId: string;
  email?: string | null;
  maxUses?: number;
  expiresInDays?: number | null;
}

/**
 * Check if an assessment invite is valid (not exhausted and not expired)
 */
export function isAssessmentInviteValid(invite: AssessmentInvite): boolean {
  if (invite.usedCount >= invite.maxUses) {
    return false;
  }
  if (invite.expiresAt && new Date() > invite.expiresAt) {
    return false;
  }
  return true;
}
