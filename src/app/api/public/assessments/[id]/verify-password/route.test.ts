import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

vi.mock('@/infrastructure/database/repositories', () => ({
  getAssessmentRepository: vi.fn(),
}));

vi.mock('bcryptjs', () => ({
  default: { compare: vi.fn() },
}));

import { getAssessmentRepository } from '@/infrastructure/database/repositories';
import bcrypt from 'bcryptjs';

const mockRepo = { findById: vi.fn() };
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

beforeEach(() => {
  vi.mocked(getAssessmentRepository).mockReturnValue(mockRepo as never);
  vi.clearAllMocks();
});

describe('POST /api/public/assessments/:id/verify-password', () => {
  it('returns valid=true when password matches', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'a-1',
      settings: { password: '$2a$10$hashedpassword' },
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

    const request = new NextRequest('http://localhost/api/public/assessments/a-1/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'correct' }),
    });
    const response = await POST(request, makeParams('a-1'));
    const data = await response.json();

    expect(data.valid).toBe(true);
    expect(bcrypt.compare).toHaveBeenCalledWith('correct', '$2a$10$hashedpassword');
  });

  it('returns valid=false when password does not match', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'a-1',
      settings: { password: '$2a$10$hashedpassword' },
    });
    vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

    const request = new NextRequest('http://localhost/api/public/assessments/a-1/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'wrong' }),
    });
    const response = await POST(request, makeParams('a-1'));
    const data = await response.json();

    expect(data.valid).toBe(false);
  });

  it('returns 400 when no password provided', async () => {
    const request = new NextRequest('http://localhost/api/public/assessments/a-1/verify-password', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
  });

  it('returns 400 when assessment not found', async () => {
    mockRepo.findById.mockResolvedValue(null);

    const request = new NextRequest('http://localhost/api/public/assessments/a-1/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'test' }),
    });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.valid).toBe(false);
  });

  it('returns 400 when assessment has no password', async () => {
    mockRepo.findById.mockResolvedValue({
      id: 'a-1',
      settings: { password: null },
    });

    const request = new NextRequest('http://localhost/api/public/assessments/a-1/verify-password', {
      method: 'POST',
      body: JSON.stringify({ password: 'test' }),
    });
    const response = await POST(request, makeParams('a-1'));

    expect(response.status).toBe(400);
  });
});
