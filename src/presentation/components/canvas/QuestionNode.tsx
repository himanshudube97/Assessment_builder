'use client';

/**
 * QuestionNode Component
 * Represents a question in the assessment flow
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import {
  Star,
  HelpCircle,
  Hash,
  Mail,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { QuestionNodeData } from '@/domain/entities/flow';
import { cn } from '@/lib/utils';
import { getDisplayText } from '@/lib/answerPiping';
import { QUESTION_TYPE_META } from '@/domain/constants/questionTypes';

export const QuestionNode = memo(function QuestionNode({
  id,
  data,
  selected,
}: NodeProps<QuestionNodeData>) {
  const meta = QUESTION_TYPE_META[data.questionType];
  const Icon = meta?.icon;
  const icon = Icon ? <Icon className="h-4 w-4" /> : <HelpCircle className="h-4 w-4" />;
  const typeLabel = meta?.label || 'Question';
  const colors = meta
    ? { header: meta.headerColor, border: meta.borderColor }
    : { header: 'bg-indigo-500', border: 'border-indigo-300 dark:border-indigo-700' };

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
