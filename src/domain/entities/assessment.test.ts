import { describe, it, expect } from 'vitest';
import {
  isAssessmentOpen,
  isPasswordProtected,
  createDefaultNodes,
  createDefaultEdges,
  DEFAULT_ASSESSMENT_SETTINGS,
} from './assessment';
import { makeAssessment } from '@/test/fixtures';

describe('isAssessmentOpen', () => {
  it('returns false when status is "draft"', () => {
    const a = makeAssessment({ status: 'draft' });
    expect(isAssessmentOpen(a)).toBe(false);
  });

  it('returns false when status is "closed"', () => {
    const a = makeAssessment({ status: 'closed' });
    expect(isAssessmentOpen(a)).toBe(false);
  });

  it('returns true when status is "published" with no constraints', () => {
    const a = makeAssessment({ status: 'published' });
    expect(isAssessmentOpen(a)).toBe(true);
  });

  it('returns false when current time is before openAt', () => {
    const future = new Date(Date.now() + 86_400_000); // tomorrow
    const a = makeAssessment({
      settings: { ...DEFAULT_ASSESSMENT_SETTINGS, openAt: future },
    });
    expect(isAssessmentOpen(a)).toBe(false);
  });

  it('returns false when current time is after closeAt', () => {
    const past = new Date(Date.now() - 86_400_000); // yesterday
    const a = makeAssessment({
      settings: { ...DEFAULT_ASSESSMENT_SETTINGS, closeAt: past },
    });
    expect(isAssessmentOpen(a)).toBe(false);
  });

  it('returns true when current time is within openAt and closeAt', () => {
    const past = new Date(Date.now() - 86_400_000);
    const future = new Date(Date.now() + 86_400_000);
    const a = makeAssessment({
      settings: { ...DEFAULT_ASSESSMENT_SETTINGS, openAt: past, closeAt: future },
    });
    expect(isAssessmentOpen(a)).toBe(true);
  });

  it('returns false when responseCount >= maxResponses', () => {
    const a = makeAssessment({
      responseCount: 100,
      settings: { ...DEFAULT_ASSESSMENT_SETTINGS, maxResponses: 100 },
    });
    expect(isAssessmentOpen(a)).toBe(false);
  });

  it('returns true when responseCount < maxResponses', () => {
    const a = makeAssessment({
      responseCount: 5,
      settings: { ...DEFAULT_ASSESSMENT_SETTINGS, maxResponses: 100 },
    });
    expect(isAssessmentOpen(a)).toBe(true);
  });

  it('handles null openAt/closeAt/maxResponses as unconstrained', () => {
    const a = makeAssessment({
      settings: {
        ...DEFAULT_ASSESSMENT_SETTINGS,
        openAt: null,
        closeAt: null,
        maxResponses: null,
      },
    });
    expect(isAssessmentOpen(a)).toBe(true);
  });
});

describe('isPasswordProtected', () => {
  it('returns true when settings.password is a non-null string', () => {
    const a = makeAssessment({
      settings: { ...DEFAULT_ASSESSMENT_SETTINGS, password: 'hashed-pw' },
    });
    expect(isPasswordProtected(a)).toBe(true);
  });

  it('returns false when settings.password is null', () => {
    const a = makeAssessment();
    expect(isPasswordProtected(a)).toBe(false);
  });
});

describe('createDefaultNodes', () => {
  it('returns exactly two nodes: start and end', () => {
    const nodes = createDefaultNodes();
    expect(nodes).toHaveLength(2);
    expect(nodes[0].type).toBe('start');
    expect(nodes[1].type).toBe('end');
  });

  it('nodes have deterministic IDs ("start-node" and "end-node")', () => {
    const nodes = createDefaultNodes();
    expect(nodes[0].id).toBe('start-node');
    expect(nodes[1].id).toBe('end-node');
  });

  it('start node has expected default data', () => {
    const nodes = createDefaultNodes();
    expect(nodes[0].data).toEqual({
      title: 'Welcome',
      description: 'Thank you for taking this assessment.',
      buttonText: 'Start',
    });
  });

  it('end node has expected default data', () => {
    const nodes = createDefaultNodes();
    expect(nodes[1].data).toEqual({
      title: 'Thank You!',
      description: 'Your response has been recorded.',
      showScore: false,
      redirectUrl: null,
    });
  });
});

describe('createDefaultEdges', () => {
  it('returns one edge connecting start-node to end-node', () => {
    const edges = createDefaultEdges();
    expect(edges).toHaveLength(1);
    expect(edges[0].source).toBe('start-node');
    expect(edges[0].target).toBe('end-node');
  });

  it('edge has null condition and null sourceHandle', () => {
    const edges = createDefaultEdges();
    expect(edges[0].condition).toBeNull();
    expect(edges[0].sourceHandle).toBeNull();
  });
});

describe('DEFAULT_ASSESSMENT_SETTINGS', () => {
  it('primaryColor is #6366F1', () => {
    expect(DEFAULT_ASSESSMENT_SETTINGS.primaryColor).toBe('#6366F1');
  });

  it('backgroundColor is #FFFFFF', () => {
    expect(DEFAULT_ASSESSMENT_SETTINGS.backgroundColor).toBe('#FFFFFF');
  });

  it('inviteOnly defaults to false', () => {
    expect(DEFAULT_ASSESSMENT_SETTINGS.inviteOnly).toBe(false);
  });

  it('scoringEnabled defaults to false', () => {
    expect(DEFAULT_ASSESSMENT_SETTINGS.scoringEnabled).toBe(false);
  });

  it('fontFamily defaults to Geist Sans', () => {
    expect(DEFAULT_ASSESSMENT_SETTINGS.fontFamily).toBe('Geist Sans');
  });

  it('buttonStyle defaults to filled', () => {
    expect(DEFAULT_ASSESSMENT_SETTINGS.buttonStyle).toBe('filled');
  });

  it('cardStyle defaults to bordered', () => {
    expect(DEFAULT_ASSESSMENT_SETTINGS.cardStyle).toBe('bordered');
  });
});
