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
import type { AssessmentStatus, AssessmentSettings } from '@/domain/entities/assessment';
import {
  createQuestionNode,
  createEndNode,
  generateEdgeId,
} from '@/domain/entities/flow';
import { tidyLayout } from '@/lib/layout';

// Types that get auto-assigned conditions per option (no manual condition editing)
const OPTION_BASED_TYPES = new Set([
  'yes_no',
  'multiple_choice_single',
  'dropdown',
]);

/**
 * For option-based question types, find the next uncovered option
 * and return a condition for it. Returns null if all options are covered
 * or the source node is not option-based.
 */
function getAutoCondition(
  sourceNode: RFNode,
  existingEdges: RFEdge[],
  edgeConditionMap: Record<string, EdgeCondition | null>,
): EdgeCondition | null {
  if (sourceNode.type !== 'question') return null;
  const data = sourceNode.data as QuestionNodeData;
  if (!OPTION_BASED_TYPES.has(data.questionType) || !data.options) return null;

  // Collect option IDs already covered by existing conditional edges from this source
  const coveredOptionIds = new Set<string>();
  for (const edge of existingEdges) {
    if (edge.source !== sourceNode.id) continue;
    const cond = edge.data?.condition ?? edgeConditionMap[edge.id];
    if (cond?.optionId) {
      coveredOptionIds.add(cond.optionId);
    }
  }

  // Find the first uncovered option
  const nextOption = data.options.find((opt) => !coveredOptionIds.has(opt.id));
  if (!nextOption) return null;

  return {
    type: 'equals',
    value: nextOption.text,
    optionId: nextOption.id,
  };
}

/**
 * Check if source node is option-based and all options are covered.
 */
function isAtOptionLimit(
  sourceNode: RFNode,
  existingEdges: RFEdge[],
  edgeConditionMap: Record<string, EdgeCondition | null>,
): boolean {
  if (sourceNode.type !== 'question') return false;
  const data = sourceNode.data as QuestionNodeData;
  if (!OPTION_BASED_TYPES.has(data.questionType) || !data.options) return false;

  const coveredOptionIds = new Set<string>();
  for (const edge of existingEdges) {
    if (edge.source !== sourceNode.id) continue;
    const cond = edge.data?.condition ?? edgeConditionMap[edge.id];
    if (cond?.optionId) {
      coveredOptionIds.add(cond.optionId);
    }
  }

  return data.options.every((opt) => coveredOptionIds.has(opt.id));
}

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
  responseCount: number;
  settings: AssessmentSettings | null;

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

  // Connection menu state
  connectionMenuSourceId: string | null;

  // Derived: true when status is not 'draft' (flow structure is locked)
  isFlowLocked: boolean;

  // Actions
  setAssessment: (
    id: string,
    title: string,
    description: string | null,
    status?: AssessmentStatus,
    publishedAt?: Date | null,
    closeAt?: Date | null,
    responseCount?: number,
    settings?: AssessmentSettings | null
  ) => void;
  setStatus: (status: AssessmentStatus, publishedAt?: Date | null) => void;
  updateTitle: (title: string) => void;
  updateDescription: (description: string | null) => void;
  loadCanvas: (nodes: FlowNode[], edges: FlowEdge[]) => void;

  // Node operations
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection, condition?: EdgeCondition | null) => void;

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

  // Connection menu
  openConnectionMenu: (nodeId: string) => void;
  closeConnectionMenu: () => void;
  addNodeWithEdge: (
    type: 'question' | 'end',
    sourceNodeId: string,
    questionType?: QuestionType,
    condition?: EdgeCondition | null
  ) => void;

  // Settings
  updateSettings: (partial: Partial<AssessmentSettings>) => void;

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
  responseCount: 0,
  settings: null,
  nodes: [],
  edges: [],
  edgeConditionMap: {} as Record<string, EdgeCondition | null>,
  selectedNodeId: null,
  isPanelOpen: false,
  isDirty: false,
  isSaving: false,
  lastSavedAt: null,
  newlyAddedNodeId: null,
  connectionMenuSourceId: null,
  isFlowLocked: false,
};

