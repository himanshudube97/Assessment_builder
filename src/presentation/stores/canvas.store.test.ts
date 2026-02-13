import { describe, it, expect, beforeEach } from 'vitest';
import { useCanvasStore, canvasUndo, canvasRedo, canvasClearHistory } from './canvas.store';
import type { FlowNode, FlowEdge, QuestionNodeData } from '@/domain/entities/flow';

// Helper to get store state/actions
const store = () => useCanvasStore.getState();

// Test flow data
const testNodes: FlowNode[] = [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 250, y: 50 },
    data: { title: 'Welcome', description: 'Desc', buttonText: 'Start' },
  },
  {
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
      enableBranching: false,
    } as QuestionNodeData,
  },
  {
    id: 'q-yn',
    type: 'question',
    position: { x: 250, y: 450 },
    data: {
      questionType: 'yes_no',
      questionText: 'Yes or No?',
      description: null,
      required: true,
      options: [
        { id: 'opt-yes', text: 'Yes' },
        { id: 'opt-no', text: 'No' },
      ],
      enableBranching: true,
    } as QuestionNodeData,
  },
  {
    id: 'end-1',
    type: 'end',
    position: { x: 250, y: 650 },
    data: { title: 'Thanks', description: 'Done', showScore: false, redirectUrl: null },
  },
];

const testEdges: FlowEdge[] = [
  { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
  { id: 'e-2', source: 'q-mcq', target: 'q-yn', sourceHandle: null, condition: null },
  { id: 'e-3', source: 'q-yn', target: 'end-1', sourceHandle: 'opt-yes', condition: null },
];

beforeEach(() => {
  store().reset();
  canvasClearHistory();
});

// ===== setAssessment =====

describe('setAssessment', () => {
  it('sets assessment metadata (id, title, description)', () => {
    store().setAssessment('a-1', 'My Assessment', 'A description');
    expect(store().assessmentId).toBe('a-1');
    expect(store().title).toBe('My Assessment');
    expect(store().description).toBe('A description');
  });

  it('sets isFlowLocked to true when status is not "draft"', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    expect(store().isFlowLocked).toBe(true);
  });

  it('sets isFlowLocked to false when status is "draft"', () => {
    store().setAssessment('a-1', 'T', null, 'draft');
    expect(store().isFlowLocked).toBe(false);
  });
});

// ===== loadCanvas =====

describe('loadCanvas', () => {
  it('converts FlowNode[] to RFNode[] correctly', () => {
    store().loadCanvas(testNodes, testEdges);
    expect(store().nodes).toHaveLength(4);
    expect(store().nodes[0].id).toBe('start-1');
    expect(store().nodes[0].type).toBe('start');
  });

  it('converts FlowEdge[] to RFEdge[] with conditionEdge type', () => {
    store().loadCanvas(testNodes, testEdges);
    expect(store().edges.every((e) => e.type === 'conditionEdge')).toBe(true);
  });

  it('builds edgeConditionMap from edges with conditions', () => {
    const edgesWithCondition: FlowEdge[] = [
      {
        id: 'e-cond',
        source: 'q-mcq',
        target: 'end-1',
        sourceHandle: null,
        condition: { type: 'equals', value: 'Option A' },
      },
    ];
    store().loadCanvas(testNodes, edgesWithCondition);
    expect(store().edgeConditionMap['e-cond']).toEqual({ type: 'equals', value: 'Option A' });
  });

  it('reconciles branching: migrates null sourceHandle for yes_no nodes with branching', () => {
    // q-yn has branching enabled but edge e-3 already has sourceHandle, so this tests
    // the case where an edge has null sourceHandle for a branching node
    const edgesNullHandle: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-yn', sourceHandle: null, condition: null },
      { id: 'e-yn', source: 'q-yn', target: 'end-1', sourceHandle: null, condition: null },
    ];
    store().loadCanvas(testNodes, edgesNullHandle);
    const ynEdge = store().edges.find((e) => e.source === 'q-yn');
    expect(ynEdge?.sourceHandle).toBe('opt-yes'); // migrated to first option
  });

  it('sets isDirty to false after loading', () => {
    store().loadCanvas(testNodes, testEdges);
    expect(store().isDirty).toBe(false);
  });
});

