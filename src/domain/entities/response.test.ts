import { describe, it, expect } from 'vitest';
import { calculateScore, formatResponseForSheet, formatResponseForCSV } from './response';
import { makeResponse } from '@/test/fixtures';

describe('calculateScore', () => {
  it('returns { score: 0, maxScore: 0 } when no nodes have points', () => {
    const answers = [{ nodeId: 'q-1', questionText: 'Q1', value: 'A' }];
    const nodes = [{ id: 'q-1', data: {} }];
    expect(calculateScore(answers, nodes)).toEqual({ score: 0, maxScore: 0 });
  });

  it('accumulates maxScore from all nodes with points', () => {
    const answers = [
      { nodeId: 'q-1', questionText: 'Q1', value: 'wrong' },
      { nodeId: 'q-2', questionText: 'Q2', value: 'wrong' },
    ];
    const nodes = [
      { id: 'q-1', data: { points: 10, correctAnswer: 'A' } },
      { id: 'q-2', data: { points: 5, correctAnswer: 'B' } },
    ];
    const result = calculateScore(answers, nodes);
    expect(result.maxScore).toBe(15);
  });

  it('awards points for correct single-answer match', () => {
    const answers = [{ nodeId: 'q-1', questionText: 'Q1', value: 'A' }];
    const nodes = [{ id: 'q-1', data: { points: 10, correctAnswer: 'A' } }];
    expect(calculateScore(answers, nodes)).toEqual({ score: 10, maxScore: 10 });
  });

  it('does not award points for incorrect single-answer', () => {
    const answers = [{ nodeId: 'q-1', questionText: 'Q1', value: 'B' }];
    const nodes = [{ id: 'q-1', data: { points: 10, correctAnswer: 'A' } }];
    expect(calculateScore(answers, nodes)).toEqual({ score: 0, maxScore: 10 });
  });

  it('awards points for correct multi-answer match (exact set)', () => {
    const answers = [{ nodeId: 'q-1', questionText: 'Q1', value: ['A', 'B'] }];
    const nodes = [{ id: 'q-1', data: { points: 10, correctAnswer: ['A', 'B'] } }];
    expect(calculateScore(answers, nodes)).toEqual({ score: 10, maxScore: 10 });
  });

  it('does not award points when multi-answer is a partial match', () => {
    const answers = [{ nodeId: 'q-1', questionText: 'Q1', value: ['A'] }];
    const nodes = [{ id: 'q-1', data: { points: 10, correctAnswer: ['A', 'B'] } }];
    expect(calculateScore(answers, nodes)).toEqual({ score: 0, maxScore: 10 });
  });

  it('handles answer as number type (toString comparison)', () => {
    const answers = [{ nodeId: 'q-1', questionText: 'Q1', value: 42 }];
    const nodes = [{ id: 'q-1', data: { points: 5, correctAnswer: '42' } }];
    expect(calculateScore(answers, nodes)).toEqual({ score: 5, maxScore: 5 });
  });

  it('skips nodes without correctAnswer defined', () => {
    const answers = [{ nodeId: 'q-1', questionText: 'Q1', value: 'A' }];
    const nodes = [{ id: 'q-1', data: { points: 10 } }];
    // points exist but no correctAnswer → adds to maxScore but can't score
    expect(calculateScore(answers, nodes)).toEqual({ score: 0, maxScore: 10 });
  });

  it('handles empty answers array', () => {
    const nodes = [{ id: 'q-1', data: { points: 10, correctAnswer: 'A' } }];
    expect(calculateScore([], nodes)).toEqual({ score: 0, maxScore: 0 });
  });
});

describe('formatResponseForSheet', () => {
  it('includes Timestamp as ISO string', () => {
    const response = makeResponse();
    const result = formatResponseForSheet(response);
    expect(result['Timestamp']).toBe(response.submittedAt.toISOString());
  });

  it('formats each answer as "Q1: questionText" → value', () => {
    const response = makeResponse();
    const result = formatResponseForSheet(response);
    expect(result['Q1: Pick one']).toBe('Option A');
    expect(result['Q2: Your name?']).toBe('Alice');
  });

  it('truncates question header to 50 characters', () => {
    const longQ = 'A'.repeat(60);
    const response = makeResponse({
      answers: [{ nodeId: 'q-1', questionText: longQ, value: 'val' }],
    });
    const result = formatResponseForSheet(response);
    const keys = Object.keys(result).filter((k) => k !== 'Timestamp');
    expect(keys[0].length).toBeLessThanOrEqual(50);
  });

  it('joins array answers with comma-space', () => {
    const response = makeResponse({
      answers: [{ nodeId: 'q-1', questionText: 'Multi', value: ['A', 'B', 'C'] }],
    });
    const result = formatResponseForSheet(response);
    expect(result['Q1: Multi']).toBe('A, B, C');
  });

  it('includes Score row when score is not null', () => {
    const response = makeResponse({ score: 8, maxScore: 10 });
    const result = formatResponseForSheet(response);
    expect(result['Score']).toBe('8/10');
  });

  it('omits Score row when score is null', () => {
    const response = makeResponse({ score: null, maxScore: null });
    const result = formatResponseForSheet(response);
    expect(result['Score']).toBeUndefined();
  });
});

describe('formatResponseForCSV', () => {
  it('produces header row with Timestamp, questions, and Score', () => {
    const csv = formatResponseForCSV([], ['Q1', 'Q2']);
    const header = csv.split('\n')[0];
    expect(header).toBe('Timestamp,Q1,Q2,Score');
  });

  it('escapes double quotes by doubling them', () => {
    const response = makeResponse({
      answers: [{ nodeId: 'q-1', questionText: 'Q1', value: 'She said "hello"' }],
    });
    const csv = formatResponseForCSV([response], ['Q1']);
    expect(csv).toContain('""hello""');
  });

  it('wraps answer values in double quotes', () => {
    const response = makeResponse({
      answers: [{ nodeId: 'q-1', questionText: 'Q1', value: 'simple' }],
    });
    const csv = formatResponseForCSV([response], ['Q1']);
    const dataRow = csv.split('\n')[1];
    expect(dataRow).toContain('"simple"');
  });

  it('joins multi-select answers with semicolons', () => {
    const response = makeResponse({
      answers: [{ nodeId: 'q-1', questionText: 'Q1', value: ['A', 'B'] }],
    });
    const csv = formatResponseForCSV([response], ['Q1']);
    expect(csv).toContain('A; B');
  });

  it('handles empty responses array (headers only)', () => {
    const csv = formatResponseForCSV([], ['Q1']);
    expect(csv).toBe('Timestamp,Q1,Score');
  });

  it('handles responses with missing answers (empty cells)', () => {
    const response = makeResponse({ answers: [] });
    const csv = formatResponseForCSV([response], ['Q1', 'Q2']);
    const dataRow = csv.split('\n')[1];
    // Should have timestamp, two empty cells, and empty score
    expect(dataRow.split(',').length).toBe(4);
  });

  it('includes score as "X/Y" format when present', () => {
    const response = makeResponse({ score: 7, maxScore: 10 });
    const csv = formatResponseForCSV([response], []);
    expect(csv).toContain('7/10');
  });

  it('leaves score empty when null', () => {
    const response = makeResponse({ score: null });
    const csv = formatResponseForCSV([response], []);
    const dataRow = csv.split('\n')[1];
    expect(dataRow.endsWith(',')).toBe(true);
  });
});
