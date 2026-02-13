import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/database/repositories', () => ({
  getAssessmentRepository: vi.fn(),
  getResponseRepository: vi.fn(),
  getOrganizationRepository: vi.fn(),
  getAssessmentInviteRepository: vi.fn(),
}));

vi.mock('@/domain/entities/organization', () => ({
  canOrgCollectResponse: vi.fn(),
}));

vi.mock('@/domain/entities/assessmentInvite', () => ({
  isAssessmentInviteValid: vi.fn(),
}));

import {
  getAssessmentRepository,
  getResponseRepository,
  getOrganizationRepository,
  getAssessmentInviteRepository,
} from '@/infrastructure/database/repositories';
import { canOrgCollectResponse } from '@/domain/entities/organization';
import { isAssessmentInviteValid } from '@/domain/entities/assessmentInvite';

const mockAssessmentRepo = {
  findById: vi.fn(),
  incrementResponseCount: vi.fn(),
};

const mockResponseRepo = {
  create: vi.fn(),
};

const mockOrgRepo = {
  findById: vi.fn(),
  incrementResponseCount: vi.fn(),
};

const mockInviteRepo = {
  findByToken: vi.fn(),
  incrementUsedCount: vi.fn(),
};

const publishedAssessment = {
  id: 'a-1',
  organizationId: 'org-1',
  status: 'published',
  responseCount: 5,
  settings: {
    openAt: null,
    closeAt: null,
    maxResponses: null,
    inviteOnly: false,
  },
  nodes: [],
  edges: [],
};

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(getAssessmentRepository).mockReturnValue(mockAssessmentRepo as never);
  vi.mocked(getResponseRepository).mockReturnValue(mockResponseRepo as never);
  vi.mocked(getOrganizationRepository).mockReturnValue(mockOrgRepo as never);
  vi.mocked(getAssessmentInviteRepository).mockReturnValue(mockInviteRepo as never);
  vi.mocked(canOrgCollectResponse).mockReturnValue(true);
  mockOrgRepo.findById.mockResolvedValue({ id: 'org-1', plan: 'free', responseCountThisMonth: 0 });
  vi.clearAllMocks();
});

function makePostRequest(body: object) {
  return new NextRequest('http://localhost/api/assessments/a-1/responses', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

describe('POST /api/assessments/:id/responses', () => {
  it('creates response for published assessment', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(publishedAssessment);
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1' });
    vi.mocked(canOrgCollectResponse).mockReturnValue(true);
    mockResponseRepo.create.mockResolvedValue({ id: 'resp-1' });

    const request = makePostRequest({ answers: [{ nodeId: 'q-1', questionText: 'Q1', value: 'A' }] });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(201);
    expect(mockResponseRepo.create).toHaveBeenCalled();
    expect(mockAssessmentRepo.incrementResponseCount).toHaveBeenCalledWith('a-1');
  });

  it('returns 404 for non-existent assessment', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(null);

    const request = makePostRequest({ answers: [] });
    const response = await POST(request, makeParams('missing'));

    expect(response.status).toBe(404);
  });

  it('returns 400 when assessment is not published', async () => {
    mockAssessmentRepo.findById.mockResolvedValue({ ...publishedAssessment, status: 'draft' });

    const request = makePostRequest({ answers: [] });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('not accepting');
  });

  it('returns 400 when before openAt', async () => {
    const future = new Date(Date.now() + 86_400_000).toISOString();
    mockAssessmentRepo.findById.mockResolvedValue({
      ...publishedAssessment,
      settings: { ...publishedAssessment.settings, openAt: future },
    });

    const request = makePostRequest({ answers: [] });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('not opened');
  });

  it('returns 400 when after closeAt', async () => {
    const past = new Date(Date.now() - 86_400_000).toISOString();
    mockAssessmentRepo.findById.mockResolvedValue({
      ...publishedAssessment,
      settings: { ...publishedAssessment.settings, closeAt: past },
    });

    const request = makePostRequest({ answers: [] });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('closed');
  });

  it('returns 400 when maxResponses reached', async () => {
    mockAssessmentRepo.findById.mockResolvedValue({
      ...publishedAssessment,
      responseCount: 100,
      settings: { ...publishedAssessment.settings, maxResponses: 100 },
    });

    const request = makePostRequest({ answers: [] });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('maximum');
  });

  it('returns 400 when org response limit reached', async () => {
    mockAssessmentRepo.findById.mockResolvedValue(publishedAssessment);
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1', responseCountThisMonth: 50 });
    vi.mocked(canOrgCollectResponse).mockReturnValue(false);

    const request = makePostRequest({ answers: [] });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('monthly response limit');
  });

  it('returns 403 when inviteOnly and no invite token', async () => {
    mockAssessmentRepo.findById.mockResolvedValue({
      ...publishedAssessment,
      settings: { ...publishedAssessment.settings, inviteOnly: true },
    });
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1' });
    vi.mocked(canOrgCollectResponse).mockReturnValue(true);

    const request = makePostRequest({ answers: [] }); // no inviteToken
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('Invite token required');
  });

  it('returns 403 when invite token is invalid', async () => {
    mockAssessmentRepo.findById.mockResolvedValue({
      ...publishedAssessment,
      settings: { ...publishedAssessment.settings, inviteOnly: true },
    });
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1' });
    vi.mocked(canOrgCollectResponse).mockReturnValue(true);
    mockInviteRepo.findByToken.mockResolvedValue(null);

    const request = makePostRequest({ answers: [], inviteToken: 'bad-token' });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('Invalid invite');
  });

  it('returns 403 when invite is expired or exhausted', async () => {
    mockAssessmentRepo.findById.mockResolvedValue({
      ...publishedAssessment,
      settings: { ...publishedAssessment.settings, inviteOnly: true },
    });
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1' });
    vi.mocked(canOrgCollectResponse).mockReturnValue(true);
    mockInviteRepo.findByToken.mockResolvedValue({
      id: 'inv-1',
      assessmentId: 'a-1',
      token: 'valid-token',
      maxUses: 1,
      usedCount: 1,
    });
    vi.mocked(isAssessmentInviteValid).mockReturnValue(false);

    const request = makePostRequest({ answers: [], inviteToken: 'valid-token' });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('expired');
  });

  it('increments invite usedCount for valid invite', async () => {
    mockAssessmentRepo.findById.mockResolvedValue({
      ...publishedAssessment,
      settings: { ...publishedAssessment.settings, inviteOnly: true },
    });
    mockOrgRepo.findById.mockResolvedValue({ id: 'org-1' });
    vi.mocked(canOrgCollectResponse).mockReturnValue(true);
    mockInviteRepo.findByToken.mockResolvedValue({
      id: 'inv-1',
      assessmentId: 'a-1',
      token: 'valid-token',
      maxUses: 10,
      usedCount: 0,
    });
    vi.mocked(isAssessmentInviteValid).mockReturnValue(true);
    mockResponseRepo.create.mockResolvedValue({ id: 'resp-1' });

    const request = makePostRequest({ answers: [], inviteToken: 'valid-token' });
    await POST(request, makeParams('a-1'));

    expect(mockInviteRepo.incrementUsedCount).toHaveBeenCalledWith('inv-1');
  });
});