// ===== addNode =====

describe('addNode', () => {
  it('adds a question node and selects it', () => {
    store().loadCanvas(testNodes, testEdges);
    const prevCount = store().nodes.length;
    store().addNode('question', { x: 100, y: 100 });
    expect(store().nodes.length).toBe(prevCount + 1);
    expect(store().selectedNodeId).not.toBeNull();
  });

  it('adds an end node', () => {
    store().loadCanvas(testNodes, testEdges);
    store().addNode('end', { x: 100, y: 100 });
    const lastNode = store().nodes[store().nodes.length - 1];
    expect(lastNode.type).toBe('end');
  });

  it('sets isDirty to true', () => {
    store().loadCanvas(testNodes, testEdges);
    expect(store().isDirty).toBe(false);
    store().addNode('question', { x: 100, y: 100 });
    expect(store().isDirty).toBe(true);
  });

  it('sets newlyAddedNodeId', () => {
    store().loadCanvas(testNodes, testEdges);
    store().addNode('question', { x: 100, y: 100 });
    expect(store().newlyAddedNodeId).not.toBeNull();
  });

  it('opens the panel', () => {
    store().loadCanvas(testNodes, testEdges);
    store().addNode('question', { x: 100, y: 100 });
    expect(store().isPanelOpen).toBe(true);
  });

  it('does nothing when isFlowLocked is true', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    const prevCount = store().nodes.length;
    store().addNode('question', { x: 100, y: 100 });
    expect(store().nodes.length).toBe(prevCount);
  });
});

// ===== addQuestionNode =====

describe('addQuestionNode', () => {
  it('adds a node with the specified question type', () => {
    store().loadCanvas(testNodes, testEdges);
    store().addQuestionNode('rating', { x: 100, y: 100 });
    const lastNode = store().nodes[store().nodes.length - 1];
    const data = lastNode.data as QuestionNodeData;
    expect(data.questionType).toBe('rating');
  });

  it('does nothing when isFlowLocked is true', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    const prevCount = store().nodes.length;
    store().addQuestionNode('rating', { x: 100, y: 100 });
    expect(store().nodes.length).toBe(prevCount);
  });
});

// ===== deleteNode =====

describe('deleteNode', () => {
  it('removes the node from nodes array', () => {
    store().loadCanvas(testNodes, testEdges);
    store().deleteNode('q-mcq');
    expect(store().nodes.find((n) => n.id === 'q-mcq')).toBeUndefined();
  });

  it('removes all edges connected to the deleted node', () => {
    store().loadCanvas(testNodes, testEdges);
    store().deleteNode('q-mcq');
    expect(store().edges.filter((e) => e.source === 'q-mcq' || e.target === 'q-mcq')).toHaveLength(0);
  });

  it('deselects and closes panel if deleted node was selected', () => {
    store().loadCanvas(testNodes, testEdges);
    store().selectNode('q-mcq');
    store().deleteNode('q-mcq');
    expect(store().selectedNodeId).toBeNull();
    expect(store().isPanelOpen).toBe(false);
  });

  it('sets isDirty to true', () => {
    store().loadCanvas(testNodes, testEdges);
    store().deleteNode('q-mcq');
    expect(store().isDirty).toBe(true);
  });

  it('does nothing when isFlowLocked is true', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    const prevCount = store().nodes.length;
    store().deleteNode('q-mcq');
    expect(store().nodes.length).toBe(prevCount);
  });
});

// ===== updateNodeData =====

