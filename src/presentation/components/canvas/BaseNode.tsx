'use client';

/**
 * BaseNode Component
 * Shared base for all node types in the canvas
 */

import { memo, useState, type ReactNode } from 'react';
import { Handle, Position } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { GripVertical, Trash2, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasStore, useIsNodeAtOptionLimit } from '@/presentation/stores/canvas.store';
import { ConnectionMenu } from './ConnectionMenu';
import { ConfirmDialog } from './ConfirmDialog';

interface BaseNodeProps {
  id: string;
  selected: boolean;
  type: 'start' | 'question' | 'end';
  title: string;
  icon: ReactNode;
  children: ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  headerColor?: string;
  borderColor?: string;
  dataTour?: string;
}

// Sophisticated gradient header backgrounds - refined palette
const nodeHeaderColors = {
  start: 'bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600',
  question: 'bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600',
  end: 'bg-gradient-to-br from-violet-500 via-purple-600 to-fuchsia-600',
};

// Refined border colors with better contrast
const nodeBorderColors = {
  start: 'border-emerald-200/60 dark:border-emerald-800/60',
  question: 'border-blue-200/60 dark:border-blue-800/60',
  end: 'border-violet-200/60 dark:border-violet-800/60',
};

// Premium shadow system - multi-layer for depth
const nodeShadows = {
  base: 'shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]',
  hover: 'shadow-[0_8px_24px_rgba(0,0,0,0.08),0_2px_8px_rgba(0,0,0,0.08)]',
  selected: 'shadow-[0_12px_32px_rgba(0,0,0,0.12),0_4px_12px_rgba(0,0,0,0.1)]',
};

