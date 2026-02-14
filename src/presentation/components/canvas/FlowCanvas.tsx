'use client';

/**
 * FlowCanvas Component
 * The main React Flow canvas for the visual editor
 */

import { useCallback, useRef, useMemo, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import ReactFlow, {
  Background,
  Controls,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  useUpdateNodeInternals,
  type Edge,
  type Connection,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LayoutGrid, Undo2, Redo2, Search, ArrowRight, ArrowDown, Plus, Flag, ChevronUp, ChevronDown, Rows3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useCanvasStore, canvasUndo, canvasRedo, OPTION_BASED_TYPES } from '@/presentation/stores/canvas.store';
import { StartNode } from './StartNode';
import { QuestionNode } from './QuestionNode';
import { EndNode } from './EndNode';
import { EdgeWithCondition } from './EdgeWithCondition';
import { CanvasSearch } from './CanvasSearch';
import { QUESTION_TYPES_LIST } from '@/domain/constants/questionTypes';
import type { QuestionType, EdgeCondition } from '@/domain/entities/flow';

// Custom node types
const nodeTypes = {
  start: StartNode,
  question: QuestionNode,
  end: EndNode,
};

// Custom edge types
const edgeTypes = {
  conditionEdge: EdgeWithCondition,
};

type Spacing = 'compact' | 'comfortable' | 'spacious';

const SPACING_OPTIONS: { value: Spacing; label: string; description: string }[] = [
  { value: 'compact', label: 'Compact', description: 'Balanced spacing' },
  { value: 'comfortable', label: 'Comfortable', description: 'Generous breathing room' },
  { value: 'spacious', label: 'Spacious', description: 'Maximum space' },
];

function SpacingDropdown({ onSelect }: { onSelect: (spacing: Spacing) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm',
          open && 'ring-2 ring-primary',
        )}
        title="Auto-arrange with spacing"
      >
        <Rows3 className="h-4 w-4" />
        Spacing
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-1 w-52 rounded-xl bg-card border border-border/60 shadow-2xl ring-1 ring-black/5 overflow-hidden z-50"
          >
            <div className="p-1">
              {SPACING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onSelect(opt.value); setOpen(false); }}
                  className="w-full flex flex-col px-3 py-2 rounded-lg text-left hover:bg-muted transition-colors"
                >
                  <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground">{opt.description}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FlowCanvasInner() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project, fitView } = useReactFlow();
  const updateNodeInternals = useUpdateNodeInternals();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const updateEdgeCondition = useCanvasStore((s) => s.updateEdgeCondition);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const fullLayout = useCanvasStore((s) => s.fullLayout);
  const layoutDirection = useCanvasStore((s) => s.layoutDirection);
  const setLayoutDirection = useCanvasStore((s) => s.setLayoutDirection);
  const addQuestionNode = useCanvasStore((s) => s.addQuestionNode);
  const addNode = useCanvasStore((s) => s.addNode);
  const newlyAddedNodeId = useCanvasStore((s) => s.newlyAddedNodeId);
  const clearNewlyAddedNode = useCanvasStore((s) => s.clearNewlyAddedNode);
  const isFlowLocked = useCanvasStore((s) => s.isFlowLocked);

  // Reactive undo/redo state
  const canUndo = useStore(useCanvasStore.temporal, (s) => s.pastStates.length > 0);
  const canRedo = useStore(useCanvasStore.temporal, (s) => s.futureStates.length > 0);

  // Ctrl+F to toggle search
  useEffect(() => {
    const handleSearchKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', handleSearchKey);
    return () => window.removeEventListener('keydown', handleSearchKey);
  }, []);

  // Auto-dismiss node highlight after a short delay
  useEffect(() => {
    if (newlyAddedNodeId) {
      const timer = setTimeout(() => {
        clearNewlyAddedNode();
      }, 2000); // Auto-dismiss after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [newlyAddedNodeId, clearNewlyAddedNode]);

  const onEdgesChangeStore = useCanvasStore((s) => s.onEdgesChange);

  // Add condition change handler + context to edges
  const edgesWithHandlers = useMemo(() => {
    return edges.map((edge) => {
      // Find source node type and question type
      const sourceNode = nodes.find((n) => n.id === edge.source);
      const sourceNodeType = sourceNode?.type as string | undefined;
      const sourceQuestionType = (sourceNode?.data as { questionType?: string } | undefined)?.questionType;
      const isOptionBasedSource = !!(sourceQuestionType && OPTION_BASED_TYPES.has(sourceQuestionType))
        || sourceQuestionType === 'multiple_choice_multi';

      // Count sibling edges (other edges from same source)
      const siblingEdges = edges.filter((e) => e.source === edge.source);
      const hasSiblingConditions = siblingEdges.some(
        (e) => e.id !== edge.id && e.data?.condition != null
      );

      return {
        ...edge,
        type: 'conditionEdge',
        data: {
          ...edge.data,
          sourceNodeType,
          hasSiblingConditions,
          isOptionBased: isOptionBasedSource,
          onConditionChange: (condition: EdgeCondition | null) => {
            updateEdgeCondition(edge.id, condition);
          },
          onDelete: () => {
            onEdgesChangeStore([{ id: edge.id, type: 'remove' as const }]);
          },
        },
      };
    });
  }, [edges, nodes, updateEdgeCondition, onEdgesChangeStore]);

  const onPaneClick = useCallback(() => {
    selectNode(null);
    setIsAddMenuOpen(false);
    // Also dismiss spotlight when clicking on pane
    if (newlyAddedNodeId) {
      clearNewlyAddedNode();
    }
  }, [selectNode, newlyAddedNodeId, clearNewlyAddedNode]);

  // Handle node click - dismiss spotlight
  const handleNodeClick = useCallback(() => {
    if (newlyAddedNodeId) {
      clearNewlyAddedNode();
    }
  }, [newlyAddedNodeId, clearNewlyAddedNode]);

  // Allow dragging edge endpoints to reconnect them (e.g. from Option A to Option B)
  const edgeReconnectSuccessful = useRef(true);

  const onReconnectStart = useCallback(() => {
    edgeReconnectSuccessful.current = false;
  }, []);

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => {
      edgeReconnectSuccessful.current = true;
      onEdgesChange(
        // Remove the old edge, then add the reconnected one via onConnect
        [{ id: oldEdge.id, type: 'remove' as const }]
      );
      onConnect(newConnection);
    },
    [onEdgesChange, onConnect]
  );

  const onReconnectEnd = useCallback(
    (_: MouseEvent | TouchEvent, edge: Edge) => {
      // If reconnect was not successful (dropped on empty space), remove the edge
      if (!edgeReconnectSuccessful.current) {
        onEdgesChange([{ id: edge.id, type: 'remove' as const }]);
      }
      edgeReconnectSuccessful.current = true;
    },
    [onEdgesChange]
  );

  // Add freestanding node at the center of the current viewport
  const handleAddFreestandingNode = useCallback(
    (type: 'question' | 'end', questionType?: QuestionType) => {
      if (!reactFlowWrapper.current) return;
      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: bounds.width / 2 - 140, // half of node width
        y: bounds.height / 2 - 90, // half of node height
      });

      if (type === 'question' && questionType) {
        addQuestionNode(questionType, position);
      } else {
        addNode(type, position);
      }
      setIsAddMenuOpen(false);
    },
    [project, addQuestionNode, addNode]
  );

  // Toolbar button class
  const toolbarBtnClass = 'flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm';
  const toolbarBtnDisabled = 'disabled:opacity-40 disabled:cursor-not-allowed';

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full relative">
      {/* SVG Arrow Markers for edges - Improved styling */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Default arrow - subtle gray */}
          <marker
            id="arrow-default"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#CBD5E1" />
          </marker>
          {/* Selected arrow - indigo */}
          <marker
            id="arrow-selected"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#6366F1" />
          </marker>
          {/* Condition arrow - violet */}
          <marker
            id="arrow-condition"
            viewBox="0 0 12 12"
            refX="10"
            refY="6"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#8B5CF6" />
          </marker>
          {/* Gradient for animated flow */}
          <linearGradient id="flow-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0" />
            <stop offset="50%" stopColor="#6366F1" stopOpacity="1" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0" />
          </linearGradient>
        </defs>
      </svg>
      <ReactFlow
        nodes={nodes}
        edges={edgesWithHandlers}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={isFlowLocked ? undefined : onConnect}
        onReconnect={isFlowLocked ? undefined : onReconnect}
        onReconnectStart={isFlowLocked ? undefined : onReconnectStart}
        onReconnectEnd={isFlowLocked ? undefined : onReconnectEnd}
        edgesUpdatable={!isFlowLocked}
        nodesDraggable={!isFlowLocked}
        nodesConnectable={!isFlowLocked}
        elementsSelectable
        onPaneClick={onPaneClick}
        onNodeClick={handleNodeClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        defaultEdgeOptions={{
          type: 'conditionEdge',
          style: { strokeWidth: 2 },
        }}
        connectionLineStyle={{ strokeWidth: 2 }}
        snapToGrid
        snapGrid={[20, 20]}
        minZoom={0.25}
        maxZoom={2}
        attributionPosition="bottom-left"
      >
        <Background gap={20} size={1} />
        <Controls
          className="!bg-card !border-border !shadow-md"
          showInteractive={false}
        />
        {/* Search panel */}
        <Panel position="top-center">
          <CanvasSearch
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        </Panel>

        {/* Toolbar */}
        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={() => setIsSearchOpen((v) => !v)}
            className={cn(toolbarBtnClass, isSearchOpen && 'ring-2 ring-primary')}
            title="Search (Ctrl+F)"
          >
            <Search className="h-4 w-4" />
          </button>
        {!isFlowLocked && (
          <>
            <button
              onClick={canvasUndo}
              disabled={!canUndo}
              className={cn(toolbarBtnClass, toolbarBtnDisabled)}
              title="Undo (Ctrl+Z)"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              onClick={canvasRedo}
              disabled={!canRedo}
              className={cn(toolbarBtnClass, toolbarBtnDisabled)}
              title="Redo (Ctrl+Shift+Z)"
            >
              <Redo2 className="h-4 w-4" />
            </button>
            <button
              onClick={autoLayout}
              className={toolbarBtnClass}
              title="Clean up overlaps and align to grid"
            >
              <LayoutGrid className="h-4 w-4" />
              Tidy Up
            </button>
            <SpacingDropdown onSelect={(spacing) => fullLayout(undefined, spacing)} />
            {/* H/V direction toggle */}
            <div className="flex rounded-lg border border-border bg-card shadow-sm overflow-hidden">
              <button
                onClick={() => {
                  setLayoutDirection('LR');
                  setTimeout(() => {
                    nodes.forEach(n => updateNodeInternals(n.id));
                    fitView({ padding: 0.2, duration: 300 });
                  }, 100);
                }}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-2 text-sm font-medium transition-colors',
                  layoutDirection === 'LR'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
                title="Horizontal layout (Left to Right)"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setLayoutDirection('TB');
                  setTimeout(() => {
                    nodes.forEach(n => updateNodeInternals(n.id));
                    fitView({ padding: 0.2, duration: 300 });
                  }, 100);
                }}
                className={cn(
                  'flex items-center gap-1 px-2.5 py-2 text-sm font-medium transition-colors',
                  layoutDirection === 'TB'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted'
                )}
                title="Vertical layout (Top to Bottom)"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
        </Panel>

        {/* Floating "Add Question" button — bottom-left */}
        {!isFlowLocked && (
          <Panel position="bottom-left" className="!ml-14 !mb-2">
            <div className="relative">
              <AnimatePresence>
                {isAddMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-64 rounded-xl bg-card border border-border shadow-xl overflow-hidden"
                  >
                    <div className="px-3 pt-3 pb-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Question type
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto px-1.5 pb-1.5">
                      {QUESTION_TYPES_LIST.map(([type, meta]) => {
                        const Icon = meta.icon;
                        return (
                          <button
                            key={type}
                            onClick={() => handleAddFreestandingNode('question', type)}
                            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left hover:bg-muted transition-colors"
                          >
                            <span className={cn('flex-shrink-0', meta.color)}><Icon className="h-4 w-4" /></span>
                            <div className="flex-1 min-w-0">
                              <span className="text-foreground">{meta.label}</span>
                              <span className="text-xs text-muted-foreground ml-2">{meta.description}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-border p-1.5">
                      <button
                        onClick={() => handleAddFreestandingNode('end')}
                        className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left hover:bg-muted transition-colors"
                      >
                        <Flag className="h-4 w-4 text-violet-500 flex-shrink-0" />
                        <span className="text-foreground">End Screen</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setIsAddMenuOpen((v) => !v)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg transition-all',
                  'bg-primary text-primary-foreground hover:bg-primary/90',
                  'border border-primary/20',
                  isAddMenuOpen && 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                )}
              >
                {isAddMenuOpen ? <ChevronUp className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                <span className="text-sm font-medium">Add Question</span>
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>

    </div>
  );
}

export function FlowCanvas() {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner />
    </ReactFlowProvider>
  );
}
