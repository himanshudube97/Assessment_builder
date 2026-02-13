/**
 * Shared test fixtures and factory helpers
 */

import type { FlowNode, FlowEdge, QuestionNodeData } from '@/domain/entities/flow';
import type { Assessment, AssessmentSettings } from '@/domain/entities/assessment';
import { DEFAULT_ASSESSMENT_SETTINGS } from '@/domain/entities/assessment';
import type { Answer, Response } from '@/domain/entities/response';
import type { Organization } from '@/domain/entities/organization';
import type { AssessmentInvite } from '@/domain/entities/assessmentInvite';

// ===== Flow Fixtures =====

export const startNode: FlowNode = {
  id: 'start-1',
  type: 'start',
  position: { x: 250, y: 50 },
  data: { title: 'Welcome', description: 'Desc', buttonText: 'Start' },
};

export const questionNodeMCQ: FlowNode = {
  id: 'q-mcq',
  type: 'question',
  position: { x: 250, y: 250 },
  data: {
    questionType: 'multiple_choice_single',
    questionText: 'Pick one',
    description: null,
    required: true,
    options: [
      { id: 'opt-1', text: 'Option A' },
      { id: 'opt-2', text: 'Option B' },
    ],
  } satisfies QuestionNodeData,
};

export const questionNodeText: FlowNode = {
  id: 'q-text',
  type: 'question',
  position: { x: 250, y: 450 },
  data: {
    questionType: 'short_text',
    questionText: 'Your name?',
    description: null,
    required: true,
    placeholder: 'Enter name...',
  } satisfies QuestionNodeData,
};

export const endNode: FlowNode = {
  id: 'end-1',
  type: 'end',
  position: { x: 250, y: 650 },
  data: { title: 'Thanks', description: 'Done', showScore: false, redirectUrl: null },
};

export const minimalFlow = {
  nodes: [startNode, endNode] as FlowNode[],
  edges: [
    { id: 'e-1', source: 'start-1', target: 'end-1', sourceHandle: null, condition: null },
  ] as FlowEdge[],
};

export const linearFlow = {
  nodes: [startNode, questionNodeMCQ, questionNodeText, endNode] as FlowNode[],
  edges: [
    { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
    { id: 'e-2', source: 'q-mcq', target: 'q-text', sourceHandle: null, condition: null },
    { id: 'e-3', source: 'q-text', target: 'end-1', sourceHandle: null, condition: null },
  ] as FlowEdge[],
};

// ===== Assessment Fixtures =====

export function makeAssessment(overrides?: Partial<Assessment>): Assessment {
  return {
    id: 'test-assessment-1',
    organizationId: 'org-1',
    createdBy: 'user-1',
    title: 'Test Assessment',
    description: null,
    status: 'published',
    nodes: minimalFlow.nodes,
    edges: minimalFlow.edges,
    settings: { ...DEFAULT_ASSESSMENT_SETTINGS },
    googleSheetId: null,
    googleSheetName: null,
    responseCount: 0,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    publishedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ===== Response Fixtures =====

export function makeResponse(overrides?: Partial<Response>): Response {
  return {
    id: 'resp-1',
    assessmentId: 'test-assessment-1',
    answers: [
      { nodeId: 'q-mcq', questionText: 'Pick one', value: 'Option A' },
      { nodeId: 'q-text', questionText: 'Your name?', value: 'Alice' },
    ],
    score: null,
    maxScore: null,
    startedAt: new Date('2025-01-01T10:00:00Z'),
    submittedAt: new Date('2025-01-01T10:05:00Z'),
    metadata: { userAgent: 'test-agent', ipCountry: null, referrer: null },
    ...overrides,
  };
}

// ===== Organization Fixtures =====

export function makeOrg(overrides?: Partial<Organization>): Organization {
  return {
    id: 'org-1',
    name: 'Test Org',
    slug: 'test-org',
    plan: 'free',
    planExpiresAt: null,
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    responseCountThisMonth: 0,
    responseCountResetAt: new Date('2025-02-01'),
    settings: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  };
}

// ===== Invite Fixtures =====

export function makeInvite(overrides?: Partial<AssessmentInvite>): AssessmentInvite {
  return {
    id: 'invite-1',
    assessmentId: 'test-assessment-1',
    email: null,
    token: 'abc123',
    maxUses: 10,
    usedCount: 0,
    expiresAt: null,
    createdAt: new Date('2025-01-01'),
    ...overrides,
  };
}
