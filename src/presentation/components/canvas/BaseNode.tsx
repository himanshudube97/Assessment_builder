'use client';

/**
 * BaseNode Component
 * Shared base for all node types in the canvas
 */

import { memo, type ReactNode } from 'react';
import { Handle, Position } from 'reactflow';
import { motion } from 'framer-motion';
import { GripVertical, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/presentation/stores/canvas.store';

interface BaseNodeProps {
  id: string;
  selected: boolean;
  type: 'start' | 'question' | 'end';
  title: string;
  icon: ReactNode;
  children: ReactNode;
  showSourceHandle?: boolean;
  showTargetHandle?: boolean;
  customSourceHandles?: ReactNode;
  headerColor?: string;
  borderColor?: string;
}

// Colorful header backgrounds
const nodeHeaderColors = {
  start: 'bg-emerald-500',
  question: 'bg-indigo-500',
  end: 'bg-violet-500',
};

// Matching border colors
const nodeBorderColors = {
  start: 'border-emerald-300 dark:border-emerald-700',
  question: 'border-indigo-300 dark:border-indigo-700',
  end: 'border-violet-300 dark:border-violet-700',
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
  customSourceHandles,
  headerColor,
  borderColor,
}: BaseNodeProps) {
  const selectNode = useCanvasStore((s) => s.selectNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (type === 'start') return;
    deleteNode(id);
  };

  const handleClick = () => {
    selectNode(id);
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={cn(
        'w-[280px] rounded-xl border-2 bg-card shadow-md transition-all duration-200',
        'hover:shadow-xl cursor-grab active:cursor-grabbing',
        borderColor || nodeBorderColors[type],
        selected && 'ring-2 ring-ring ring-offset-2 ring-offset-background shadow-xl'
      )}
      onClick={handleClick}
    >
      {/* Header */}
      <div
        className={cn(
          'flex items-center gap-2 px-4 py-3 rounded-t-[10px]',
          headerColor || nodeHeaderColors[type],
          'text-white'
        )}
      >
        {/* Drag handle (visual affordance only) */}
        <div className="opacity-40">
          <GripVertical className="h-4 w-4" />
        </div>

        {/* Icon */}
        <div className="flex-shrink-0 opacity-80">{icon}</div>

        {/* Title */}
        <span className="flex-1 font-medium text-sm truncate">{title}</span>

        {/* Delete button (not for start node) */}
        {type !== 'start' && (
          <button
            onClick={handleDelete}
            className="nodrag opacity-60 hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/20"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4">{children}</div>

      {/* Target Handle - Improved */}
      {showTargetHandle && (
        <Handle
          type="target"
          position={Position.Top}
          className={cn(
            '!w-4 !h-4 !bg-slate-400 !border-[3px] !border-background !-top-2',
            '!transition-all !duration-200',
            'hover:!bg-primary hover:!scale-125 hover:!border-primary/30',
            selected && '!bg-primary'
          )}
        />
      )}

      {/* Source Handle - Improved */}
      {showSourceHandle && !customSourceHandles && (
        <Handle
          type="source"
          position={Position.Bottom}
          className={cn(
            '!w-4 !h-4 !bg-slate-400 !border-[3px] !border-background !-bottom-2',
            '!transition-all !duration-200',
            'hover:!bg-primary hover:!scale-125 hover:!border-primary/30',
            selected && '!bg-primary'
          )}
        />
      )}

      {customSourceHandles}
    </motion.div>
  );
});
