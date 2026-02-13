import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/database/repositories', () => ({
  getAssessmentRepository: vi.fn(),
}));

vi.mock('@/domain/entities/flow', () => ({
  validateFlow: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: { hash: vi.fn().mockResolvedValue('hashed-pw') },
}));

import { getAssessmentRepository } from '@/infrastructure/database/repositories';
import { validateFlow } from '@/domain/entities/flow';

const mockRepo = {
  findById: vi.fn(),
  update: vi.fn(),
  publish: vi.fn(),
};

const draftAssessment = {
  id: 'a-1',
  status: 'draft',
  nodes: [
    { id: 'start-node', type: 'start', position: { x: 0, y: 0 }, data: { title: 'W', description: 'D', buttonText: 'S' } },
    { id: 'end-node', type: 'end', position: { x: 0, y: 200 }, data: { title: 'T', description: 'D', showScore: false, redirectUrl: null } },
  ],
  edges: [{ id: 'e-1', source: 'start-node', target: 'end-node', sourceHandle: null, condition: null }],
  settings: {},
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(getAssessmentRepository).mockReturnValue(mockRepo as never);
  vi.clearAllMocks();
});

describe('POST /api/assessments/:id/publish', () => {
  it('publishes a valid draft assessment', async () => {
    mockRepo.findById.mockResolvedValue(draftAssessment);
    vi.mocked(validateFlow).mockReturnValue([]); // no errors
    mockRepo.publish.mockResolvedValue({ ...draftAssessment, status: 'published' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/publish', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request, makeParams('a-1'));
    expect(response.status).toBe(200);
    expect(mockRepo.publish).toHaveBeenCalledWith('a-1');
  });

  it('returns 404 for non-existent assessment', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments/missing/publish', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request, makeParams('missing'));
    expect(response.status).toBe(404);
  });

  it('returns 400 when flow validation has blocking errors', async () => {
    mockRepo.findById.mockResolvedValue(draftAssessment);
    vi.mocked(validateFlow).mockReturnValue([
      { type: 'error', message: 'No start node' },
    ]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/publish', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request, makeParams('a-1'));
    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.validationErrors).toBeDefined();
  });

  it('allows publishing with only warnings (no blocking errors)', async () => {
    mockRepo.findById.mockResolvedValue(draftAssessment);
    vi.mocked(validateFlow).mockReturnValue([
      { type: 'warning', nodeId: 'orphan', message: 'Orphan node' },
    ]);
    mockRepo.publish.mockResolvedValue({ ...draftAssessment, status: 'published' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/publish', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(request, makeParams('a-1'));
    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.validationWarnings).toHaveLength(1);
  });

  it('updates settings when provided (closeAt, maxResponses, password)', async () => {
    mockRepo.findById.mockResolvedValue(draftAssessment);
    vi.mocked(validateFlow).mockReturnValue([]);
    mockRepo.update.mockResolvedValue(draftAssessment);
    mockRepo.publish.mockResolvedValue({ ...draftAssessment, status: 'published' });

    const request = new NextRequest('http://localhost/api/assessments/a-1/publish', {
      method: 'POST',
      body: JSON.stringify({ maxResponses: 50, password: 'secret', inviteOnly: true }),
    });

    await POST(request, makeParams('a-1'));
    expect(mockRepo.update).toHaveBeenCalledWith('a-1', expect.objectContaining({
      settings: expect.objectContaining({
        maxResponses: 50,
        password: 'hashed-pw',
        inviteOnly: true,
      }),
    }));
  });
});
