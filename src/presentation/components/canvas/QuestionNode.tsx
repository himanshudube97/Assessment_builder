'use client';

/**
 * QuestionNode Component
 * Represents a question in the assessment flow
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import {
  CircleDot,
  CheckSquare,
  Type,
  AlignLeft,
  Star,
  ToggleLeft,
  HelpCircle,
  Hash,
  Mail,
  ChevronDown,
  Calendar,
  Gauge,
} from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { QuestionNodeData, QuestionType } from '@/domain/entities/flow';
import { cn } from '@/lib/utils';
import { getDisplayText } from '@/lib/answerPiping';

const questionTypeIcons: Record<QuestionType, React.ReactNode> = {
  multiple_choice_single: <CircleDot className="h-4 w-4" />,
  multiple_choice_multi: <CheckSquare className="h-4 w-4" />,
  short_text: <Type className="h-4 w-4" />,
  long_text: <AlignLeft className="h-4 w-4" />,
  rating: <Star className="h-4 w-4" />,
  yes_no: <ToggleLeft className="h-4 w-4" />,
  number: <Hash className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  dropdown: <ChevronDown className="h-4 w-4" />,
  date: <Calendar className="h-4 w-4" />,
  nps: <Gauge className="h-4 w-4" />,
};

const questionTypeLabels: Record<QuestionType, string> = {
  multiple_choice_single: 'Multiple Choice',
  multiple_choice_multi: 'Checkboxes',
  short_text: 'Short Text',
  long_text: 'Long Text',
  rating: 'Rating',
  yes_no: 'Yes / No',
  number: 'Number',
  email: 'Email',
  dropdown: 'Dropdown',
  date: 'Date',
  nps: 'NPS Score',
};

// Different colors for each question type
const questionTypeColors: Record<QuestionType, { header: string; border: string }> = {
  multiple_choice_single: { header: 'bg-blue-500', border: 'border-blue-300 dark:border-blue-700' },
  multiple_choice_multi: { header: 'bg-indigo-500', border: 'border-indigo-300 dark:border-indigo-700' },
  short_text: { header: 'bg-cyan-500', border: 'border-cyan-300 dark:border-cyan-700' },
  long_text: { header: 'bg-teal-500', border: 'border-teal-300 dark:border-teal-700' },
  rating: { header: 'bg-amber-500', border: 'border-amber-300 dark:border-amber-700' },
  yes_no: { header: 'bg-pink-500', border: 'border-pink-300 dark:border-pink-700' },
  number: { header: 'bg-emerald-500', border: 'border-emerald-300 dark:border-emerald-700' },
  email: { header: 'bg-rose-500', border: 'border-rose-300 dark:border-rose-700' },
  dropdown: { header: 'bg-purple-500', border: 'border-purple-300 dark:border-purple-700' },
  date: { header: 'bg-sky-500', border: 'border-sky-300 dark:border-sky-700' },
  nps: { header: 'bg-lime-500', border: 'border-lime-300 dark:border-lime-700' },
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

  return (
    <BaseNode
      id={id}
      selected={selected}
      type="question"
      title={typeLabel}
      icon={icon}
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
          {data.questionText ? getDisplayText(data.questionText) : 'Enter your question...'}
        </p>

        {/* Options preview for multiple choice */}
        {(data.questionType === 'multiple_choice_single' ||
          data.questionType === 'multiple_choice_multi' ||
          data.questionType === 'yes_no') &&
          data.options && (
            <div className="space-y-1.5">
              {data.options.slice(0, 4).map((option) => (
                <div
                  key={option.id}
                  className="flex items-center gap-2 text-sm relative"
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

        {/* Number input preview */}
        {data.questionType === 'number' && (
          <div className="border border-dashed border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <Hash className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-sm text-muted-foreground/50">
              {data.placeholder || 'Enter a number...'}
            </span>
          </div>
        )}

        {/* Email input preview */}
        {data.questionType === 'email' && (
          <div className="border border-dashed border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <Mail className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-sm text-muted-foreground/50">
              {data.placeholder || 'you@example.com'}
            </span>
          </div>
        )}

        {/* Dropdown preview */}
        {data.questionType === 'dropdown' && data.options && (
          <div className="border border-dashed border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center justify-between">
            <span className="text-sm text-muted-foreground/50">
              Select an option...
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/40" />
          </div>
        )}

        {/* Date input preview */}
        {data.questionType === 'date' && (
          <div className="border border-dashed border-muted-foreground/30 rounded-lg px-3 py-2 flex items-center gap-2">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground/40" />
            <span className="text-sm text-muted-foreground/50">
              {data.placeholder || 'Select a date...'}
            </span>
          </div>
        )}

        {/* NPS preview */}
        {data.questionType === 'nps' && (
          <div className="space-y-1">
            <div className="flex gap-0.5">
              {Array.from({ length: 11 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    'flex-1 h-5 rounded text-[9px] font-medium flex items-center justify-center',
                    i <= 6 ? 'bg-red-100 dark:bg-red-900/30 text-red-400' :
                    i <= 8 ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-500' :
                    'bg-green-100 dark:bg-green-900/30 text-green-500'
                  )}
                >
                  {i}
                </div>
              ))}
            </div>
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