export const BaseNode = memo(function BaseNode({
  id,
  selected,
  type,
  title,
  icon,
  children,
  showSourceHandle = true,
  showTargetHandle = true,
  headerColor,
  borderColor,
  dataTour,
}: BaseNodeProps) {
  const selectNode = useCanvasStore((s) => s.selectNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const newlyAddedNodeId = useCanvasStore((s) => s.newlyAddedNodeId);
  const connectionMenuSourceId = useCanvasStore((s) => s.connectionMenuSourceId);
  const openConnectionMenu = useCanvasStore((s) => s.openConnectionMenu);
  const closeConnectionMenu = useCanvasStore((s) => s.closeConnectionMenu);
  const isFlowLocked = useCanvasStore((s) => s.isFlowLocked);
  const layoutDirection = useCanvasStore((s) => s.layoutDirection);
  const atOptionLimit = useIsNodeAtOptionLimit(id);

  const isTB = layoutDirection === 'TB';

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const searchHighlightIds = useCanvasStore((s) => s.searchHighlightIds);

  const isNewlyAdded = id === newlyAddedNodeId;
  const showConnectionMenu = connectionMenuSourceId === id;
  const isDimmedBySearch = searchHighlightIds !== null && !searchHighlightIds.includes(id);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'start') return;
    setShowDeleteConfirm(true);
  };

  const handleClick = () => {
    selectNode(id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'group relative w-[280px] rounded-2xl border bg-card overflow-visible',
        'cursor-grab active:cursor-grabbing',
        'transition-all duration-300 ease-out',
        borderColor || nodeBorderColors[type],
        nodeShadows.base,
        // Premium hover state
        !selected && 'hover:scale-[1.02]',
        selected
          ? `ring-2 ring-primary/40 ring-offset-2 ring-offset-background ${nodeShadows.selected}`
          : `hover:${nodeShadows.hover}`,
        // Refined glow for newly added node
        isNewlyAdded && 'ring-4 ring-primary/30 shadow-[0_0_40px_rgba(99,102,241,0.25),0_0_12px_rgba(99,102,241,0.15)]',
        // Dim when search is active and this node doesn't match
        isDimmedBySearch && 'opacity-[0.15] pointer-events-none'
      )}
      onClick={handleClick}
      data-tour={dataTour}
    >
      {/* Header - refined gradient with better spacing */}
      <div
        className={cn(
          'flex items-center gap-3 px-5 py-3.5 rounded-t-2xl relative overflow-hidden',
          headerColor || nodeHeaderColors[type],
          'text-white'
        )}
      >
        {/* Subtle shine overlay for premium feel */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent pointer-events-none" />

        {/* Drag handle - more subtle */}
        <div className="opacity-30 hover:opacity-50 transition-opacity relative z-10">
          <GripVertical className="h-3.5 w-3.5" />
        </div>

        {/* Icon with subtle glow */}
        <div className="flex-shrink-0 relative z-10 drop-shadow-sm">{icon}</div>

        {/* Title - improved typography */}
        <span className="flex-1 font-semibold text-[13px] tracking-wide truncate relative z-10 drop-shadow-sm">
          {title}
        </span>

        {/* Delete button - refined interaction */}
        {type !== 'start' && (
          <button
            onClick={handleDelete}
            className="nodrag opacity-50 hover:opacity-100 transition-all duration-200 p-1.5 rounded-lg hover:bg-white/20 hover:scale-110 relative z-10"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Body - refined spacing */}
      <div className="p-5 overflow-visible">{children}</div>

      {/* Target Handle - refined with premium styling */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={isTB ? Position.Top : Position.Left}
          className={cn(
            '!w-3 !h-3 !bg-slate-300 !border-[2.5px] !border-background',
            isTB ? '!-top-1.5' : '!-left-1.5',
            '!transition-all !duration-300 !ease-out',
            '!shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
            'hover:!bg-primary hover:!scale-150 hover:!border-primary/20 hover:!shadow-[0_4px_12px_rgba(99,102,241,0.4)]',
            selected && '!bg-primary !scale-125'
          )}
        />
      )}

      {/* Source Handle - refined with premium styling */}
      {showSourceHandle && (
        <>
          <Handle
            type="source"
            position={isTB ? Position.Bottom : Position.Right}
            className={cn(
              '!w-3 !h-3 !bg-slate-300 !border-[2.5px] !border-background',
              isTB ? '!-bottom-1.5' : '!-right-1.5',
              '!transition-all !duration-300 !ease-out',
              '!shadow-[0_2px_8px_rgba(0,0,0,0.15)]',
              'hover:!bg-primary hover:!scale-150 hover:!border-primary/20 hover:!shadow-[0_4px_12px_rgba(99,102,241,0.4)]',
              selected && '!bg-primary !scale-125'
            )}
          />
          {/* "+" button — refined premium styling */}
          {!isFlowLocked && !atOptionLimit && (
            <button
              data-tour="node-connect-hint"
              className={cn(
                'nodrag absolute',
                isTB
                  ? '-bottom-4 left-1/2 translate-y-full -translate-x-1/2'
                  : '-right-4 top-1/2 translate-x-full -translate-y-1/2',
                'w-8 h-8 rounded-full flex items-center justify-center',
                'bg-gradient-to-br from-primary via-primary to-primary/90 text-primary-foreground',
                'shadow-[0_4px_12px_rgba(99,102,241,0.25),0_2px_4px_rgba(99,102,241,0.2)]',
                'border-[2px] border-background',
                'transition-all duration-300 ease-out',
                'hover:scale-110 hover:shadow-[0_6px_20px_rgba(99,102,241,0.35),0_2px_8px_rgba(99,102,241,0.25)]',
                'active:scale-95',
                (selected || showConnectionMenu)
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100',
              )}
              onClick={(e) => {
                e.stopPropagation();
                if (showConnectionMenu) {
                  closeConnectionMenu();
                } else {
                  openConnectionMenu(id);
                }
              }}
            >
              <Plus className="h-4 w-4 stroke-[3]" />
            </button>
          )}
          {/* Connection Menu */}
          <AnimatePresence>
            {showConnectionMenu && (
              <div className={cn(
                'nodrag nopan absolute z-50',
                isTB
                  ? '-bottom-4 left-1/2 translate-y-full mt-5 -translate-x-1/2'
                  : '-right-4 top-1/2 translate-x-full mt-5'
              )}>
                <ConnectionMenu sourceNodeId={id} onClose={closeConnectionMenu} />
              </div>
            )}
          </AnimatePresence>
        </>
      )}

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title="Delete this node?"
        message="This will also remove all connections to and from this node. This action can be undone."
        onConfirm={() => {
          setShowDeleteConfirm(false);
          deleteNode(id);
        }}
        onCancel={() => setShowDeleteConfirm(false)}
      />
    </motion.div>
  );
});
