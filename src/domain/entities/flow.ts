/**
 * Flow Domain Entities
 * Represents the visual flow of an assessment (nodes and connections)
 */

// ===========================================
// Node Types
// ===========================================

export type NodeType = 'start' | 'question' | 'end';
export type QuestionType =
  | 'multiple_choice_single'
  | 'multiple_choice_multi'
  | 'short_text'
  | 'long_text'
  | 'rating'
  | 'yes_no';

export interface Position {
  x: number;
  y: number;
}

// ===========================================
// Node Data Types
// ===========================================

export interface StartNodeData {
  title: string;
  description: string;
  buttonText: string;
}

export interface QuestionOption {
  id: string;
  text: string;
  points?: number; // For scoring
}

export interface QuestionNodeData {
  questionType: QuestionType;
  questionText: string;
  description: string | null;
  required: boolean;

  // Multiple choice options
  options?: QuestionOption[];

  // Rating scale
  minValue?: number;
  maxValue?: number;
  minLabel?: string;
  maxLabel?: string;

  // Text fields
  placeholder?: string;
  maxLength?: number;

  // Multi-select constraints
  minSelections?: number;
  maxSelections?: number;

  // Scoring
  points?: number;
  correctAnswer?: string | string[];
}

export interface EndNodeData {
  title: string;
  description: string;
  showScore: boolean;
  redirectUrl: string | null;
}

export type NodeData = StartNodeData | QuestionNodeData | EndNodeData;

// ===========================================
// Flow Node
// ===========================================

export interface FlowNode {
  id: string;
  type: NodeType;
  position: Position;
  data: NodeData;
}

// Type guards for node data
export function isStartNodeData(data: NodeData): data is StartNodeData {
  return 'buttonText' in data;
}

export function isQuestionNodeData(data: NodeData): data is QuestionNodeData {
  return 'questionType' in data;
}

export function isEndNodeData(data: NodeData): data is EndNodeData {
  return 'showScore' in data;
}

// ===========================================
// Edge (Connection) Types
// ===========================================

export type ConditionType =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than';

// Match mode for multi-select questions
export type MatchMode = 'any' | 'all' | 'exactly';

export interface EdgeCondition {
  type: ConditionType;
  value: string | number;
  optionId?: string; // For single-select multiple choice
  optionIds?: string[]; // For multi-select multiple choice
  matchMode?: MatchMode; // How to match multiple selections
}

export interface FlowEdge {
  id: string;
  source: string; // Source node ID
  target: string; // Target node ID
  sourceHandle: string | null; // For multiple outputs
  condition: EdgeCondition | null;
}

// ===========================================
// Factory Functions
// ===========================================

let nodeIdCounter = 0;

export function generateNodeId(type: NodeType): string {
  nodeIdCounter++;
  return `${type}-${Date.now()}-${nodeIdCounter}`;
}

export function generateEdgeId(source: string, target: string): string {
  return `edge-${source}-${target}-${Date.now()}`;
}

export function createStartNode(position: Position): FlowNode {
  return {
    id: generateNodeId('start'),
    type: 'start',
    position,
    data: {
      title: 'Welcome',
      description: 'Thank you for taking this assessment.',
      buttonText: 'Start',
    },
  };
}

export function createQuestionNode(
  position: Position,
  questionType: QuestionType = 'multiple_choice_single'
): FlowNode {
  const baseData: QuestionNodeData = {
    questionType,
    questionText: 'Your question here',
    description: null,
    required: true,
  };

  // Add type-specific defaults
  switch (questionType) {
    case 'multiple_choice_single':
    case 'multiple_choice_multi':
      baseData.options = [
        { id: `opt-${Date.now()}-1`, text: 'Option 1' },
        { id: `opt-${Date.now()}-2`, text: 'Option 2' },
      ];
      break;
    case 'rating':
      baseData.minValue = 1;
      baseData.maxValue = 5;
      baseData.minLabel = 'Poor';
      baseData.maxLabel = 'Excellent';
      break;
    case 'short_text':
      baseData.placeholder = 'Enter your answer...';
      baseData.maxLength = 100;
      break;
    case 'long_text':
      baseData.placeholder = 'Enter your answer...';
      baseData.maxLength = 1000;
      break;
    case 'yes_no':
      baseData.options = [
        { id: `opt-${Date.now()}-yes`, text: 'Yes' },
        { id: `opt-${Date.now()}-no`, text: 'No' },
      ];
      break;
  }

  return {
    id: generateNodeId('question'),
    type: 'question',
    position,
    data: baseData,
  };
}

export function createEndNode(position: Position): FlowNode {
  return {
    id: generateNodeId('end'),
    type: 'end',
    position,
    data: {
      title: 'Thank You!',
      description: 'Your response has been recorded.',
      showScore: false,
      redirectUrl: null,
    },
  };
}

export function createEdge(
  source: string,
  target: string,
  condition: EdgeCondition | null = null
): FlowEdge {
  return {
    id: generateEdgeId(source, target),
    source,
    target,
    sourceHandle: null,
    condition,
  };
}

// ===========================================
// Validation
// ===========================================

export interface FlowValidationError {
  type: 'error' | 'warning';
  nodeId?: string;
  edgeId?: string;
  message: string;
}

export function validateFlow(
  nodes: FlowNode[],
  edges: FlowEdge[]
): FlowValidationError[] {
  const errors: FlowValidationError[] = [];

  // Check for start node
  const startNodes = nodes.filter((n) => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push({ type: 'error', message: 'Assessment must have a start node' });
  } else if (startNodes.length > 1) {
    errors.push({ type: 'error', message: 'Assessment can only have one start node' });
  }

  // Check for end node
  const endNodes = nodes.filter((n) => n.type === 'end');
  if (endNodes.length === 0) {
    errors.push({ type: 'error', message: 'Assessment must have at least one end node' });
  }

  // Check for orphan nodes (not connected)
  const connectedNodeIds = new Set<string>();
  edges.forEach((edge) => {
    connectedNodeIds.add(edge.source);
    connectedNodeIds.add(edge.target);
  });

  nodes.forEach((node) => {
    if (!connectedNodeIds.has(node.id) && nodes.length > 1) {
      errors.push({
        type: 'warning',
        nodeId: node.id,
        message: `Node "${node.type}" is not connected to any other node`,
      });
    }
  });

  // Check for empty question text
  nodes
    .filter((n) => n.type === 'question')
    .forEach((node) => {
      const data = node.data as QuestionNodeData;
      if (!data.questionText || data.questionText.trim() === '') {
        errors.push({
          type: 'error',
          nodeId: node.id,
          message: 'Question text cannot be empty',
        });
      }
    });

  return errors;
}
