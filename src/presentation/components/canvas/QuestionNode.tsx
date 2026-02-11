'use client';

/**
 * QuestionNode Component
 * Represents a question in the assessment flow
 */

import { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import {
  CircleDot,
  CheckSquare,
  Type,
  AlignLeft,
  Star,
  ToggleLeft,
  HelpCircle,
} from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { QuestionNodeData, QuestionType } from '@/domain/entities/flow';
import { cn } from '@/lib/utils';

const questionTypeIcons: Record<QuestionType, React.ReactNode> = {
  multiple_choice_single: <CircleDot className="h-4 w-4" />,
  multiple_choice_multi: <CheckSquare className="h-4 w-4" />,
  short_text: <Type className="h-4 w-4" />,
  long_text: <AlignLeft className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
  yes_no: <ToggleLeft className="h-4 w-4" />,
};

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice_single: 'Multiple Choice',
  multiple_choice_multi: 'Checkboxes',
  short_text: 'Short Text',
  long_text: 'Long Text',
  rating: 'Rating',
  yes_no: 'Yes / No',
};

// Different colors for each question type
const questionTypeColors: Record<QuestionType, { header: string; border: string }> = {
  multiple_choice_single: { header: 'bg-blue-500', border: 'border-blue-300 dark:border-blue-700' },
  multiple_choice_multi: { header: 'bg-indigo-500', border: 'border-indigo-300 dark:border-indigo-700' },
  short_text: { header: 'bg-cyan-500', border: 'border-cyan-300 dark:border-cyan-700' },
  long_text: { header: 'bg-teal-500', border: 'border-teal-300 dark:border-teal-700' },
  rating: { header: 'bg-amber-500', border: 'border-amber-300 dark:border-amber-700' },
  yes_no: { header: 'bg-pink-500', border: 'border-pink-300 dark:border-pink-700' },
};

export const QuestionNode = memo(function QuestionNode({
  id,
  data,
  selected,
}: NodeProps<QuestionNodeData>) {
  const icon = questionTypeIcons[data.questionType] || (
    <HelpCircle className="h-4 w-4" />
  );
  const typeLabel = questionTypeLabels[data.questionType] || 'Question';
  const colors = questionTypeColors[data.questionType] || { header: 'bg-indigo-500', border: 'border-indigo-300 dark:border-indigo-700' };

  // Check if this question type supports per-option branching
  const hasOptionBranching =
    data.questionType === 'multiple_choice_single' ||
    data.questionType === 'yes_no';

  // Generate custom source handles for each option (for single-select questions)
  // These handles allow branching based on the selected option
  const customSourceHandles = hasOptionBranching && data.options ? (
    <div className="absolute right-0 top-0 h-full">
      {data.options.slice(0, 4).map((option, index) => {
        // Calculate vertical position to align with options in the node body
        // Header is ~52px, question text takes ~24px, then options start
        const baseOffset = 100; // Start position for first option
        const spacing = 28; // Space between options
        const topPosition = baseOffset + (index * spacing);

        return (
          <div
            key={option.id}
            className="absolute flex items-center"
            style={{ top: `${topPosition}px`, right: '-8px' }}
          >
            {/* Handle with tooltip-style label */}
            <Handle
              type="source"
              position={Position.Right}
              id={option.id}
              className={cn(
                '!relative !transform-none !right-0 !top-0',
                '!w-4 !h-4 !border-[3px] !border-background !rounded-full',
                '!transition-all !duration-200',
                '!bg-indigo-400 hover:!bg-indigo-600 hover:!scale-125',
                'hover:!shadow-lg'
              )}
              title={`Connect "${option.text}" to next step`}
            />
          </div>
        );
      })}
    </div>
  ) : null;

  return (
    <BaseNode
      id={id}
      selected={selected}
      type="question"
      title={typeLabel}
      icon={icon}
      showSourceHandle={!hasOptionBranching}
      customSourceHandles={customSourceHandles}
      headerColor={colors.header}
      borderColor={colors.border}
    >
      <div className="space-y-3">
        {/* Question text */}
        <p
          className={cn(
            'font-medium text-foreground',
            !data.questionText && 'text-muted-foreground italic'
          )}
        >
          {data.questionText || 'Enter your question...'}
        </p>

        {/* Options preview for multiple choice */}
        {(data.questionType === 'multiple_choice_single' ||
          data.questionType === 'multiple_choice_multi' ||
          data.questionType === 'yes_no') &&
          data.options && (
            <div className="space-y-1.5">
              {data.options.slice(0, 4).map((option, index) => (
                <div
                  key={option.id}
                  className={cn(
                    'flex items-center gap-2 text-sm',
                    hasOptionBranching ? 'pr-6' : '' // More padding for handle
                  )}
                >
                  {/* Radio/Checkbox indicator */}
                  {data.questionType === 'multiple_choice_single' ||
                  data.questionType === 'yes_no' ? (
                    <div className="w-3.5 h-3.5 rounded-full border-2 border-muted-foreground/40 flex-shrink-0" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded border-2 border-muted-foreground/40 flex-shrink-0" />
                  )}

                  {/* Option text */}
                  <span className="truncate flex-1 text-muted-foreground">{option.text}</span>

                  {/* Visual connector to handle for branching options */}
                  {hasOptionBranching && (
                    <div className="flex items-center gap-1">
                      <div className="w-6 h-[2px] bg-gradient-to-r from-transparent to-indigo-300 dark:to-indigo-600" />
                      <div className="w-2 h-2 rounded-full bg-indigo-400 border-2 border-background" />
                    </div>
                  )}
                </div>
              ))}
              {data.options.length > 4 && (
                <p className="text-xs text-muted-foreground pl-5">
                  +{data.options.length - 4} more options
                </p>
              )}
            </div>
          )}

        {/* Rating preview */}
        {data.questionType === 'rating' && (
          <div className="flex items-center gap-1">
            {Array.from({ length: data.maxValue || 5 }).map((_, i) => (
              <Star
                key={i}
                className="h-4 w-4 text-muted-foreground/40"
                fill="currentColor"
              />
            ))}
          </div>
        )}

        {/* Text input preview */}
        {(data.questionType === 'short_text' ||
          data.questionType === 'long_text') && (
          <div
            className={cn(
              'border border-dashed border-muted-foreground/30 rounded-lg px-3 py-2',
              data.questionType === 'long_text' && 'min-h-[60px]'
            )}
          >
            <span className="text-sm text-muted-foreground/50">
              {data.placeholder || 'Text input...'}
            </span>
          </div>
        )}

        {/* Required badge */}
        {data.required && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
            Required
          </span>
        )}
      </div>
    </BaseNode>
  );
});
