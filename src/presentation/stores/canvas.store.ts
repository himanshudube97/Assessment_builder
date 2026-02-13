/**
 * Canvas Store
 * Manages the state of the visual flow editor
 * Includes undo/redo via zundo temporal middleware
 */

import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';
import { temporal } from 'zundo';
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
import type { FlowNode, FlowEdge, QuestionType, EdgeCondition, QuestionNodeData } from '@/domain/entities/flow';
import type { AssessmentStatus } from '@/domain/entities/assessment';
import {
  createQuestionNode,
  createEndNode,
  generateEdgeId,
} from '@/domain/entities/flow';
import { tidyLayout } from '@/lib/layout';

// Throttle utility for undo history recording
function throttle<T extends unknown[]>(
  fn: (...args: T) => void,
  wait: number
): (...args: T) => void {
  let lastTime = 0;
  return (...args: T) => {
    const now = Date.now();
    if (now - lastTime >= wait) {
      lastTime = now;
      fn(...args);
    }
  };
}

// Convert domain types to React Flow types
type RFNode = Node<FlowNode['data']>;
type RFEdge = Edge;

interface CanvasState {
  // Assessment data
  assessmentId: string | null;
  title: string;
  description: string | null;
  status: AssessmentStatus;
  publishedAt: Date | null;
  closeAt: Date | null;

  // Canvas data
  nodes: RFNode[];
  edges: RFEdge[];
  edgeConditionMap: Record<string, EdgeCondition | null>;

  // UI state
  selectedNodeId: string | null;
  isPanelOpen: boolean;
  isDirty: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;

  // New node spotlight mode
  newlyAddedNodeId: string | null;

  // Signal to FlowCanvas that a node's handles changed and React Flow
  // needs to recalculate handle positions via updateNodeInternals()
  nodeToUpdateInternals: string | null;

  // Actions
  setAssessment: (
    id: string,
    title: string,
    description: string | null,
    status?: AssessmentStatus,
    publishedAt?: Date | null,
    closeAt?: Date | null
  ) => void;
  setStatus: (status: AssessmentStatus, publishedAt?: Date | null) => void;
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

  // Branching toggle (migrates edges when switching)
  toggleBranching: (nodeId: string, enable: boolean) => void;
  canDisableBranching: (nodeId: string) => boolean;

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

  // Handle internals update
  clearNodeToUpdateInternals: () => void;

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
function toFlowEdge(edge: RFEdge, conditionMap: Record<string, EdgeCondition | null>): FlowEdge {
  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle || null,
    condition: conditionMap[edge.id] || null,
  };
}