describe('updateNodeData', () => {
  it('merges partial data into existing node data', () => {
    store().loadCanvas(testNodes, testEdges);
    store().updateNodeData('q-mcq', { questionText: 'Updated question' });
    const node = store().nodes.find((n) => n.id === 'q-mcq');
    expect((node?.data as QuestionNodeData).questionText).toBe('Updated question');
    // Original fields should be preserved
    expect((node?.data as QuestionNodeData).required).toBe(true);
  });

  it('does not modify other nodes', () => {
    store().loadCanvas(testNodes, testEdges);
    store().updateNodeData('q-mcq', { questionText: 'Changed' });
    const startData = store().nodes.find((n) => n.id === 'start-1')?.data;
    expect(startData).toHaveProperty('title', 'Welcome');
  });

  it('sets isDirty to true', () => {
    store().loadCanvas(testNodes, testEdges);
    store().updateNodeData('q-mcq', { questionText: 'Changed' });
    expect(store().isDirty).toBe(true);
  });

  it('does nothing when isFlowLocked is true', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    store().updateNodeData('q-mcq', { questionText: 'Changed' });
    const node = store().nodes.find((n) => n.id === 'q-mcq');
    expect((node?.data as QuestionNodeData).questionText).toBe('Pick one');
  });
});

// ===== onConnect =====

describe('onConnect', () => {
  it('adds a new edge with conditionEdge type', () => {
    store().loadCanvas(testNodes, testEdges);
    const prevCount = store().edges.length;
    store().onConnect({ source: 'q-mcq', target: 'end-1', sourceHandle: null, targetHandle: null });
    expect(store().edges.length).toBe(prevCount + 1);
  });

  it('sets isDirty to true', () => {
    store().loadCanvas(testNodes, testEdges);
    store().onConnect({ source: 'q-mcq', target: 'end-1', sourceHandle: null, targetHandle: null });
    expect(store().isDirty).toBe(true);
  });

  it('does nothing when isFlowLocked is true', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    const prevCount = store().edges.length;
    store().onConnect({ source: 'q-mcq', target: 'end-1', sourceHandle: null, targetHandle: null });
    expect(store().edges.length).toBe(prevCount);
  });
});

// ===== toggleBranching =====

describe('toggleBranching', () => {
  it('enables branching: sets enableBranching=true on node data', () => {
    store().loadCanvas(testNodes, testEdges);
    store().toggleBranching('q-mcq', true);
    const node = store().nodes.find((n) => n.id === 'q-mcq');
    expect((node?.data as QuestionNodeData).enableBranching).toBe(true);
  });

  it('enables branching: migrates edges from null sourceHandle to first option ID', () => {
    store().loadCanvas(testNodes, testEdges);
    store().toggleBranching('q-mcq', true);
    const mcqEdges = store().edges.filter((e) => e.source === 'q-mcq');
    // All outgoing edges should now have sourceHandle = first option
    mcqEdges.forEach((e) => {
      expect(e.sourceHandle).toBe('opt-1');
    });
  });

  it('disables branching: sets enableBranching=false on node data', () => {
    store().loadCanvas(testNodes, testEdges);
    // q-yn already has branching enabled
    store().toggleBranching('q-yn', false);
    const node = store().nodes.find((n) => n.id === 'q-yn');
    expect((node?.data as QuestionNodeData).enableBranching).toBe(false);
  });

  it('disables branching: migrates per-option edges to null sourceHandle', () => {
    store().loadCanvas(testNodes, testEdges);
    store().toggleBranching('q-yn', false);
    const ynEdges = store().edges.filter((e) => e.source === 'q-yn');
    ynEdges.forEach((e) => {
      expect(e.sourceHandle).toBeNull();
    });
  });

  it('disables branching: deduplicates edges to same target', () => {
    // Set up two edges from q-yn to end-1 via different handles
    const edgesWithDups: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-yn', sourceHandle: null, condition: null },
      { id: 'e-yes', source: 'q-yn', target: 'end-1', sourceHandle: 'opt-yes', condition: null },
      { id: 'e-no', source: 'q-yn', target: 'end-1', sourceHandle: 'opt-no', condition: null },
    ];
    store().loadCanvas(testNodes, edgesWithDups);
    store().toggleBranching('q-yn', false);
    const ynEdges = store().edges.filter((e) => e.source === 'q-yn');
    expect(ynEdges).toHaveLength(1); // deduplicated
    expect(ynEdges[0].target).toBe('end-1');
  });

  it('sets nodeToUpdateInternals for React Flow handle recalculation', () => {
    store().loadCanvas(testNodes, testEdges);
    store().toggleBranching('q-mcq', true);
    expect(store().nodeToUpdateInternals).toBe('q-mcq');
  });

  it('does nothing when isFlowLocked is true', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    const prevData = store().nodes.find((n) => n.id === 'q-mcq')?.data;
    store().toggleBranching('q-mcq', true);
    const afterData = store().nodes.find((n) => n.id === 'q-mcq')?.data;
    expect(afterData).toEqual(prevData);
  });
});

