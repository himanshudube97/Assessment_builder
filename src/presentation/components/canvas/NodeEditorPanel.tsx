'use client';

/**
 * NodeEditorPanel Component
 * Side panel for editing node properties
 */

import { memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Plus,
  Trash2,
  GripVertical,
  Play,
  Flag,
  CircleDot,
  CheckSquare,
  Type,
  AlignLeft,
  Star,
  ToggleLeft,
  Sparkles,
  GitBranch,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasStore, useSelectedNode } from '@/presentation/stores/canvas.store';
import type {
  StartNodeData,
  QuestionNodeData,
  EndNodeData,
  QuestionOption,
  QuestionType,
} from '@/domain/entities/flow';

// Color and icon mapping for question types
const questionTypeConfig: Record<
  QuestionType,
  { icon: React.ElementType; color: string; bgColor: string; label: string }
> = {
  multiple_choice_single: {
    icon: CircleDot,
    color: 'text-orange-500',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    label: 'Multiple Choice',
  },
  multiple_choice_multi: {
    icon: CheckSquare,
    color: 'text-amber-500',
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Checkboxes',
  },
  short_text: {
    icon: Type,
    color: 'text-blue-500',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Short Text',
  },
  long_text: {
    icon: AlignLeft,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    label: 'Long Text',
  },
  rating: {
    icon: Star,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
    label: 'Rating Scale',
  },
  yes_no: {
    icon: ToggleLeft,
    color: 'text-teal-500',
    bgColor: 'bg-teal-100 dark:bg-teal-900/30',
    label: 'Yes / No',
  },
};

