import { describe, it, expect } from 'vitest';
import {
  validateFlow,
  generateNodeId,
  generateEdgeId,
  createStartNode,
  createQuestionNode,
  createEndNode,
  createEdge,
  isStartNodeData,
  isQuestionNodeData,
  isEndNodeData,
} from './flow';
import type { FlowNode, FlowEdge, QuestionNodeData } from './flow';
import { startNode, endNode, questionNodeMCQ, minimalFlow, linearFlow } from '@/test/fixtures';

// ===== Type Guards =====

describe('isStartNodeData', () => {
  it('returns true for StartNodeData (has buttonText)', () => {
    expect(isStartNodeData(startNode.data)).toBe(true);
  });

  it('returns false for QuestionNodeData', () => {
    expect(isStartNodeData(questionNodeMCQ.data)).toBe(false);
  });

  it('returns false for EndNodeData', () => {
    expect(isStartNodeData(endNode.data)).toBe(false);
  });
});

describe('isQuestionNodeData', () => {
  it('returns true for QuestionNodeData (has questionType)', () => {
    expect(isQuestionNodeData(questionNodeMCQ.data)).toBe(true);
  });

  it('returns false for StartNodeData', () => {
    expect(isQuestionNodeData(startNode.data)).toBe(false);
  });

  it('returns false for EndNodeData', () => {
    expect(isQuestionNodeData(endNode.data)).toBe(false);
  });
});

describe('isEndNodeData', () => {
  it('returns true for EndNodeData (has showScore)', () => {
    expect(isEndNodeData(endNode.data)).toBe(true);
  });

  it('returns false for StartNodeData', () => {
    expect(isEndNodeData(startNode.data)).toBe(false);
  });

  it('returns false for QuestionNodeData', () => {
    expect(isEndNodeData(questionNodeMCQ.data)).toBe(false);
  });
});

// ===== Factory Functions =====

describe('generateNodeId', () => {
  it('includes the node type in the generated ID', () => {
    const id = generateNodeId('question');
    expect(id).toContain('question-');
  });

  it('generates unique IDs on successive calls', () => {
    const id1 = generateNodeId('question');
    const id2 = generateNodeId('question');
    expect(id1).not.toBe(id2);
  });
});

describe('generateEdgeId', () => {
  it('includes source and target in the edge ID', () => {
    const id = generateEdgeId('node-a', 'node-b');
    expect(id).toContain('node-a');
    expect(id).toContain('node-b');
  });
});

describe('createStartNode', () => {
  it('returns a node with type "start" and default data', () => {
    const node = createStartNode({ x: 100, y: 200 });
    expect(node.type).toBe('start');
    expect(node.data).toHaveProperty('buttonText', 'Start');
    expect(node.data).toHaveProperty('title', 'Welcome');
  });

  it('uses the provided position', () => {
    const node = createStartNode({ x: 42, y: 99 });
    expect(node.position).toEqual({ x: 42, y: 99 });
  });
});

