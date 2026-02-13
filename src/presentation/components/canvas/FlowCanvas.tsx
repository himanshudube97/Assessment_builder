'use client';

/**
 * FlowCanvas Component
 * The main React Flow canvas for the visual editor
 */

import { useCallback, useRef, useMemo, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Panel,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { LayoutGrid } from 'lucide-react';

import { useCanvasStore } from '@/presentation/stores/canvas.store';
import { StartNode } from './StartNode';
import { QuestionNode } from './QuestionNode';
import { EndNode } from './EndNode';
import { EdgeWithCondition } from './EdgeWithCondition';
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

interface FlowCanvasProps {
  onAddNode: (
    type: 'question' | 'end',
    position: { x: number; y: number },
    questionType?: QuestionType
  ) => void;
}

function FlowCanvasInner({ onAddNode }: FlowCanvasProps) {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { project } = useReactFlow();

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const updateEdgeCondition = useCanvasStore((s) => s.updateEdgeCondition);
  const autoLayout = useCanvasStore((s) => s.autoLayout);
  const newlyAddedNodeId = useCanvasStore((s) => s.newlyAddedNodeId);
  const clearNewlyAddedNode = useCanvasStore((s) => s.clearNewlyAddedNode);

  // Auto-dismiss node highlight after a short delay
  useEffect(() => {
    if (newlyAddedNodeId) {
      const timer = setTimeout(() => {
        clearNewlyAddedNode();
      }, 2000); // Auto-dismiss after 2 seconds
      return () => clearTimeout(timer);
    }
  }, [newlyAddedNodeId, clearNewlyAddedNode]);

  // Add condition change handler to edges
  const edgesWithHandlers = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      type: 'conditionEdge',
      data: {
        ...edge.data,
        onConditionChange: (condition: EdgeCondition | null) => {
          updateEdgeCondition(edge.id, condition);
        },
      },
    }));
  }, [edges, updateEdgeCondition]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow/type') as
        | 'question'
        | 'end';
      const questionType = event.dataTransfer.getData(
        'application/reactflow/questionType'
      ) as QuestionType | '';

      if (!type || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      onAddNode(type, position, questionType || undefined);
    },
    [project, onAddNode]
  );

  const onPaneClick = useCallback(() => {
    selectNode(null);
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
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
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
        <MiniMap
          className="!bg-card !border-border"
          nodeColor={(node) => {
            // Professional muted colors matching new palette
            switch (node.type) {
              case 'start':
                return '#4ADE80'; // emerald-400
              case 'question':
                return '#6366F1'; // indigo-500
              case 'end':
                return '#8B5CF6'; // violet-500
              default:
                return '#64748B'; // slate-500
            }
          }}
          maskColor="rgba(0, 0, 0, 0.08)"
        />
        <Panel position="top-right" className="flex gap-2">
          <button
            onClick={autoLayout}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors shadow-sm"
            title="Clean up overlaps and align to grid"
          >
            <LayoutGrid className="h-4 w-4" />
            Tidy Up
          </button>
        </Panel>
      </ReactFlow>

    </div>
  );
}

export function FlowCanvas(props: FlowCanvasProps) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  );
}
