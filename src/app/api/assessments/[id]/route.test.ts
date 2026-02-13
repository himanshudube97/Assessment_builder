import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PUT, DELETE } from './route';
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
  update: vi.fn(),
  delete: vi.fn(),
};

const mockAssessment = {
  id: 'a-1',
  organizationId: 'org-1',
  title: 'Test Assessment',
  status: 'draft',
  nodes: [],
  edges: [],
  settings: {},
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(requireAuth).mockResolvedValue(mockUser);
  vi.mocked(getAssessmentRepository).mockReturnValue(mockRepo as never);
  vi.clearAllMocks();
});

describe('GET /api/assessments/:id', () => {
  it('returns assessment when found and belongs to user org', async () => {
    mockRepo.findById.mockResolvedValue(mockAssessment);
    const request = new NextRequest('http://localhost/api/assessments/a-1');

    const response = await GET(request, makeParams('a-1'));
    const data = await response.json();

    expect(data.id).toBe('a-1');
  });

  it('returns 404 when assessment not found', async () => {
    mockRepo.findById.mockResolvedValue(null);
    const request = new NextRequest('http://localhost/api/assessments/missing');

    const response = await GET(request, makeParams('missing'));
    expect(response.status).toBe(404);
  });

  it('returns 404 when assessment belongs to different org', async () => {
    mockRepo.findById.mockResolvedValue({ ...mockAssessment, organizationId: 'other-org' });
    const request = new NextRequest('http://localhost/api/assessments/a-1');

    const response = await GET(request, makeParams('a-1'));
    expect(response.status).toBe(404);
  });
});

describe('PUT /api/assessments/:id', () => {
  it('updates title and description', async () => {
    mockRepo.findById.mockResolvedValue(mockAssessment);
    mockRepo.update.mockResolvedValue({ ...mockAssessment, title: 'Updated' });

    const request = new NextRequest('http://localhost/api/assessments/a-1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Updated', description: 'New desc' }),
    });

    const response = await PUT(request, makeParams('a-1'));
    expect(response.status).toBe(200);
    expect(mockRepo.update).toHaveBeenCalledWith('a-1', expect.objectContaining({ title: 'Updated' }));
  });

  it('updates nodes and edges when status is draft', async () => {
    mockRepo.findById.mockResolvedValue(mockAssessment);
    mockRepo.update.mockResolvedValue(mockAssessment);

    const newNodes = [{ id: 'n-1', type: 'start' }];
    const request = new NextRequest('http://localhost/api/assessments/a-1', {
      method: 'PUT',
      body: JSON.stringify({ nodes: newNodes, edges: [] }),
    });

    await PUT(request, makeParams('a-1'));
    expect(mockRepo.update).toHaveBeenCalledWith('a-1', expect.objectContaining({ nodes: newNodes }));
  });

  it('does NOT update nodes/edges when status is published (flow locked)', async () => {
    mockRepo.findById.mockResolvedValue({ ...mockAssessment, status: 'published' });
    mockRepo.update.mockResolvedValue(mockAssessment);

    const request = new NextRequest('http://localhost/api/assessments/a-1', {
      method: 'PUT',
      body: JSON.stringify({ title: 'Title Change', nodes: [{ id: 'hack' }], edges: [] }),
    });

    await PUT(request, makeParams('a-1'));
    // nodes and edges should NOT be in the update call
    const updateCall = mockRepo.update.mock.calls[0][1];
    expect(updateCall.nodes).toBeUndefined();
    expect(updateCall.edges).toBeUndefined();
    expect(updateCall.title).toBe('Title Change');
  });

  it('updates settings even when published', async () => {
    mockRepo.findById.mockResolvedValue({ ...mockAssessment, status: 'published' });
    mockRepo.update.mockResolvedValue(mockAssessment);

    const request = new NextRequest('http://localhost/api/assessments/a-1', {
      method: 'PUT',
      body: JSON.stringify({ settings: { primaryColor: '#FF0000' } }),
    });

    await PUT(request, makeParams('a-1'));
    expect(mockRepo.update).toHaveBeenCalledWith('a-1', expect.objectContaining({
      settings: { primaryColor: '#FF0000' },
    }));
  });

  it('returns 404 for non-existent assessment', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments/missing', {
      method: 'PUT',
      body: JSON.stringify({ title: 'T' }),
    });

    const response = await PUT(request, makeParams('missing'));
    expect(response.status).toBe(404);
  });
});

describe('DELETE /api/assessments/:id', () => {
  it('deletes assessment and returns success', async () => {
    mockRepo.findById.mockResolvedValue(mockAssessment);
    mockRepo.delete.mockResolvedValue(undefined);

    const request = new NextRequest('http://localhost/api/assessments/a-1', { method: 'DELETE' });
    const response = await DELETE(request, makeParams('a-1'));
    const data = await response.json();

    expect(data.success).toBe(true);
    expect(mockRepo.delete).toHaveBeenCalledWith('a-1');
  });

  it('returns 404 for non-existent or wrong-org assessment', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments/missing', { method: 'DELETE' });
    const response = await DELETE(request, makeParams('missing'));
    expect(response.status).toBe(404);
  });
});