describe('createQuestionNode', () => {
  it('defaults to multiple_choice_single when no type given', () => {
    const node = createQuestionNode({ x: 0, y: 0 });
    const data = node.data as QuestionNodeData;
    expect(data.questionType).toBe('multiple_choice_single');
  });

  it('sets options for multiple_choice_single type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'multiple_choice_single');
    const data = node.data as QuestionNodeData;
    expect(data.options).toBeDefined();
    expect(data.options!.length).toBe(2);
  });

  it('sets options for multiple_choice_multi type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'multiple_choice_multi');
    const data = node.data as QuestionNodeData;
    expect(data.options).toBeDefined();
    expect(data.options!.length).toBe(2);
  });

  it('sets rating scale for rating type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'rating');
    const data = node.data as QuestionNodeData;
    expect(data.minValue).toBe(1);
    expect(data.maxValue).toBe(5);
    expect(data.minLabel).toBe('Poor');
    expect(data.maxLabel).toBe('Excellent');
  });

  it('sets placeholder for short_text type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'short_text');
    const data = node.data as QuestionNodeData;
    expect(data.placeholder).toBe('Enter your answer...');
    expect(data.maxLength).toBe(100);
  });

  it('sets placeholder for long_text type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'long_text');
    const data = node.data as QuestionNodeData;
    expect(data.placeholder).toBe('Enter your answer...');
    expect(data.maxLength).toBe(1000);
  });

  it('sets yes/no options with enableBranching for yes_no type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'yes_no');
    const data = node.data as QuestionNodeData;
    expect(data.options).toBeDefined();
    expect(data.options!.map((o) => o.text)).toEqual(['Yes', 'No']);
    expect(data.enableBranching).toBe(true);
  });

  it('sets number placeholder for number type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'number');
    const data = node.data as QuestionNodeData;
    expect(data.placeholder).toBe('Enter a number...');
  });

  it('sets email placeholder for email type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'email');
    const data = node.data as QuestionNodeData;
    expect(data.placeholder).toBe('you@example.com');
  });

  it('sets dropdown options for dropdown type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'dropdown');
    const data = node.data as QuestionNodeData;
    expect(data.options).toBeDefined();
    expect(data.options!.length).toBe(3);
  });

  it('sets date placeholder for date type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'date');
    const data = node.data as QuestionNodeData;
    expect(data.placeholder).toBe('Select a date...');
  });

  it('sets NPS defaults (0-10) for nps type', () => {
    const node = createQuestionNode({ x: 0, y: 0 }, 'nps');
    const data = node.data as QuestionNodeData;
    expect(data.minValue).toBe(0);
    expect(data.maxValue).toBe(10);
    expect(data.minLabel).toBe('Not likely');
    expect(data.maxLabel).toBe('Very likely');
  });
});

describe('createEndNode', () => {
  it('returns a node with type "end" and default data', () => {
    const node = createEndNode({ x: 0, y: 0 });
    expect(node.type).toBe('end');
    expect(node.data).toHaveProperty('title', 'Thank You!');
  });

  it('defaults showScore to false and redirectUrl to null', () => {
    const node = createEndNode({ x: 0, y: 0 });
    expect(node.data).toHaveProperty('showScore', false);
    expect(node.data).toHaveProperty('redirectUrl', null);
  });
});

describe('createEdge', () => {
  it('creates edge with null condition by default', () => {
    const edge = createEdge('a', 'b');
    expect(edge.source).toBe('a');
    expect(edge.target).toBe('b');
    expect(edge.condition).toBeNull();
    expect(edge.sourceHandle).toBeNull();
  });

  it('creates edge with provided condition', () => {
    const condition = { type: 'equals' as const, value: 'Yes' };
    const edge = createEdge('a', 'b', condition);
    expect(edge.condition).toEqual(condition);
  });
});

// ===== Validation =====

