'use client';

/**
 * CanvasSidebar Component
 * Sidebar with draggable question types
 */

import { memo } from 'react';
import { motion } from 'framer-motion';
import {
  CircleDot,
  CheckSquare,
  Type,
  AlignLeft,
  Star,
  ToggleLeft,
  Flag,
  GripVertical,
  Hash,
  Mail,
  ChevronDown,
  Calendar,
  Gauge,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { QuestionType } from '@/domain/entities/flow';

interface QuestionTypeItem {
  type: QuestionType;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const questionTypes: QuestionTypeItem[] = [
  {
    type: 'multiple_choice_single',
    label: 'Multiple Choice',
    description: 'Select one option',
    icon: <CircleDot className="h-5 w-5" />,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
  {
    type: 'multiple_choice_multi',
    label: 'Checkboxes',
    description: 'Select multiple options',
    icon: <CheckSquare className="h-5 w-5" />,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
  },
  {
    type: 'short_text',
    label: 'Short Text',
    description: 'Single line answer',
    icon: <Type className="h-5 w-5" />,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    type: 'long_text',
    label: 'Long Text',
    description: 'Paragraph answer',
    icon: <AlignLeft className="h-5 w-5" />,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
  },
  {
    type: 'rating',
    label: 'Rating Scale',
    description: 'Numeric rating',
    icon: <Star className="h-5 w-5" />,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  {
    type: 'yes_no',
    label: 'Yes / No',
    description: 'Binary choice',
    icon: <ToggleLeft className="h-5 w-5" />,
    color: 'text-teal-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
  },
  {
    type: 'number',
    label: 'Number',
    description: 'Numeric input',
    icon: <Hash className="h-5 w-5" />,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    type: 'email',
    label: 'Email',
    description: 'Email address',
    icon: <Mail className="h-5 w-5" />,
    color: 'text-rose-500',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
  },
  {
    type: 'dropdown',
    label: 'Dropdown',
    description: 'Select from list',
    icon: <ChevronDown className="h-5 w-5" />,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    type: 'date',
    label: 'Date',
    description: 'Date picker',
    icon: <Calendar className="h-5 w-5" />,
    color: 'text-sky-500',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
  },
  {
    type: 'nps',
    label: 'NPS Score',
    description: '0-10 loyalty scale',
    icon: <Gauge className="h-5 w-5" />,
    color: 'text-lime-500',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
  },
];

interface CanvasSidebarProps {
  onAddNode: (type: 'question' | 'end', questionType?: QuestionType) => void;
}

export const CanvasSidebar = memo(function CanvasSidebar({
  onAddNode,
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
          Drag to canvas or click to add
        </p>
      </div>

      {/* Question Types */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {questionTypes.map((item, index) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            draggable
            onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, 'question', item.type)}
            onClick={() => onAddNode('question', item.type)}
            className={cn(
              'flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing',
              'bg-card border border-border',
              'hover:border-primary/50 hover:shadow-md hover:-translate-y-0.5',
              'transition-all duration-200',
              'group'
            )}
          >
            {/* Drag indicator */}
            <div className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
              <GripVertical className="h-4 w-4" />
            </div>

            {/* Icon with colored background */}
            <div className={cn(
              'flex-shrink-0 p-2 rounded-lg',
              item.bgColor,
              item.color
            )}>
              {item.icon}
            </div>

            {/* Labels */}
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm text-foreground truncate">
                {item.label}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {item.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* End Node */}
      <div className="p-3 border-t border-border">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          draggable
          onDragStart={(e) => onDragStart(e as unknown as React.DragEvent, 'end')}
          onClick={() => onAddNode('end')}
          className={cn(
            'flex items-center gap-3 p-3 rounded-xl cursor-grab active:cursor-grabbing',
            'bg-violet-50 dark:bg-violet-900/20 border border-violet-200 dark:border-violet-800',
            'hover:border-violet-400 hover:shadow-md hover:-translate-y-0.5',
            'transition-all duration-200',
            'group'
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
