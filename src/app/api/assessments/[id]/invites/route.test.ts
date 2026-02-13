import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/infrastructure/database/repositories', () => ({
  getAssessmentRepository: vi.fn(),
  getAssessmentInviteRepository: vi.fn(),
}));

import { requireAuth } from '@/infrastructure/auth';
import { getAssessmentRepository, getAssessmentInviteRepository } from '@/infrastructure/database/repositories';

const mockUser = { id: 'user-1', email: 'test@test.com', name: 'Test', currentOrgId: 'org-1', currentOrgRole: 'owner' as const, avatarUrl: null };

const mockAssessmentRepo = { findById: vi.fn() };
const mockInviteRepo = {
  findByAssessmentId: vi.fn(),
  createBulk: vi.fn(),
};

const assessment = { id: 'a-1', organizationId: 'org-1', status: 'published' };
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(requireAuth).mockResolvedValue(mockUser);
  vi.mocked(getAssessmentRepository).mockReturnValue(mockAssessmentRepo as never);
  vi.mocked(getAssessmentInviteRepository).mockReturnValue(mockInviteRepo as never);
  vi.clearAllMocks();
});

describe('GET /api/assessments/:id/invites', () => {
  it('returns invites for the assessment', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(assessment);
    mockInviteRepo.findByAssessmentId.mockResolvedValue([
      { id: 'inv-1', email: 'a@b.com', token: 'tok-1', maxUses: 1, usedCount: 0, expiresAt: null, createdAt: new Date().toISOString() },
    ]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/invites');
    const response = await GET(request, makeParams('a-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].email).toBe('a@b.com');
    expect(data[0].link).toContain('invite=tok-1');
  });

  it('returns 404 for non-existent assessment', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments/missing/invites');
    const response = await GET(request, makeParams('missing'));

    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment belongs to different org', async () => {
    mockAssessmentRepo.findById.mockResolvedValue({ ...assessment, organizationId: 'other-org' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/invites');
    const response = await GET(request, makeParams('a-1'));

    expect(response.status).toBe(404);
  });
});

describe('POST /api/assessments/:id/invites', () => {
  it('creates email-based invites', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(assessment);
    mockInviteRepo.createBulk.mockResolvedValue([
      { id: 'inv-1', email: 'a@b.com', token: 'tok-1', maxUses: 1, expiresAt: null },
      { id: 'inv-2', email: 'c@d.com', token: 'tok-2', maxUses: 1, expiresAt: null },
    ]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/invites', {
      method: 'POST',
      body: JSON.stringify({ emails: ['a@b.com', 'c@d.com'], maxUses: 1 }),
    });
    const response = await POST(request, makeParams('a-1'));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveLength(2);
    expect(mockInviteRepo.createBulk).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ email: 'a@b.com', assessmentId: 'a-1' }),
        expect.objectContaining({ email: 'c@d.com', assessmentId: 'a-1' }),
      ])
    );
  });

  it('creates anonymous invite links', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(assessment);
    mockInviteRepo.createBulk.mockResolvedValue([
      { id: 'inv-1', email: null, token: 'tok-1', maxUses: 5, expiresAt: null },
      { id: 'inv-2', email: null, token: 'tok-2', maxUses: 5, expiresAt: null },
    ]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/invites', {
      method: 'POST',
      body: JSON.stringify({ count: 2, maxUses: 5 }),
    });
    const response = await POST(request, makeParams('a-1'));
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toHaveLength(2);
    expect(mockInviteRepo.createBulk).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ email: null, maxUses: 5 }),
      ])
    );
  });

  it('caps invite count at 100', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(assessment);
    mockInviteRepo.createBulk.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/invites', {
      method: 'POST',
      body: JSON.stringify({ count: 500 }),
    });
    await POST(request, makeParams('a-1'));

    const calls = mockInviteRepo.createBulk.mock.calls[0][0];
    expect(calls.length).toBeLessThanOrEqual(100);
  });

  it('returns 404 for non-existent assessment', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments/a-1/invites', {
      method: 'POST',
      body: JSON.stringify({ count: 1 }),
    });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(404);
  });
});