// ===== canDisableBranching =====

describe('canDisableBranching', () => {
  it('returns true when 0 unique targets from per-option edges', () => {
    store().loadCanvas(testNodes, [
      { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
    ]);
    expect(store().canDisableBranching('q-mcq')).toBe(true);
  });

  it('returns true when 1 unique target from per-option edges', () => {
    store().loadCanvas(testNodes, testEdges);
    // q-yn has one edge to end-1 via opt-yes handle
    expect(store().canDisableBranching('q-yn')).toBe(true);
  });

  it('returns false when 2+ unique targets (would lose routing)', () => {
    const endNode2: FlowNode = {
      id: 'end-2',
      type: 'end',
      position: { x: 500, y: 650 },
      data: { title: 'Alt End', description: 'Alt', showScore: false, redirectUrl: null },
    };
    const edgesBranched: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-yn', sourceHandle: null, condition: null },
      { id: 'e-yes', source: 'q-yn', target: 'end-1', sourceHandle: 'opt-yes', condition: null },
      { id: 'e-no', source: 'q-yn', target: 'end-2', sourceHandle: 'opt-no', condition: null },
    ];
    store().loadCanvas([...testNodes, endNode2], edgesBranched);
    expect(store().canDisableBranching('q-yn')).toBe(false);
  });
});

// ===== updateEdgeCondition =====

describe('updateEdgeCondition', () => {
  it('stores condition in edgeConditionMap', () => {
    store().loadCanvas(testNodes, testEdges);
    const edgeId = store().edges[0].id;
    store().updateEdgeCondition(edgeId, { type: 'equals', value: 'A' });
    expect(store().edgeConditionMap[edgeId]).toEqual({ type: 'equals', value: 'A' });
  });

  it('updates edge data.condition for React Flow rendering', () => {
    store().loadCanvas(testNodes, testEdges);
    const edgeId = store().edges[0].id;
    store().updateEdgeCondition(edgeId, { type: 'greater_than', value: 5 });
    const edge = store().edges.find((e) => e.id === edgeId);
    expect(edge?.data?.condition).toEqual({ type: 'greater_than', value: 5 });
  });

  it('sets isDirty to true', () => {
    store().loadCanvas(testNodes, testEdges);
    const edgeId = store().edges[0].id;
    store().updateEdgeCondition(edgeId, { type: 'equals', value: 'A' });
    expect(store().isDirty).toBe(true);
  });

  it('does nothing when isFlowLocked is true', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    const edgeId = store().edges[0].id;
    store().updateEdgeCondition(edgeId, { type: 'equals', value: 'A' });
    expect(store().edgeConditionMap[edgeId]).toBeUndefined();
  });
});

// ===== getEdgeCondition =====

