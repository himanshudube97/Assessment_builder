import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { NextRequest } from 'next/server';

// Mock dependencies
vi.mock('@/infrastructure/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/infrastructure/database/repositories', () => ({
  getAssessmentRepository: vi.fn(),
  getOrganizationRepository: vi.fn(),
}));

vi.mock('@/domain/entities/organization', () => ({
  canOrgCreateAssessment: vi.fn(),
}));

import { requireAuth } from '@/infrastructure/auth';
import { getAssessmentRepository, getOrganizationRepository } from '@/infrastructure/database/repositories';
import { canOrgCreateAssessment } from '@/domain/entities/organization';

const mockUser = { id: 'user-1', email: 'test@test.com', name: 'Test', currentOrgId: 'org-1', currentOrgRole: 'owner' as const, avatarUrl: null };

const mockAssessmentRepo = {
  findByOrganizationId: vi.fn(),
  countByOrganizationId: vi.fn(),
  create: vi.fn(),
};

const mockOrgRepo = {
  findById: vi.fn(),
};

beforeEach(() => {
  vi.mocked(requireAuth).mockResolvedValue(mockUser);
  vi.mocked(getAssessmentRepository).mockReturnValue(mockAssessmentRepo as never);
  vi.mocked(getOrganizationRepository).mockReturnValue(mockOrgRepo as never);
  vi.clearAllMocks();
});

describe('GET /api/assessments', () => {
  it('returns assessments for the authenticated user org', async () => {
    const assessments = [{ id: 'a-1', title: 'Test' }];
    mockAssessmentRepo.findByOrganizationId.mockResolvedValue(assessments);

    const response = await GET();
    const data = await response.json();

    expect(data).toEqual(assessments);
    expect(mockAssessmentRepo.findByOrganizationId).toHaveBeenCalledWith('org-1', {
      orderBy: 'updatedAt',
      orderDirection: 'desc',
    });
  });

  it('returns 401 when not authenticated', async () => {
    const authError = new Error('Authentication required');
    (authError as unknown as { statusCode: number }).statusCode = 401;
    vi.mocked(requireAuth).mockRejectedValue(authError);

    const response = await GET();
    expect(response.status).toBe(401);
  });
});

describe('POST /api/assessments', () => {
  it('creates assessment with provided title', async () => {
    const created = { id: 'a-new', title: 'My Assessment' };
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1', plan: 'free' });
    mockAssessmentRepo.countByOrganizationId.mockResolvedValue(0);
    vi.mocked(canOrgCreateAssessment).mockReturnValue(true);
    mockAssessmentRepo.create.mockResolvedValue(created);

    const request = new NextRequest('http://localhost/api/assessments', {
      method: 'POST',
      body: JSON.stringify({ title: 'My Assessment' }),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data).toEqual(created);
    expect(mockAssessmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'My Assessment', organizationId: 'org-1' })
    );
  });

  it('defaults title to "Untitled Assessment" when not provided', async () => {
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1', plan: 'free' });
    mockAssessmentRepo.countByOrganizationId.mockResolvedValue(0);
    vi.mocked(canOrgCreateAssessment).mockReturnValue(true);
    mockAssessmentRepo.create.mockResolvedValue({ id: 'a-new' });

    const request = new NextRequest('http://localhost/api/assessments', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    await POST(request);
    expect(mockAssessmentRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Untitled Assessment' })
    );
  });

  it('returns 403 when org assessment limit reached', async () => {
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1', plan: 'free' });
    mockAssessmentRepo.countByOrganizationId.mockResolvedValue(3);
    vi.mocked(canOrgCreateAssessment).mockReturnValue(false);

    const request = new NextRequest('http://localhost/api/assessments', {
      method: 'POST',
      body: JSON.stringify({ title: 'Over limit' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(403);
  });

  it('returns 404 when org not found', async () => {
    mockOrgRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments', {
      method: 'POST',
      body: JSON.stringify({ title: 'Test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(404);
  });
});
