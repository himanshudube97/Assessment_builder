import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/infrastructure/database/repositories', () => ({
  getAssessmentRepository: vi.fn(),
}));

import { requireAuth } from '@/infrastructure/auth';
import { getAssessmentRepository } from '@/infrastructure/database/repositories';

const mockUser = { id: 'user-1', email: 'test@test.com', name: 'Test', currentOrgId: 'org-1', currentOrgRole: 'owner' as const, avatarUrl: null };

const mockRepo = {
  findById: vi.fn(),
  unpublish: vi.fn(),
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(requireAuth).mockResolvedValue(mockUser);
  vi.mocked(getAssessmentRepository).mockReturnValue(mockRepo as never);
  vi.clearAllMocks();
});

describe('POST /api/assessments/:id/unpublish', () => {
  it('unpublishes a published assessment', async () => {
    const assessment = { id: 'a-1', organizationId: 'org-1', status: 'published' };
    mockRepo.findById.mockResolvedValue(assessment);
    mockRepo.unpublish.mockResolvedValue({ ...assessment, status: 'draft' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/unpublish', { method: 'POST' });
    const response = await POST(request, makeParams('a-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('draft');
    expect(mockRepo.unpublish).toHaveBeenCalledWith('a-1');
  });

  it('unpublishes a closed assessment', async () => {
    const assessment = { id: 'a-1', organizationId: 'org-1', status: 'closed' };
    mockRepo.findById.mockResolvedValue(assessment);
    mockRepo.unpublish.mockResolvedValue({ ...assessment, status: 'draft' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/unpublish', { method: 'POST' });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(200);
  });

  it('returns 404 for non-existent assessment', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments/missing/unpublish', { method: 'POST' });
    const response = await POST(request, makeParams('missing'));

    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment belongs to different org', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'a-1', organizationId: 'other-org', status: 'published' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/unpublish', { method: 'POST' });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(404);
  });

  it('returns 400 when assessment is already a draft', async () => {
    mockRepo.findById.mockResolvedValue({ id: 'a-1', organizationId: 'org-1', status: 'draft' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/unpublish', { method: 'POST' });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('already a draft');
  });
});