describe('getEdgeCondition', () => {
  it('returns condition from edgeConditionMap', () => {
    store().loadCanvas(testNodes, [
      {
        id: 'e-cond',
        source: 'q-mcq',
        target: 'end-1',
        sourceHandle: null,
        condition: { type: 'equals', value: 'X' },
      },
    ]);
    expect(store().getEdgeCondition('e-cond')).toEqual({ type: 'equals', value: 'X' });
  });

  it('returns null for unknown edge ID', () => {
    store().loadCanvas(testNodes, testEdges);
    expect(store().getEdgeCondition('nonexistent')).toBeNull();
  });
});

// ===== getFlowData =====

describe('getFlowData', () => {
  it('converts RFNodes back to FlowNodes', () => {
    store().loadCanvas(testNodes, testEdges);
    const { nodes } = store().getFlowData();
    expect(nodes).toHaveLength(4);
    expect(nodes[0]).toEqual({
      id: 'start-1',
      type: 'start',
      position: { x: 250, y: 50 },
      data: testNodes[0].data,
    });
  });

  it('converts RFEdges back to FlowEdges with conditions from conditionMap', () => {
    store().loadCanvas(testNodes, [
      {
        id: 'e-cond',
        source: 'q-mcq',
        target: 'end-1',
        sourceHandle: null,
        condition: { type: 'contains', value: 'test' },
      },
    ]);
    const { edges } = store().getFlowData();
    expect(edges[0].condition).toEqual({ type: 'contains', value: 'test' });
  });

  it('round-trips correctly: loadCanvas -> getFlowData produces equivalent data', () => {
    // Use simple edges (no branching reconciliation)
    const simpleEdges: FlowEdge[] = [
      { id: 'e-1', source: 'start-1', target: 'q-mcq', sourceHandle: null, condition: null },
    ];
    const simpleNodes = testNodes.filter((n) => n.id !== 'q-yn');
    store().loadCanvas(simpleNodes, simpleEdges);
    const { nodes, edges } = store().getFlowData();
    // Nodes should be equivalent
    expect(nodes).toHaveLength(simpleNodes.length);
    nodes.forEach((n, i) => {
      expect(n.id).toBe(simpleNodes[i].id);
      expect(n.type).toBe(simpleNodes[i].type);
      expect(n.position).toEqual(simpleNodes[i].position);
    });
    // Edges should be equivalent
    expect(edges).toHaveLength(simpleEdges.length);
    expect(edges[0].source).toBe(simpleEdges[0].source);
    expect(edges[0].target).toBe(simpleEdges[0].target);
  });
});

// ===== Flow lock behavior =====

describe('flow lock behavior', () => {
  it('all mutation actions are no-ops when locked', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    const snapshot = { nodes: [...store().nodes], edges: [...store().edges] };

    store().addNode('question', { x: 0, y: 0 });
    store().addQuestionNode('rating', { x: 0, y: 0 });
    store().deleteNode('q-mcq');
    store().updateNodeData('q-mcq', { questionText: 'changed' });
    store().toggleBranching('q-mcq', true);
    store().autoLayout();

    expect(store().nodes.length).toBe(snapshot.nodes.length);
    expect(store().edges.length).toBe(snapshot.edges.length);
  });
});

// ===== Selection =====

describe('selection', () => {
  it('selectNode sets selectedNodeId and opens panel', () => {
    store().selectNode('q-mcq');
    expect(store().selectedNodeId).toBe('q-mcq');
    expect(store().isPanelOpen).toBe(true);
  });

  it('selectNode(null) closes panel', () => {
    store().selectNode('q-mcq');
    store().selectNode(null);
    expect(store().selectedNodeId).toBeNull();
    expect(store().isPanelOpen).toBe(false);
  });

  it('closePanel sets selectedNodeId to null', () => {
    store().selectNode('q-mcq');
    store().closePanel();
    expect(store().selectedNodeId).toBeNull();
    expect(store().isPanelOpen).toBe(false);
  });
});