const initialState = {
  assessmentId: null,
  title: '',
  description: null,
  status: 'draft' as AssessmentStatus,
  publishedAt: null,
  closeAt: null,
  nodes: [],
  edges: [],
  edgeConditionMap: {} as Record<string, EdgeCondition | null>,
  selectedNodeId: null,
  isPanelOpen: false,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  newlyAddedNodeId: null,
  nodeToUpdateInternals: null,
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    subscribeWithSelector(
      temporal(
        (set, get) => ({
          ...initialState,

          setAssessment: (id, title, description, status = 'draft', publishedAt = null, closeAt = null) => {
            set({
              assessmentId: id,
              title,
              description,
              status,
              publishedAt: publishedAt ? new Date(publishedAt) : null,
              closeAt: closeAt ? new Date(closeAt) : null,
            });
          },

          setStatus: (status, publishedAt = null) => {
            set({
              status,
              publishedAt: publishedAt ? new Date(publishedAt) : null,
            });
          },

          updateTitle: (title) => {
            set({ title, isDirty: true });
          },

          updateDescription: (description) => {
            set({ description, isDirty: true });
          },

          loadCanvas: (nodes, edges) => {
            const rfNodes = nodes.map(toRFNode);
            let rfEdges = edges.map(toRFEdge);

            // Build edge condition map from loaded edges
            const newConditionMap: Record<string, EdgeCondition | null> = {};
            for (const edge of edges) {
              if (edge.condition) {
                newConditionMap[edge.id] = edge.condition;
              }
            }

            // Reconcile: if a node has branching enabled but edges still point to
            // the bottom handle (sourceHandle: null), migrate them to the first option.
            // This fixes data saved before the atomic-toggle fix.
            for (const node of rfNodes) {
              if (node.type !== 'question') continue;
              const data = node.data as QuestionNodeData;
              const hasBranching =
                data.questionType === 'yes_no' ||
                (data.questionType === 'multiple_choice_single' && data.enableBranching);
              if (hasBranching && data.options?.length) {
                const firstOptId = data.options[0].id;
                rfEdges = rfEdges.map((e) =>
                  e.source === node.id && !e.sourceHandle
                    ? { ...e, sourceHandle: firstOptId }
                    : e
                );
              }
            }

            set({
              nodes: rfNodes,
              edges: rfEdges,
              edgeConditionMap: newConditionMap,
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
                  type: 'conditionEdge',
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
            set((state) => ({
              edgeConditionMap: { ...state.edgeConditionMap, [edgeId]: condition },
              edges: state.edges.map((edge) =>
                edge.id === edgeId
                  ? { ...edge, data: { ...edge.data, condition } }
                  : edge
              ),
              isDirty: true,
            }));
          },

          getEdgeCondition: (edgeId) => {
            return get().edgeConditionMap[edgeId] || null;
          },

          toggleBranching: (nodeId, enable) => {
            const state = get();
            const node = state.nodes.find((n) => n.id === nodeId);
            if (!node) return;

            const nodeData = node.data as QuestionNodeData;
            const firstOptionId = nodeData.options?.[0]?.id ?? null;

            // Clone condition map so remakeEdge can mutate it locally
            const conditionMap = { ...state.edgeConditionMap };

            // Helper: recreate an edge with a new ID so React Flow re-routes it
            const remakeEdge = (e: RFEdge, newSourceHandle: string | null): RFEdge => {
              const newId = generateEdgeId(e.source, e.target);
              // Migrate any stored condition to the new edge ID
              const condition = conditionMap[e.id];
              if (condition) {
                conditionMap[newId] = condition;
                delete conditionMap[e.id];
              }
              return {
                ...e,
                id: newId,
                sourceHandle: newSourceHandle,
                data: { ...e.data, condition: condition ?? null },
              };
            };

            if (enable && firstOptionId) {
              // Atomic update: enable branching on node AND migrate edges in one render cycle
              set((s) => ({
                nodes: s.nodes.map((n) =>
                  n.id === nodeId
                    ? { ...n, data: { ...n.data, enableBranching: true } as RFNode['data'] }
                    : n
                ),
                edges: s.edges.map((e) =>
                  e.source === nodeId && !e.sourceHandle
                    ? remakeEdge(e, firstOptionId)
                    : e
                ),
                edgeConditionMap: conditionMap,
                isDirty: true,
                nodeToUpdateInternals: nodeId,
              }));
            } else if (!enable) {
              // Atomic update: disable branching on node AND migrate edges in one render cycle
              const seen = new Set<string>();
              set((s) => ({
                nodes: s.nodes.map((n) =>
                  n.id === nodeId
                    ? { ...n, data: { ...n.data, enableBranching: false } as RFNode['data'] }
                    : n
                ),
                edges: s.edges.reduce<RFEdge[]>((acc, e) => {
                  if (e.source === nodeId && e.sourceHandle) {
                    if (!seen.has(e.target)) {
                      seen.add(e.target);
                      acc.push(remakeEdge(e, null));
                    }
                  } else {
                    acc.push(e);
                  }
                  return acc;
                }, []),
                edgeConditionMap: conditionMap,
                isDirty: true,
                nodeToUpdateInternals: nodeId,
              }));
            }
          },

          canDisableBranching: (nodeId) => {
            const state = get();
            // Count how many distinct targets are connected from per-option handles
            const branchEdges = state.edges.filter(
              (e) => e.source === nodeId && e.sourceHandle
            );
            const uniqueTargets = new Set(branchEdges.map((e) => e.target));
            // Allow disable only if 0 or 1 unique target (safe to collapse)
            return uniqueTargets.size <= 1;
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
              edges: state.edges.map((e) => toFlowEdge(e, state.edgeConditionMap)),
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

          clearNodeToUpdateInternals: () => {
            set({ nodeToUpdateInternals: null });
          },

          reset: () => set(initialState),
        }),
        {
          // Only track essential canvas data — strip React Flow volatile
          // properties (selected, dragging, measured) that change on every
          // click/hover and would pollute the undo history.
          partialize: (state) => ({
            nodes: state.nodes.map(({ id, type, position, data }) => ({ id, type, position, data })),
            edges: state.edges.map(({ id, source, target, sourceHandle, data }) => ({ id, source, target, sourceHandle, data })),
            edgeConditionMap: state.edgeConditionMap,
          }),
          // Skip history entry when partialized state hasn't actually changed
          // (e.g. selection-only changes, save flag updates, markDirty calls)
          equality: (pastState, currentState) =>
            JSON.stringify(pastState) === JSON.stringify(currentState),
          // Cap history at 50 states
          limit: 50,
          // Throttle history recording to coalesce rapid changes (e.g. node dragging)
          handleSet: (handleSet) =>
            throttle((...args: Parameters<typeof handleSet>) => {
              handleSet(...args);
            }, 500),
        }
      )
    ),
    { name: 'canvas-store' }
  )
);

// Undo/redo helpers — mark dirty so auto-save picks up the change
export const canvasUndo = () => {
  useCanvasStore.temporal.getState().undo();
  useCanvasStore.getState().markDirty();
};
export const canvasRedo = () => {
  useCanvasStore.temporal.getState().redo();
  useCanvasStore.getState().markDirty();
};
export const canvasClearHistory = () => useCanvasStore.temporal.getState().clear();

// Selector hooks for performance
export const useSelectedNode = () => {
  const nodes = useCanvasStore((s) => s.nodes);
  const selectedNodeId = useCanvasStore((s) => s.selectedNodeId);
  return nodes.find((n) => n.id === selectedNodeId) || null;
};

export const useIsDirty = () => useCanvasStore((s) => s.isDirty);
export const useIsSaving = () => useCanvasStore((s) => s.isSaving);
