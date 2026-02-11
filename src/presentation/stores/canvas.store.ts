/**
 * Canvas Store
 * Manages the state of the visual flow editor
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
} from 'reactflow';
import type { FlowNode, FlowEdge, QuestionType, EdgeCondition } from '@/domain/entities/flow';
import {
  createQuestionNode,
  createEndNode,
  generateEdgeId,
} from '@/domain/entities/flow';
import { tidyLayout } from '@/lib/layout';

// Store edge conditions separately (React Flow doesn't handle complex data well)
const edgeConditions = new Map<string, EdgeCondition | null>();

// Convert domain types to React Flow types
type RFNode = Node<FlowNode['data']>;
type RFEdge = Edge;

interface CanvasState {
  // Assessment data
  assessmentId: string | null;
  title: string;
  description: string | null;

  // Canvas data
  nodes: RFNode[];
  edges: RFEdge[];

  // UI state
  selectedNodeId: string | null;
  isPanelOpen: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;

  // New node spotlight mode
  newlyAddedNodeId: string | null;

  // Actions
  setAssessment: (id: string, title: string, description: string | null) => void;
  updateTitle: (title: string) => void;
  updateDescription: (description: string | null) => void;
  loadCanvas: (nodes: FlowNode[], edges: FlowEdge[]) => void;

  // Node operations
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  addNode: (type: 'question' | 'end', position: { x: number; y: number }) => void;
  addQuestionNode: (
    questionType: QuestionType,
    position: { x: number; y: number }
  ) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNode['data']>) => void;
  deleteNode: (nodeId: string) => void;

  // Edge operations
  updateEdgeCondition: (edgeId: string, condition: EdgeCondition | null) => void;
  getEdgeCondition: (edgeId: string) => EdgeCondition | null;

  // Selection
  selectNode: (nodeId: string | null) => void;
  openPanel: () => void;
  closePanel: () => void;

  // Persistence
  markDirty: () => void;
  markSaved: () => void;
  setSaving: (saving: boolean) => void;

  // Get data for saving
  getFlowData: () => { nodes: FlowNode[]; edges: FlowEdge[] };

  // Layout
  autoLayout: () => void;

  // Spotlight mode
  clearNewlyAddedNode: () => void;

  // Reset
  reset: () => void;
}

// Convert React Flow node to domain FlowNode
function toFlowNode(node: RFNode): FlowNode {
  return {
    id: node.id,
    type: node.type as FlowNode['type'],
    position: node.position,
    data: node.data,
  };
}

// Convert domain FlowNode to React Flow node
function toRFNode(node: FlowNode): RFNode {
  return {
    id: node.id,
    type: node.type,
    position: node.position,
    data: node.data,
    // No dragHandle restriction - nodes can be dragged from anywhere
    // Interactive elements use 'nodrag' class to prevent drag conflicts
  };
}

// Convert domain FlowEdge to React Flow edge
function toRFEdge(edge: FlowEdge): RFEdge {
  // Store condition in our map
  if (edge.condition) {
    edgeConditions.set(edge.id, edge.condition);
  }
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    type: 'conditionEdge', // Use custom edge type
    animated: false,
    style: { strokeWidth: 2 },
    data: { condition: edge.condition },
  };
}

// Convert React Flow edge to domain FlowEdge
function toFlowEdge(edge: RFEdge): FlowEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || null,
    condition: edgeConditions.get(edge.id) || null,
  };
}

const initialState = {
  assessmentId: null,
  title: '',
  description: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  isPanelOpen: false,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  newlyAddedNodeId: null,
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      ...initialState,

      setAssessment: (id, title, description) => {
        set({ assessmentId: id, title, description });
      },

      updateTitle: (title) => {
        set({ title, isDirty: true });
      },

      updateDescription: (description) => {
        set({ description, isDirty: true });
      },

      loadCanvas: (nodes, edges) => {
        set({
          nodes: nodes.map(toRFNode),
          edges: edges.map(toRFEdge),
          isDirty: false,
        });
      },

      onNodesChange: (changes) => {
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes),
          isDirty: true,
        }));
      },

      onEdgesChange: (changes) => {
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
          isDirty: true,
        }));
      },

      onConnect: (connection) => {
        set((state) => ({
          edges: addEdge(
            {
              ...connection,
              id: generateEdgeId(connection.source!, connection.target!),
              type: 'smoothstep',
              style: { strokeWidth: 2 },
            },
            state.edges
          ),
          isDirty: true,
        }));
      },

      addNode: (type, position) => {
        const node =
          type === 'end'
            ? createEndNode(position)
            : createQuestionNode(position);
        const rfNode = toRFNode(node);

        set((state) => ({
          nodes: [...state.nodes, rfNode],
          selectedNodeId: node.id,
          isPanelOpen: true,
          isDirty: true,
          newlyAddedNodeId: node.id,
        }));
      },

      addQuestionNode: (questionType, position) => {
        const node = createQuestionNode(position, questionType);
        const rfNode = toRFNode(node);

        set((state) => ({
          nodes: [...state.nodes, rfNode],
          selectedNodeId: node.id,
          isPanelOpen: true,
          isDirty: true,
          newlyAddedNodeId: node.id,
        }));
      },

      updateNodeData: (nodeId, data) => {
        set((state) => ({
          nodes: state.nodes.map((node) =>
            node.id === nodeId
              ? { ...node, data: { ...node.data, ...data } as RFNode['data'] }
              : node
          ),
          isDirty: true,
        }));
      },

      deleteNode: (nodeId) => {
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
          selectedNodeId:
            state.selectedNodeId === nodeId ? null : state.selectedNodeId,
          isPanelOpen: state.selectedNodeId === nodeId ? false : state.isPanelOpen,
          isDirty: true,
        }));
      },

      updateEdgeCondition: (edgeId, condition) => {
        edgeConditions.set(edgeId, condition);
        set((state) => ({
          edges: state.edges.map((edge) =>
            edge.id === edgeId
              ? { ...edge, data: { ...edge.data, condition } }
              : edge
          ),
          isDirty: true,
        }));
      },

      getEdgeCondition: (edgeId) => {
        return edgeConditions.get(edgeId) || null;
      },

      selectNode: (nodeId) => {
        set({
          selectedNodeId: nodeId,
          isPanelOpen: nodeId !== null,
        });
      },

      openPanel: () => set({ isPanelOpen: true }),
      closePanel: () => set({ isPanelOpen: false, selectedNodeId: null }),

      markDirty: () => set({ isDirty: true }),
      markSaved: () => set({ isDirty: false, lastSavedAt: new Date() }),
      setSaving: (saving) => set({ isSaving: saving }),

      getFlowData: () => {
        const state = get();
        return {
          nodes: state.nodes.map(toFlowNode),
          edges: state.edges.map(toFlowEdge),
        };
      },

      autoLayout: () => {
        const state = get();
        const tidiedNodes = tidyLayout(state.nodes, {
          nodeWidth: 280,
          nodeHeight: 180,
          minGapX: 40,
          minGapY: 40,
          gridSize: 20,
        });
        set({ nodes: tidiedNodes, isDirty: true });
      },

      clearNewlyAddedNode: () => {
        set({ newlyAddedNodeId: null });
      },

      reset: () => set(initialState),
    })),
    { name: 'canvas-store' }
  )
);

// Selector hooks for performance
export const useSelectedNode = () => {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  return nodes.find((n) => n.id === selectedNodeId) || null;
};

export const useIsDirty = () => useCanvasStore((s) => s.isDirty);
export const useIsSaving = () => useCanvasStore((s) => s.isSaving);