// ===== Persistence flags =====

describe('persistence flags', () => {
  it('markDirty sets isDirty to true', () => {
    expect(store().isDirty).toBe(false);
    store().markDirty();
    expect(store().isDirty).toBe(true);
  });

  it('markSaved sets isDirty to false and updates lastSavedAt', () => {
    store().markDirty();
    store().markSaved();
    expect(store().isDirty).toBe(false);
    expect(store().lastSavedAt).toBeInstanceOf(Date);
  });

  it('setSaving updates isSaving flag', () => {
    store().setSaving(true);
    expect(store().isSaving).toBe(true);
    store().setSaving(false);
    expect(store().isSaving).toBe(false);
  });
});

// ===== setStatus =====

describe('setStatus', () => {
  it('updates status and isFlowLocked', () => {
    store().setStatus('published');
    expect(store().status).toBe('published');
    expect(store().isFlowLocked).toBe(true);
  });

  it('unlocks flow when set back to draft', () => {
    store().setStatus('published');
    store().setStatus('draft');
    expect(store().isFlowLocked).toBe(false);
  });
});

// ===== updateTitle / updateDescription =====

describe('updateTitle', () => {
  it('updates title and marks dirty', () => {
    store().updateTitle('New Title');
    expect(store().title).toBe('New Title');
    expect(store().isDirty).toBe(true);
  });
});

describe('updateDescription', () => {
  it('updates description and marks dirty', () => {
    store().updateDescription('New Desc');
    expect(store().description).toBe('New Desc');
    expect(store().isDirty).toBe(true);
  });
});

// ===== updateSettings =====

describe('updateSettings', () => {
  it('merges partial settings into existing settings', () => {
    store().setAssessment('a-1', 'T', null, 'draft', null, null, 0, {
      primaryColor: '#000',
      backgroundColor: '#FFF',
      showProgressBar: true,
      allowBackNavigation: true,
      redirectUrl: null,
      redirectDelaySeconds: 3,
      maxResponses: null,
      openAt: null,
      closeAt: null,
      password: null,
      scoringEnabled: false,
      inviteOnly: false,
      fontFamily: 'Geist Sans',
      borderRadius: '12px',
      buttonStyle: 'filled',
      cardStyle: 'bordered',
    });
    store().updateSettings({ primaryColor: '#FF0000' });
    expect(store().settings?.primaryColor).toBe('#FF0000');
    expect(store().settings?.backgroundColor).toBe('#FFF'); // preserved
  });

  it('does nothing when settings is null', () => {
    store().updateSettings({ primaryColor: '#FF0000' });
    expect(store().settings).toBeNull();
  });
});

// ===== autoLayout =====

describe('autoLayout', () => {
  it('applies layout to current nodes', () => {
    store().loadCanvas(testNodes, testEdges);
    store().autoLayout();
    // Just verify it doesn't throw and sets dirty
    expect(store().isDirty).toBe(true);
    expect(store().nodes).toHaveLength(4);
  });

  it('does nothing when isFlowLocked is true', () => {
    store().setAssessment('a-1', 'T', null, 'published');
    store().loadCanvas(testNodes, testEdges);
    const positionsBefore = store().nodes.map((n) => ({ ...n.position }));
    store().autoLayout();
    const positionsAfter = store().nodes.map((n) => ({ ...n.position }));
    expect(positionsAfter).toEqual(positionsBefore);
  });
});

// ===== reset =====

describe('reset', () => {
  it('resets all state to initial values', () => {
    store().setAssessment('a-1', 'T', 'D', 'published');
    store().loadCanvas(testNodes, testEdges);
    store().reset();
    expect(store().assessmentId).toBeNull();
    expect(store().nodes).toHaveLength(0);
    expect(store().edges).toHaveLength(0);
    expect(store().isDirty).toBe(false);
    expect(store().isFlowLocked).toBe(false);
  });
});
