import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/database/repositories', () => ({
  getAssessmentRepository: vi.fn(),
  getResponseRepository: vi.fn(),
}));

import { getAssessmentRepository, getResponseRepository } from '@/infrastructure/database/repositories';

const mockAssessmentRepo = {
  findById: vi.fn(),
};

const mockResponseRepo = {
  countByAssessmentId: vi.fn(),
  getAnswerDistribution: vi.fn(),
  getStats: vi.fn(),
  getResponseTimeline: vi.fn(),
  getCompletionTimeStats: vi.fn(),
  getScoreDistribution: vi.fn(),
  getResponsesForAnalytics: vi.fn(),
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const assessment = {
  id: 'a-1',
  nodes: [
    { id: 'start', type: 'start', position: { x: 0, y: 0 }, data: { title: 'W', description: '', buttonText: 'S' } },
    { id: 'q-1', type: 'question', position: { x: 0, y: 100 }, data: { questionText: 'Rate us', questionType: 'rating', required: false } },
    { id: 'q-nps', type: 'question', position: { x: 0, y: 200 }, data: { questionText: 'NPS', questionType: 'nps', required: false } },
    { id: 'end', type: 'end', position: { x: 0, y: 300 }, data: { title: 'T', description: '', showScore: false, redirectUrl: null } },
  ],
  edges: [],
};

beforeEach(() => {
  vi.mocked(getAssessmentRepository).mockReturnValue(mockAssessmentRepo as never);
  vi.mocked(getResponseRepository).mockReturnValue(mockResponseRepo as never);
  vi.clearAllMocks();
});

describe('GET /api/assessments/:id/analytics', () => {
  it('returns 404 for non-existent assessment', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/assessments/missing/analytics');
    const response = await GET(request, makeParams('missing'));

    expect(response.status).toBe(404);
  });

  it('returns analytics data for an existing assessment', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(assessment);
    mockResponseRepo.countByAssessmentId.mockResolvedValue(10);
    mockResponseRepo.getAnswerDistribution.mockResolvedValue({ 'q-1': { '5': 3, '4': 7 } });
    mockResponseRepo.getStats.mockResolvedValue({ averageScore: 8.5, completionRate: 0.9 });
    mockResponseRepo.getResponseTimeline.mockResolvedValue([]);
    mockResponseRepo.getCompletionTimeStats.mockResolvedValue({ average: 120, median: 100 });
    mockResponseRepo.getScoreDistribution.mockResolvedValue([]);
    mockResponseRepo.getResponsesForAnalytics.mockResolvedValue([
      {
        answers: [
          { nodeId: 'q-nps', questionText: 'NPS', value: 9 },
        ],
        metadata: { userAgent: 'Mozilla/5.0 (iPhone)', referrer: 'https://www.google.com/search' },
      },
      {
        answers: [
          { nodeId: 'q-nps', questionText: 'NPS', value: 3 },
        ],
        metadata: { userAgent: 'Mozilla/5.0 (Windows NT 10.0)', referrer: null },
      },
    ]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/analytics');
    const response = await GET(request, makeParams('a-1'));
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalResponses).toBe(10);
    expect(data.averageScore).toBe(8.5);
    expect(data.completionRate).toBe(0.9);
    expect(data.questionStats).toHaveLength(2); // q-1 and q-nps (not start/end)
  });

  it('computes NPS stats correctly', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(assessment);
    mockResponseRepo.countByAssessmentId.mockResolvedValue(4);
    mockResponseRepo.getAnswerDistribution.mockResolvedValue({});
    mockResponseRepo.getStats.mockResolvedValue({ averageScore: null, completionRate: 1 });
    mockResponseRepo.getResponseTimeline.mockResolvedValue([]);
    mockResponseRepo.getCompletionTimeStats.mockResolvedValue({});
    mockResponseRepo.getScoreDistribution.mockResolvedValue([]);
    mockResponseRepo.getResponsesForAnalytics.mockResolvedValue([
      { answers: [{ nodeId: 'q-nps', questionText: 'NPS', value: 10 }], metadata: { userAgent: '', referrer: null } },
      { answers: [{ nodeId: 'q-nps', questionText: 'NPS', value: 9 }], metadata: { userAgent: '', referrer: null } },
      { answers: [{ nodeId: 'q-nps', questionText: 'NPS', value: 7 }], metadata: { userAgent: '', referrer: null } },
      { answers: [{ nodeId: 'q-nps', questionText: 'NPS', value: 3 }], metadata: { userAgent: '', referrer: null } },
    ]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/analytics');
    const response = await GET(request, makeParams('a-1'));
    const data = await response.json();

    // 2 promoters (9,10), 1 passive (7), 1 detractor (3)
    // NPS = ((2-1)/4)*100 = 25
    expect(data.npsStats).not.toBeNull();
    expect(data.npsStats.promoters).toBe(2);
    expect(data.npsStats.passives).toBe(1);
    expect(data.npsStats.detractors).toBe(1);
    expect(data.npsStats.score).toBe(25);
    expect(data.npsStats.total).toBe(4);
  });

  it('computes device breakdown from user agents', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(assessment);
    mockResponseRepo.countByAssessmentId.mockResolvedValue(3);
    mockResponseRepo.getAnswerDistribution.mockResolvedValue({});
    mockResponseRepo.getStats.mockResolvedValue({ averageScore: null, completionRate: 1 });
    mockResponseRepo.getResponseTimeline.mockResolvedValue([]);
    mockResponseRepo.getCompletionTimeStats.mockResolvedValue({});
    mockResponseRepo.getScoreDistribution.mockResolvedValue([]);
    mockResponseRepo.getResponsesForAnalytics.mockResolvedValue([
      { answers: [], metadata: { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS)', referrer: null } },
      { answers: [], metadata: { userAgent: 'Mozilla/5.0 (iPad; CPU OS)', referrer: null } },
      { answers: [], metadata: { userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', referrer: null } },
    ]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/analytics');
    const response = await GET(request, makeParams('a-1'));
    const data = await response.json();

    expect(data.deviceBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ device: 'Mobile', count: 1 }),
        expect.objectContaining({ device: 'Tablet', count: 1 }),
        expect.objectContaining({ device: 'Desktop', count: 1 }),
      ])
    );
  });

  it('computes source breakdown from referrers', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(assessment);
    mockResponseRepo.countByAssessmentId.mockResolvedValue(3);
    mockResponseRepo.getAnswerDistribution.mockResolvedValue({});
    mockResponseRepo.getStats.mockResolvedValue({ averageScore: null, completionRate: 1 });
    mockResponseRepo.getResponseTimeline.mockResolvedValue([]);
    mockResponseRepo.getCompletionTimeStats.mockResolvedValue({});
    mockResponseRepo.getScoreDistribution.mockResolvedValue([]);
    mockResponseRepo.getResponsesForAnalytics.mockResolvedValue([
      { answers: [], metadata: { userAgent: '', referrer: 'https://www.google.com/search?q=test' } },
      { answers: [], metadata: { userAgent: '', referrer: 'https://www.facebook.com/post/123' } },
      { answers: [], metadata: { userAgent: '', referrer: null } },
    ]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/analytics');
    const response = await GET(request, makeParams('a-1'));
    const data = await response.json();

    expect(data.sourceBreakdown).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ source: 'Google', count: 1 }),
        expect.objectContaining({ source: 'Facebook', count: 1 }),
        expect.objectContaining({ source: 'Direct', count: 1 }),
      ])
    );
  });

  it('returns null npsStats when no NPS questions exist', async () => {
    const noNpsAssessment = {
      ...assessment,
      nodes: assessment.nodes.filter((n) => n.id !== 'q-nps'),
    };
    mockAssessmentRepo.findById.mockResolvedValue(noNpsAssessment);
    mockResponseRepo.countByAssessmentId.mockResolvedValue(0);
    mockResponseRepo.getAnswerDistribution.mockResolvedValue({});
    mockResponseRepo.getStats.mockResolvedValue({ averageScore: null, completionRate: 0 });
    mockResponseRepo.getResponseTimeline.mockResolvedValue([]);
    mockResponseRepo.getCompletionTimeStats.mockResolvedValue({});
    mockResponseRepo.getScoreDistribution.mockResolvedValue([]);
    mockResponseRepo.getResponsesForAnalytics.mockResolvedValue([]);

    const request = new NextRequest('http://localhost/api/assessments/a-1/analytics');
    const response = await GET(request, makeParams('a-1'));
    const data = await response.json();

    expect(data.npsStats).toBeNull();
  });
});
