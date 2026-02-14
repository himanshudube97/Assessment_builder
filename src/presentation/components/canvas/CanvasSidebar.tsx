'use client';

/**
 * CanvasSidebar Component
 * Sidebar with draggable question types
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  Flag,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuestionType } from '@/domain/entities/flow';
import { QUESTION_TYPES_LIST } from '@/domain/constants/questionTypes';

interface CanvasSidebarProps {
  onAddNode: (type: 'question' | 'end', questionType?: QuestionType) => void;
  disabled?: boolean;
}

export const CanvasSidebar = memo(function CanvasSidebar({
  onAddNode,
  disabled = false,
}: CanvasSidebarProps) {
  const onDragStart = (
    event: React.DragEvent,
    nodeType: 'question' | 'end',
    questionType?: QuestionType
  ) => {
    event.dataTransfer.setData('application/reactflow/type', nodeType);
    if (questionType) {
      event.dataTransfer.setData(
        'application/reactflow/questionType',
        questionType
      );
    }
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="w-64 bg-secondary/50 border-r border-border flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-foreground">Question Types</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {disabled ? 'Flow is locked' : 'Drag to canvas or click to add'}
        </p>
      </div>

      {/* Question Types */}
      <div className={cn('flex-1 overflow-y-auto p-3 space-y-2', disabled && 'opacity-50 pointer-events-none')}>
        {QUESTION_TYPES_LIST.map(([type, meta], index) => {
          const Icon = meta.icon;
          return (
            <motion.div
              key={type}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              draggable={!disabled}
              onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, 'question', type)}
              onClick={() => !disabled && onAddNode('question', type)}
              className={cn(
                'flex items-center gap-3 p-3 rounded-xl',
                'bg-card border border-border',
                'transition-all duration-200',
                'group',
                disabled
                  ? 'cursor-not-allowed'
                  : 'cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5'
              )}
            >
              {/* Drag indicator */}
              <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                <GripVertical className="h-4 w-4" />
              </div>

              {/* Icon with colored background */}
              <div className={cn(
                'flex-shrink-0 p-2 rounded-lg',
                meta.bgColor,
                meta.color
              )}>
                <Icon className="h-5 w-5" />
              </div>

              {/* Labels */}
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-foreground truncate">
                  {meta.label}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {meta.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* End Node */}
      <div className={cn('p-3 border-t border-border', disabled && 'opacity-50 pointer-events-none')}>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          draggable={!disabled}
          onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, 'end')}
          onClick={() => !disabled && onAddNode('end')}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl',
            'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800',
            'transition-all duration-200',
            'group',
            disabled
              ? 'cursor-not-allowed'
              : 'cursor-grab active:cursor-grabbing hover:border-violet-400 hover:shadow-md hover:-translate-y-0.5'
          )}
        >
          <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
            <GripVertical className="h-4 w-4" />
          </div>
          <div className="flex-shrink-0 text-violet-500">
            <Flag className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm text-foreground">End Screen</p>
            <p className="text-xs text-muted-foreground">
              Thank you message
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
});
