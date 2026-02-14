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
  type Node as RFNode,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LayoutGrid, Undo2, Redo2, Search, ArrowRight, ArrowDown, Plus, Flag, ChevronDown, Rows3, HelpCircle, GitBranch, Workflow } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

import { useCanvasStore, canvasUndo, canvasRedo, OPTION_BASED_TYPES } from '@/presentation/stores/canvas.store';
import { useFlowTour } from '@/presentation/hooks/useFlowTour';
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

type EdgeType = 'bezier' | 'smoothstep' | 'step' | 'straight';

const EDGE_TYPE_OPTIONS: { value: EdgeType; label: string; description: string }[] = [
  { value: 'bezier', label: 'Bezier', description: 'Flowing curved paths' },
  { value: 'smoothstep', label: 'Smooth Step', description: 'Rounded orthogonal' },
  { value: 'step', label: 'Step', description: 'Sharp orthogonal' },
  { value: 'straight', label: 'Straight', description: 'Direct diagonal lines' },
];

type BranchMode = 'all' | 'full' | 'downstream' | 'upstream';

const BRANCH_MODE_OPTIONS: { value: BranchMode; label: string; description: string }[] = [
  { value: 'all', label: 'All', description: 'Show all nodes' },
  { value: 'full', label: 'Full Branch', description: 'Show entire flow path' },
  { value: 'downstream', label: 'Downstream', description: 'Show what comes after' },
  { value: 'upstream', label: 'Upstream', description: 'Show what comes before' },
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
          'flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 text-sm font-semibold text-foreground hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 shadow-sm hover:scale-[1.02]',
          open && 'ring-2 ring-primary/40 shadow-md scale-[1.02]',
        )}
        title="Auto-arrange with spacing"
      >
        <Rows3 className="h-4 w-4" />
        Spacing
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/5 overflow-hidden z-50"
          >
            <div className="p-1.5">
              {SPACING_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onSelect(opt.value); setOpen(false); }}
                  className="w-full flex flex-col px-3 py-2.5 rounded-xl text-left hover:bg-muted/80 transition-all duration-200 hover:scale-[1.02] group"
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function EdgeTypeDropdown({ onSelect, current }: { onSelect: (type: EdgeType) => void; current: EdgeType }) {
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

  const currentOption = EDGE_TYPE_OPTIONS.find(opt => opt.value === current);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 text-sm font-semibold text-foreground hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 shadow-sm hover:scale-[1.02]',
          open && 'ring-2 ring-primary/40 shadow-md scale-[1.02]',
        )}
        title="Edge style"
      >
        <GitBranch className="h-4 w-4" />
        {currentOption?.label}
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/5 overflow-hidden z-50"
          >
            <div className="p-1.5">
              {EDGE_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onSelect(opt.value); setOpen(false); }}
                  className={cn(
                    'w-full flex flex-col px-3 py-2.5 rounded-xl text-left hover:bg-muted/80 transition-all duration-200 hover:scale-[1.02] group',
                    current === opt.value && 'bg-primary/10 border border-primary/20'
                  )}
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BranchModeDropdown({ onSelect, current }: { onSelect: (mode: BranchMode) => void; current: BranchMode }) {
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
          'flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 text-sm font-semibold text-foreground hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 shadow-sm hover:scale-[1.02]',
          open && 'ring-2 ring-primary/40 shadow-md scale-[1.02]',
        )}
        title="Highlight mode (click a node to highlight)"
      >
        <Workflow className="h-4 w-4" />
        Highlight
        <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-[0_8px_32px_rgba(0,0,0,0.12)] ring-1 ring-black/5 overflow-hidden z-50"
          >
            <div className="p-1.5">
              {BRANCH_MODE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => { onSelect(opt.value); setOpen(false); }}
                  className={cn(
                    'w-full flex flex-col px-3 py-2.5 rounded-xl text-left hover:bg-muted/80 transition-all duration-200 hover:scale-[1.02] group',
                    current === opt.value && 'bg-primary/10 border border-primary/20'
                  )}
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{opt.label}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</span>
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

  // Tour integration
  const { startTour, hasCompletedTour, isReady } = useFlowTour();

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
  const edgeType = useCanvasStore((s) => s.edgeType);
  const setEdgeType = useCanvasStore((s) => s.setEdgeType);
  const addQuestionNode = useCanvasStore((s) => s.addQuestionNode);
  const addNode = useCanvasStore((s) => s.addNode);
  const newlyAddedNodeId = useCanvasStore((s) => s.newlyAddedNodeId);
  const clearNewlyAddedNode = useCanvasStore((s) => s.clearNewlyAddedNode);
  const isFlowLocked = useCanvasStore((s) => s.isFlowLocked);
  const setBranchHighlight = useCanvasStore((s) => s.setBranchHighlight);
  const clearBranchHighlight = useCanvasStore((s) => s.clearBranchHighlight);
  const branchHighlightMode = useCanvasStore((s) => s.branchHighlightMode);
  const setBranchHighlightMode = useCanvasStore((s) => s.setBranchHighlightMode);

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

  // Auto-start tour for first-time users
  useEffect(() => {
    if (isReady && !hasCompletedTour && nodes.length <= 1) {
      // Small delay to let the canvas render
      const timer = setTimeout(() => {
        startTour();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isReady, hasCompletedTour, startTour, nodes.length]);

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
    clearBranchHighlight();
    // Also dismiss spotlight when clicking on pane
    if (newlyAddedNodeId) {
      clearNewlyAddedNode();
    }
  }, [selectNode, newlyAddedNodeId, clearNewlyAddedNode, clearBranchHighlight]);

  // Handle node click - highlight branch and dismiss spotlight
  const handleNodeClick = useCallback((_event: React.MouseEvent, node: RFNode) => {
    // Highlight the branch for this node
    setBranchHighlight(node.id, branchHighlightMode);

    // Dismiss spotlight
    if (newlyAddedNodeId) {
      clearNewlyAddedNode();
    }
  }, [newlyAddedNodeId, clearNewlyAddedNode, setBranchHighlight, branchHighlightMode]);

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

  // Premium toolbar button styling
  const toolbarBtnClass = 'flex items-center gap-2 px-3 py-2 rounded-xl bg-card/80 backdrop-blur-sm border border-border/60 text-sm font-semibold text-foreground hover:bg-card hover:border-border hover:shadow-md transition-all duration-200 shadow-sm hover:scale-[1.02]';
  const toolbarBtnDisabled = 'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100';

  return (
    <div ref={reactFlowWrapper} className="flex-1 h-full relative flow-canvas-wrapper">
      {/* SVG Arrow Markers - Contextual colors for premium feel */}
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs>
          {/* Start node arrows - emerald tint */}
          <marker id="arrow-start" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#A7F3D0" filter="url(#arrow-subtle-glow)" />
          </marker>
          <marker id="arrow-start-active" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#10B981" filter="url(#arrow-glow)" />
          </marker>

          {/* Question node arrows - blue/indigo tint */}
          <marker id="arrow-question" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#BFDBFE" filter="url(#arrow-subtle-glow)" />
          </marker>
          <marker id="arrow-question-active" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#6366F1" filter="url(#arrow-glow)" />
          </marker>

          {/* Condition arrows - violet tint */}
          <marker id="arrow-condition" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#C4B5FD" filter="url(#arrow-subtle-glow)" />
          </marker>
          <marker id="arrow-condition-active" viewBox="0 0 12 12" refX="10" refY="6" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 2 2 L 10 6 L 2 10 L 4 6 Z" fill="#8B5CF6" filter="url(#arrow-glow)" />
          </marker>

          {/* Arrow filters */}
          <filter id="arrow-subtle-glow">
            <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodOpacity="0.25"/>
          </filter>
          <filter id="arrow-glow">
            <feDropShadow dx="0" dy="0" stdDeviation="2" floodOpacity="0.35"/>
          </filter>

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
        <Background
          gap={20}
          size={1}
          color="hsl(var(--border))"
          style={{ opacity: 0.4 }}
        />
        <Controls
          className="!bg-card/80 !backdrop-blur-sm !border-border/60 !shadow-lg !rounded-xl"
          showInteractive={false}
        />
        {/* Search panel */}
        <Panel position="top-center">
          <CanvasSearch
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
          />
        </Panel>

        {/* Flow stats badge */}
        <Panel position="bottom-right">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-card/90 backdrop-blur-sm border border-border/40 shadow-sm text-xs text-muted-foreground font-medium">
            <span>{nodes.length} {nodes.length === 1 ? 'node' : 'nodes'}</span>
            <span className="text-border">•</span>
            <span>{edges.length} {edges.length === 1 ? 'connection' : 'connections'}</span>
          </div>
        </Panel>

        {/* Toolbar */}
        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={() => setIsSearchOpen((v) => !v)}
            className={cn(toolbarBtnClass, isSearchOpen && 'ring-2 ring-primary')}
            title="Search (Ctrl+F)"
            data-tour="search-btn"
          >
            <Search className="h-4 w-4" />
          </button>
          <button
            onClick={startTour}
            className={toolbarBtnClass}
            title="Show Tutorial"
          >
            <HelpCircle className="h-4 w-4" />
          </button>
        {!isFlowLocked && (
          <>
            <div className="flex gap-2" data-tour="undo-redo">
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
            </div>
            <div className="flex gap-2" data-tour="auto-arrange-btn">
              <button
                onClick={autoLayout}
                className={toolbarBtnClass}
                title="Clean up overlaps and align to grid"
              >
                <LayoutGrid className="h-4 w-4" />
                Tidy Up
              </button>
              <SpacingDropdown onSelect={(spacing) => fullLayout(undefined, spacing)} />
              <EdgeTypeDropdown onSelect={setEdgeType} current={edgeType} />
              <BranchModeDropdown onSelect={setBranchHighlightMode} current={branchHighlightMode} />
            </div>
            {/* H/V direction toggle - refined premium style */}
            <div className="flex rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm shadow-sm overflow-hidden" data-tour="layout-toggle">
              <button
                onClick={() => {
                  setLayoutDirection('LR');
                  setTimeout(() => {
                    nodes.forEach(n => updateNodeInternals(n.id));
                    fitView({ padding: 0.2, duration: 300 });
                  }, 100);
                }}
                className={cn(
                  'flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-all duration-200',
                  layoutDirection === 'LR'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-muted/80'
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
                  'flex items-center gap-1 px-3 py-2 text-sm font-semibold transition-all duration-200',
                  layoutDirection === 'TB'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-foreground hover:bg-muted/80'
                )}
                title="Vertical layout (Top to Bottom)"
              >
                <ArrowDown className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
        </Panel>

        {/* "Add Question" button — top-left */}
        {!isFlowLocked && (
          <Panel position="top-left" className="flex gap-2">
            <div className="relative">
              <AnimatePresence>
                {isAddMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -12, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.95 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-[0_12px_48px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden z-50"
                  >
                    <div className="px-4 pt-4 pb-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        Question type
                      </span>
                    </div>
                    <div className="max-h-72 overflow-y-auto px-2 pb-2">
                      {QUESTION_TYPES_LIST.map(([type, meta]) => {
                        const Icon = meta.icon;
                        return (
                          <button
                            key={type}
                            onClick={() => handleAddFreestandingNode('question', type)}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-muted/80 transition-all duration-200 hover:scale-[1.02] group"
                          >
                            <span className={cn('flex-shrink-0', meta.color)}><Icon className="h-4 w-4" /></span>
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-foreground group-hover:text-primary transition-colors">{meta.label}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">{meta.description}</div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    <div className="border-t border-border/60 p-2">
                      <button
                        onClick={() => handleAddFreestandingNode('end')}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-left hover:bg-muted/80 transition-all duration-200 hover:scale-[1.02] group"
                      >
                        <Flag className="h-4 w-4 text-violet-500 flex-shrink-0" />
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors">End Screen</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <button
                onClick={() => setIsAddMenuOpen((v) => !v)}
                className={cn(
                  toolbarBtnClass,
                  isAddMenuOpen && 'ring-2 ring-primary'
                )}
                title="Add question or end screen"
                data-tour="add-question-btn"
              >
                <Plus className="h-4 w-4" />
                <span>Add Question</span>
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