describe('validateFlow', () => {
  it('returns error when no start node exists', () => {
    const nodes: FlowNode[] = [endNode];
    const edges: FlowEdge[] = [];
    const errors = validateFlow(nodes, edges);
    expect(errors.some((e) => e.message.includes('start node'))).toBe(true);
  });

  it('returns error when multiple start nodes exist', () => {
    const start2: FlowNode = { ...startNode, id: 'start-2' };
    const errors = validateFlow([startNode, start2, endNode], minimalFlow.edges);
    expect(errors.some((e) => e.message.includes('only have one start'))).toBe(true);
  });

  it('returns no error for exactly one start node', () => {
    const errors = validateFlow(minimalFlow.nodes, minimalFlow.edges);
    expect(errors.filter((e) => e.message.includes('start node'))).toHaveLength(0);
  });

  it('returns error when no end node exists', () => {
    const nodes: FlowNode[] = [startNode];
    const errors = validateFlow(nodes, []);
    expect(errors.some((e) => e.message.includes('end node'))).toBe(true);
  });

  it('passes with one or more end nodes', () => {
    const end2: FlowNode = { ...endNode, id: 'end-2', position: { x: 500, y: 650 } };
    const edges: FlowEdge[] = [
      ...minimalFlow.edges,
      { id: 'e-extra', source: 'start-1', target: 'end-2', sourceHandle: null, condition: null },
    ];
    const errors = validateFlow([...minimalFlow.nodes, end2], edges);
    expect(errors.filter((e) => e.message.includes('end node'))).toHaveLength(0);
  });

  it('warns about orphan nodes not connected by any edge', () => {
    const orphan: FlowNode = {
      id: 'q-orphan',
      type: 'question',
      position: { x: 600, y: 300 },
      data: {
        questionType: 'short_text',
        questionText: 'Orphan',
        description: null,
        required: false,
      },
    };
    const errors = validateFlow([...minimalFlow.nodes, orphan], minimalFlow.edges);
    expect(errors.some((e) => e.nodeId === 'q-orphan' && e.type === 'warning')).toBe(true);
  });

  it('does not warn about orphan when only one node exists', () => {
    const errors = validateFlow([startNode], []);
    // There should be an error about missing end, but not about orphans
    expect(errors.filter((e) => e.message.includes('not connected'))).toHaveLength(0);
  });

  it('returns error for question nodes with empty questionText', () => {
    const emptyQ: FlowNode = {
      id: 'q-empty',
      type: 'question',
      position: { x: 0, y: 0 },
      data: {
        questionType: 'short_text',
        questionText: '',
        description: null,
        required: true,
      },
    };
    const edges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-empty', sourceHandle: null, condition: null },
      { id: 'e-2', source: 'q-empty', target: 'end-1', sourceHandle: null, condition: null },
    ];
    const errors = validateFlow([startNode, emptyQ, endNode], edges);
    expect(errors.some((e) => e.message.includes('empty'))).toBe(true);
  });

  it('returns error for question nodes with whitespace-only questionText', () => {
    const wsQ: FlowNode = {
      id: 'q-ws',
      type: 'question',
      position: { x: 0, y: 0 },
      data: {
        questionType: 'short_text',
        questionText: '   ',
        description: null,
        required: true,
      },
    };
    const edges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-ws', sourceHandle: null, condition: null },
      { id: 'e-2', source: 'q-ws', target: 'end-1', sourceHandle: null, condition: null },
    ];
    const errors = validateFlow([startNode, wsQ, endNode], edges);
    expect(errors.some((e) => e.message.includes('empty'))).toBe(true);
  });

  it('warns when questionText references a nodeId not in the flow', () => {
    const pipedQ: FlowNode = {
      id: 'q-piped',
      type: 'question',
      position: { x: 0, y: 0 },
      data: {
        questionType: 'short_text',
        questionText: 'You said {{deleted-node:Name}}, right?',
        description: null,
        required: true,
      },
    };
    const edges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-piped', sourceHandle: null, condition: null },
      { id: 'e-2', source: 'q-piped', target: 'end-1', sourceHandle: null, condition: null },
    ];
    const errors = validateFlow([startNode, pipedQ, endNode], edges);
    expect(errors.some((e) => e.message.includes('deleted question'))).toBe(true);
  });

  it('does not warn when all pipe references point to existing nodes', () => {
    const pipedQ: FlowNode = {
      id: 'q-piped',
      type: 'question',
      position: { x: 0, y: 0 },
      data: {
        questionType: 'short_text',
        questionText: 'You said {{q-mcq:Pick one}}, right?',
        description: null,
        required: true,
      },
    };
    const edges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
      { id: 'e-2', source: 'q-mcq', target: 'q-piped', sourceHandle: null, condition: null },
      { id: 'e-3', source: 'q-piped', target: 'end-1', sourceHandle: null, condition: null },
    ];
    const errors = validateFlow([startNode, questionNodeMCQ, pipedQ, endNode], edges);
    expect(errors.filter((e) => e.message.includes('deleted'))).toHaveLength(0);
  });

  it('returns multiple errors for a completely invalid flow', () => {
    const errors = validateFlow([], []);
    expect(errors.length).toBeGreaterThanOrEqual(2); // no start, no end
  });

  it('returns empty array for a valid minimal flow (start -> end)', () => {
    const errors = validateFlow(minimalFlow.nodes, minimalFlow.edges);
    expect(errors).toHaveLength(0);
  });

  it('returns empty array for a valid linear flow', () => {
    const errors = validateFlow(linearFlow.nodes, linearFlow.edges);
    expect(errors).toHaveLength(0);
  });
});
