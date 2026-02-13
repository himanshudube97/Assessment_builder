import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/database/repositories', () => ({
  getAssessmentRepository: vi.fn(),
}));

import { getAssessmentRepository } from '@/infrastructure/database/repositories';

const mockRepo = {
  findById: vi.fn(),
  close: vi.fn(),
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(getAssessmentRepository).mockReturnValue(mockRepo as never);
  vi.clearAllMocks();
});

describe('POST /api/assessments/:id/close', () => {
  it('closes an existing assessment', async () => {
    const assessment = { id: 'a-1', status: 'published' };
    mockRepo.findById.mockResolvedValue(assessment);
    mockRepo.close.mockResolvedValue({ ...assessment, status: 'closed' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/close', { method: 'POST' });
    const response = await POST(request, makeParams('a-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('closed');
    expect(mockRepo.close).toHaveBeenCalledWith('a-1');
  });

  it('returns 404 for non-existent assessment', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments/missing/close', { method: 'POST' });
    const response = await POST(request, makeParams('missing'));

    expect(response.status).toBe(404);
  });

  it('returns 500 when repo throws', async () => {
    mockRepo.findById.mockRejectedValue(new Error('DB error'));

    const request = new NextRequest('http://localhost/api/assessments/a-1/close', { method: 'POST' });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(500);
  });
});