export const useCanvasStore = create<CanvasState>()(
  devtools(
    subscribeWithSelector(
      temporal(
        (set, get) => ({
          ...initialState,

          setAssessment: (id, title, description, status = 'draft', publishedAt = null, closeAt = null, responseCount = 0, settings = null) => {
            set({
              assessmentId: id,
              title,
              description,
              status,
              publishedAt: publishedAt ? new Date(publishedAt) : null,
              closeAt: closeAt ? new Date(closeAt) : null,
              responseCount,
              settings,
              isFlowLocked: status !== 'draft',
            });
          },

          setStatus: (status, publishedAt = null) => {
            set({
              status,
              publishedAt: publishedAt ? new Date(publishedAt) : null,
              isFlowLocked: status !== 'draft',
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

            // Migration: convert per-option branching edges to conditional edges.
            // Old data used sourceHandle = option.id for per-option routing.
            // New model uses conditional edges with { type: 'equals', value: optionText }.
            for (const node of rfNodes) {
              if (node.type !== 'question') continue;
              const data = node.data as QuestionNodeData;

              // Clear the legacy enableBranching flag
              if (data.enableBranching) {
                (data as unknown as Record<string, unknown>).enableBranching = false;
              }

              // Convert per-option edges to conditional edges
              const optionEdges = rfEdges.filter(
                (e) => e.source === node.id && e.sourceHandle
              );
              if (optionEdges.length > 0 && data.options) {
                for (const edge of optionEdges) {
                  const matchedOption = data.options.find(
                    (opt) => opt.id === edge.sourceHandle
                  );
                  if (matchedOption) {
                    const condition: EdgeCondition = {
                      type: 'equals',
                      value: matchedOption.text,
                      optionId: matchedOption.id,
                    };
                    newConditionMap[edge.id] = condition;
                    edge.data = { ...edge.data, condition };
                  }
                  edge.sourceHandle = null;
                }

                // Deduplicate: if multiple edges from same source→target, keep one with condition
                const seen = new Map<string, number>();
                rfEdges = rfEdges.filter((e, idx) => {
                  if (e.source !== node.id) return true;
                  const key = `${e.source}->${e.target}`;
                  const prevIdx = seen.get(key);
                  if (prevIdx !== undefined) {
                    // Keep the one with a condition, drop the other
                    const prev = rfEdges[prevIdx];
                    if (e.data?.condition && !prev.data?.condition) {
                      // Replace prev with current
                      seen.set(key, idx);
                      return true;
                    }
                    return false;
                  }
                  seen.set(key, idx);
                  return true;
                });
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
            const locked = get().isFlowLocked;
            // When flow is locked, only allow select & dimensions (React Flow internals)
            const filtered = locked
              ? changes.filter((c) => c.type === 'select' || c.type === 'dimensions')
              : changes;
            if (filtered.length === 0) return;
            set((state) => ({
              nodes: applyNodeChanges(filtered, state.nodes),
              ...(locked ? {} : { isDirty: true }),
            }));
          },

          onEdgesChange: (changes) => {
            const locked = get().isFlowLocked;
            const filtered = locked
              ? changes.filter((c) => c.type === 'select')
              : changes;
            if (filtered.length === 0) return;
            set((state) => ({
              edges: applyEdgeChanges(filtered, state.edges),
              ...(locked ? {} : { isDirty: true }),
            }));
          },

          onConnect: (connection, condition) => {
            if (get().isFlowLocked) return;
            const state = get();
            const sourceNode = state.nodes.find((n) => n.id === connection.source);

            let edgeCondition: EdgeCondition | null = null;
            if (condition !== undefined) {
              // Explicit condition from ConnectionMenu (null = else/default)
              edgeCondition = condition;
            } else if (sourceNode) {
              // Auto-assign for drag-to-connect
              if (isAtOptionLimit(sourceNode, state.edges, state.edgeConditionMap)) return;
              edgeCondition = getAutoCondition(sourceNode, state.edges, state.edgeConditionMap);
            }

            const edgeId = generateEdgeId(connection.source!, connection.target!);
            const newEdge = {
              ...connection,
              id: edgeId,
              type: 'conditionEdge',
              style: { strokeWidth: 2 },
              ...(edgeCondition ? { data: { condition: edgeCondition } } : {}),
            };

            set((s) => ({
              edges: addEdge(newEdge, s.edges),
              ...(edgeCondition
                ? { edgeConditionMap: { ...s.edgeConditionMap, [edgeId]: edgeCondition } }
                : {}),
              isDirty: true,
            }));
          },

          addNode: (type, position) => {
            if (get().isFlowLocked) return;
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
            if (get().isFlowLocked) return;
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
            if (get().isFlowLocked) return;
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
            if (get().isFlowLocked) return;
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
            if (get().isFlowLocked) return;
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
            if (get().isFlowLocked) return;
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

          openConnectionMenu: (nodeId) => {
            set({ connectionMenuSourceId: nodeId });
          },

          closeConnectionMenu: () => {
            set({ connectionMenuSourceId: null });
          },

          addNodeWithEdge: (type, sourceNodeId, questionType, condition) => {
            if (get().isFlowLocked) return;
            const state = get();
            const sourceNode = state.nodes.find((n) => n.id === sourceNodeId);
            if (!sourceNode) return;

            // Determine edge condition
            let autoCondition: EdgeCondition | null = null;
            if (condition !== undefined) {
              // Explicit condition from ConnectionMenu (null = else/default)
              autoCondition = condition;
            } else {
              // Auto-assign for backward compat
              if (isAtOptionLimit(sourceNode, state.edges, state.edgeConditionMap)) return;
              autoCondition = getAutoCondition(sourceNode, state.edges, state.edgeConditionMap);
            }

            // Position the new node to the right of the source, avoiding overlaps
            const baseX = sourceNode.position.x + 350;
            const baseY = sourceNode.position.y;
            const NODE_WIDTH = 280;
            const NODE_HEIGHT = 200;

            let position = { x: baseX, y: baseY };
            let attempts = 0;
            while (attempts < 20) {
              const overlaps = state.nodes.some((n) => {
                const dx = Math.abs(n.position.x - position.x);
                const dy = Math.abs(n.position.y - position.y);
                return dx < NODE_WIDTH && dy < NODE_HEIGHT;
              });
              if (!overlaps) break;
              position = { x: baseX, y: position.y + NODE_HEIGHT + 40 };
              attempts++;
            }

            const node =
              type === 'end'
                ? createEndNode(position)
                : questionType
                  ? createQuestionNode(position, questionType)
                  : createQuestionNode(position);
            const rfNode = toRFNode(node);

            const edgeId = generateEdgeId(sourceNodeId, node.id);
            const newEdge: RFEdge = {
              id: edgeId,
              source: sourceNodeId,
              target: node.id,
              sourceHandle: null,
              type: 'conditionEdge',
              style: { strokeWidth: 2 },
              ...(autoCondition ? { data: { condition: autoCondition } } : {}),
            };

            set((s) => ({
              nodes: [...s.nodes, rfNode],
              edges: [...s.edges, newEdge],
              ...(autoCondition
                ? { edgeConditionMap: { ...s.edgeConditionMap, [edgeId]: autoCondition } }
                : {}),
              selectedNodeId: node.id,
              isPanelOpen: true,
              isDirty: true,
              newlyAddedNodeId: node.id,
              connectionMenuSourceId: null,
            }));
          },

          updateSettings: (partial) => {
            set((state) => ({
              settings: state.settings ? { ...state.settings, ...partial } : null,
            }));
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
export const useIsFlowLocked = () => useCanvasStore((s) => s.isFlowLocked);

/** Check if a node's outgoing edges have covered all its options (for option-based types). */
export const useIsNodeAtOptionLimit = (nodeId: string): boolean => {
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const edgeConditionMap = useCanvasStore((s) => s.edgeConditionMap);
  const node = nodes.find((n) => n.id === nodeId);
  if (!node) return false;
  return isAtOptionLimit(node, edges, edgeConditionMap);
};

export { OPTION_BASED_TYPES };