export const NodeEditorPanel = memo(function NodeEditorPanel() {
  const isPanelOpen = useCanvasStore((s) => s.isPanelOpen);
  const closePanel = useCanvasStore((s) => s.closePanel);
  const selectedNode = useSelectedNode();

  if (!selectedNode) return null;

  // Determine header styling based on node type
  const getHeaderConfig = () => {
    if (selectedNode.type === 'start') {
      return {
        icon: Play,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
        borderColor: 'border-emerald-200 dark:border-emerald-800',
        label: 'Start Screen',
      };
    }
    if (selectedNode.type === 'end') {
      return {
        icon: Flag,
        color: 'text-violet-500',
        bgColor: 'bg-violet-100 dark:bg-violet-900/30',
        borderColor: 'border-violet-200 dark:border-violet-800',
        label: 'End Screen',
      };
    }
    // Question node
    const questionData = selectedNode.data as QuestionNodeData;
    const config = questionTypeConfig[questionData.questionType];
    return {
      ...config,
      borderColor: config.bgColor.replace('bg-', 'border-').replace('/30', '/50'),
    };
  };

  const headerConfig = getHeaderConfig();
  const HeaderIcon = headerConfig.icon;

  return (
    <AnimatePresence>
      {isPanelOpen && (
        <motion.div
          initial={{ x: '100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="w-80 bg-card border-l border-border flex flex-col h-full shadow-xl"
        >
          {/* Colorful Header */}
          <div className={cn('p-4 border-b', headerConfig.bgColor, headerConfig.borderColor)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg bg-white/80 dark:bg-black/20 shadow-sm', headerConfig.color)}>
                  <HeaderIcon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-semibold text-foreground">
                    Edit {selectedNode.type === 'start' ? 'Start' : selectedNode.type === 'end' ? 'End' : 'Question'}
                  </h2>
                  <p className="text-xs text-muted-foreground">{headerConfig.label}</p>
                </div>
              </div>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-lg hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
              >
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedNode.type === 'start' && (
              <StartNodeEditor
                nodeId={selectedNode.id}
                data={selectedNode.data as StartNodeData}
              />
            )}
            {selectedNode.type === 'question' && (
              <QuestionNodeEditor
                nodeId={selectedNode.id}
                data={selectedNode.data as QuestionNodeData}
              />
            )}
            {selectedNode.type === 'end' && (
              <EndNodeEditor
                nodeId={selectedNode.id}
                data={selectedNode.data as EndNodeData}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// ============================================
// Start Node Editor
// ============================================

interface StartNodeEditorProps {
  nodeId: string;
  data: StartNodeData;
}

const StartNodeEditor = memo(function StartNodeEditor({
  nodeId,
  data,
}: StartNodeEditorProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-emerald-500" />
          <label className="text-sm font-semibold text-foreground">
            Welcome Title
          </label>
        </div>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateNodeData(nodeId, { title: e.target.value })}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border-2 bg-background text-foreground',
            'focus:outline-none transition-colors',
            'border-muted hover:border-muted-foreground/30',
            'focus:border-emerald-500 focus:ring-0'
          )}
          placeholder="Welcome"
        />
      </div>

      {/* Description */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-emerald-400" />
          <label className="text-sm font-semibold text-foreground">
            Description
          </label>
        </div>
        <textarea
          value={data.description}
          onChange={(e) =>
            updateNodeData(nodeId, { description: e.target.value })
          }
          rows={3}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border-2 bg-background text-foreground',
            'focus:outline-none transition-colors resize-none',
            'border-muted hover:border-muted-foreground/30',
            'focus:border-emerald-500 focus:ring-0'
          )}
          placeholder="Thank you for taking this assessment..."
        />
      </div>

      {/* Button Text */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-emerald-300" />
          <label className="text-sm font-semibold text-foreground">
            Button Text
          </label>
        </div>
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
          <input
            type="text"
            value={data.buttonText}
            onChange={(e) =>
              updateNodeData(nodeId, { buttonText: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-700 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="Start"
          />
          <p className="text-xs text-muted-foreground mt-2">
            This button will start the assessment
          </p>
        </div>
      </div>
    </div>
  );
});

// ============================================
// Question Node Editor
// ============================================

interface QuestionNodeEditorProps {
  nodeId: string;
  data: QuestionNodeData;
}

const QuestionNodeEditor = memo(function QuestionNodeEditor({
  nodeId,
  data,
}: QuestionNodeEditorProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);
  const toggleBranching = useCanvasStore((s) => s.toggleBranching);
  const canDisableBranching = useCanvasStore((s) => s.canDisableBranching);
  const config = questionTypeConfig[data.questionType];

  const addOption = useCallback(() => {
    const newOption: QuestionOption = {
      id: `opt-${Date.now()}`,
      text: `Option ${(data.options?.length || 0) + 1}`,
    };
    updateNodeData(nodeId, {
      options: [...(data.options || []), newOption],
    });
  }, [nodeId, data.options, updateNodeData]);

  const updateOption = useCallback(
    (optionId: string, text: string) => {
      updateNodeData(nodeId, {
        options: data.options?.map((opt) =>
          opt.id === optionId ? { ...opt, text } : opt
        ),
      });
    },
    [nodeId, data.options, updateNodeData]
  );

  const deleteOption = useCallback(
    (optionId: string) => {
      updateNodeData(nodeId, {
        options: data.options?.filter((opt) => opt.id !== optionId),
      });
    },
    [nodeId, data.options, updateNodeData]
  );

  const showOptions =
    data.questionType === 'multiple_choice_single' ||
    data.questionType === 'multiple_choice_multi' ||
    data.questionType === 'yes_no';

  const showRating = data.questionType === 'rating';
  const showText =
    data.questionType === 'short_text' || data.questionType === 'long_text';

  return (
    <div className="space-y-5">
      {/* Question Text Section */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className={cn('w-1 h-4 rounded-full', config.color.replace('text-', 'bg-'))} />
          <label className="text-sm font-semibold text-foreground">
            Question
          </label>
        </div>
        <textarea
          value={data.questionText}
          onChange={(e) =>
            updateNodeData(nodeId, { questionText: e.target.value })
          }
          rows={2}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border-2 bg-background text-foreground',
            'focus:outline-none transition-colors resize-none',
            'border-muted hover:border-muted-foreground/30',
            'focus:border-primary focus:ring-0'
          )}
          placeholder="Enter your question..."
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm text-muted-foreground">
          Description (optional)
        </label>
        <input
          type="text"
          value={data.description || ''}
          onChange={(e) =>
            updateNodeData(nodeId, { description: e.target.value || null })
          }
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Additional context..."
        />
      </div>

      {/* Options for multiple choice */}
      {showOptions && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-1 h-4 rounded-full', config.color.replace('text-', 'bg-'))} />
            <label className="text-sm font-semibold text-foreground">
              Options
            </label>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {data.options?.length || 0}
            </span>
          </div>
          <div className="space-y-2">
            {data.options?.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  'flex items-center gap-2 p-1 rounded-lg',
                  'hover:bg-muted/50 transition-colors group'
                )}
              >
                <div className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors">
                  <GripVertical className="h-4 w-4" />
                </div>
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs font-medium',
                  config.color.replace('text-', 'border-'),
                  config.color
                )}>
                  {index + 1}
                </div>
                <input
                  type="text"
                  value={option.text}
                  onChange={(e) => updateOption(option.id, e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
                />
                {data.options && data.options.length > 2 && (
                  <button
                    onClick={() => deleteOption(option.id)}
                    className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-100 dark:hover:bg-red-900/30 text-muted-foreground hover:text-red-500 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
            <button
              onClick={addOption}
              className={cn(
                'flex items-center gap-2 w-full px-3 py-2.5 rounded-xl',
                'border-2 border-dashed transition-all text-sm',
                'border-muted-foreground/20 text-muted-foreground',
                'hover:border-primary/50 hover:text-primary hover:bg-primary/5'
              )}
            >
              <Plus className="h-4 w-4" />
              Add Option
            </button>
          </div>
        </div>
      )}

      {/* Rating scale settings */}
      {showRating && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-yellow-500" />
            <label className="text-sm font-semibold text-foreground">
              Scale Range
            </label>
          </div>
          <div className="p-3 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Min Value
                </label>
                <input
                  type="number"
                  value={data.minValue || 1}
                  onChange={(e) =>
                    updateNodeData(nodeId, { minValue: parseInt(e.target.value) })
                  }
                  min={0}
                  max={10}
                  className="w-full px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Max Value
                </label>
                <input
                  type="number"
                  value={data.maxValue || 5}
                  onChange={(e) =>
                    updateNodeData(nodeId, { maxValue: parseInt(e.target.value) })
                  }
                  min={2}
                  max={10}
                  className="w-full px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Min Label
                </label>
                <input
                  type="text"
                  value={data.minLabel || ''}
                  onChange={(e) =>
                    updateNodeData(nodeId, { minLabel: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                  placeholder="Poor"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Max Label
                </label>
                <input
                  type="text"
                  value={data.maxLabel || ''}
                  onChange={(e) =>
                    updateNodeData(nodeId, { maxLabel: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-yellow-200 dark:border-yellow-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-yellow-500 text-sm"
                  placeholder="Excellent"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Text input settings */}
      {showText && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className={cn('w-1 h-4 rounded-full', config.color.replace('text-', 'bg-'))} />
            <label className="text-sm font-semibold text-foreground">
              Input Settings
            </label>
          </div>
          <input
            type="text"
            value={data.placeholder || ''}
            onChange={(e) =>
              updateNodeData(nodeId, { placeholder: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            placeholder="Enter your answer..."
          />
        </div>
      )}

      {/* Option branching toggle - only for multiple choice single */}
      {data.questionType === 'multiple_choice_single' && (() => {
        const canToggleOff = !data.enableBranching || canDisableBranching(nodeId);
        return (
          <div className={cn(
            'flex items-center justify-between p-3 rounded-xl',
            'bg-gradient-to-r from-indigo-500/5 to-indigo-500/10',
            'border border-indigo-200 dark:border-indigo-800'
          )}>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <GitBranch className="h-4 w-4 text-indigo-500" />
                <label className="text-sm font-medium text-foreground">Option Branching</label>
              </div>
              <p className="text-xs text-muted-foreground pl-6">
                {data.enableBranching && !canToggleOff
                  ? 'Remove extra branches to disable'
                  : 'Route to different paths per option'}
              </p>
            </div>
            <button
              onClick={() => {
                if (data.enableBranching && !canToggleOff) return;
                toggleBranching(nodeId, !data.enableBranching);
              }}
              disabled={data.enableBranching && !canToggleOff}
              className={cn(
                'relative w-12 h-7 rounded-full transition-colors flex-shrink-0',
                data.enableBranching ? 'bg-indigo-500' : 'bg-muted',
                data.enableBranching && !canToggleOff && 'opacity-50 cursor-not-allowed'
              )}
            >
              <motion.div
                animate={{ x: data.enableBranching ? 22 : 3 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
              />
            </button>
          </div>
        );
      })()}

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Required toggle */}
      <div className={cn(
        'flex items-center justify-between p-3 rounded-xl',
        'bg-gradient-to-r from-primary/5 to-primary/10',
        'border border-primary/20'
      )}>
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <label className="text-sm font-medium text-foreground">Required</label>
        </div>
        <button
          onClick={() => updateNodeData(nodeId, { required: !data.required })}
          className={cn(
            'relative w-12 h-7 rounded-full transition-colors',
            data.required ? 'bg-primary' : 'bg-muted'
          )}
        >
          <motion.div
            animate={{ x: data.required ? 22 : 3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
          />
        </button>
      </div>
    </div>
  );
});

// ============================================
// End Node Editor
// ============================================

interface EndNodeEditorProps {
  nodeId: string;
  data: EndNodeData;
}

const EndNodeEditor = memo(function EndNodeEditor({
  nodeId,
  data,
}: EndNodeEditorProps) {
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  return (
    <div className="space-y-5">
      {/* Title */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-violet-500" />
          <label className="text-sm font-semibold text-foreground">
            Thank You Title
          </label>
        </div>
        <input
          type="text"
          value={data.title}
          onChange={(e) => updateNodeData(nodeId, { title: e.target.value })}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border-2 bg-background text-foreground',
            'focus:outline-none transition-colors',
            'border-muted hover:border-muted-foreground/30',
            'focus:border-violet-500 focus:ring-0'
          )}
          placeholder="Thank You!"
        />
      </div>

      {/* Description */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-violet-400" />
          <label className="text-sm font-semibold text-foreground">
            Message
          </label>
        </div>
        <textarea
          value={data.description}
          onChange={(e) =>
            updateNodeData(nodeId, { description: e.target.value })
          }
          rows={3}
          className={cn(
            'w-full px-3 py-2.5 rounded-xl border-2 bg-background text-foreground',
            'focus:outline-none transition-colors resize-none',
            'border-muted hover:border-muted-foreground/30',
            'focus:border-violet-500 focus:ring-0'
          )}
          placeholder="Your response has been recorded..."
        />
      </div>

      {/* Redirect URL */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 rounded-full bg-violet-300" />
          <label className="text-sm font-semibold text-foreground">
            Redirect URL
          </label>
          <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
            optional
          </span>
        </div>
        <input
          type="url"
          value={data.redirectUrl || ''}
          onChange={(e) =>
            updateNodeData(nodeId, { redirectUrl: e.target.value || null })
          }
          className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-violet-500"
          placeholder="https://..."
        />
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Show score toggle */}
      <div className={cn(
        'flex items-center justify-between p-3 rounded-xl',
        'bg-gradient-to-r from-violet-500/5 to-violet-500/10',
        'border border-violet-200 dark:border-violet-800'
      )}>
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-violet-500" />
          <label className="text-sm font-medium text-foreground">
            Show Score
          </label>
        </div>
        <button
          onClick={() =>
            updateNodeData(nodeId, { showScore: !data.showScore })
          }
          className={cn(
            'relative w-12 h-7 rounded-full transition-colors',
            data.showScore ? 'bg-violet-500' : 'bg-muted'
          )}
        >
          <motion.div
            animate={{ x: data.showScore ? 22 : 3 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-md"
          />
        </button>
      </div>
    </div>
  );
});
