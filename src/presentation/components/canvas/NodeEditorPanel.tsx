'use client';

/**
 * NodeEditorPanel Component
 * Side panel for editing node properties
 */

import { memo, useCallback, useRef, useState, useMemo } from 'react';
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
  Hash,
  Mail,
  ChevronDown,
  Calendar,
  Gauge,
  AtSign,
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
import {
  getAncestorQuestionNodes,
  getDisplayText,
  buildPipeToken,
} from '@/lib/answerPiping';

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
  number: {
    icon: Hash,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    label: 'Number',
  },
  email: {
    icon: Mail,
    color: 'text-rose-500',
    bgColor: 'bg-rose-100 dark:bg-rose-900/30',
    label: 'Email',
  },
  dropdown: {
    icon: ChevronDown,
    color: 'text-purple-500',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    label: 'Dropdown',
  },
  date: {
    icon: Calendar,
    color: 'text-sky-500',
    bgColor: 'bg-sky-100 dark:bg-sky-900/30',
    label: 'Date',
  },
  nps: {
    icon: Gauge,
    color: 'text-lime-500',
    bgColor: 'bg-lime-100 dark:bg-lime-900/30',
    label: 'NPS Score',
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
  // Subscribe to edges so this component re-renders when edges change,
  // keeping the canDisableBranching() result fresh (e.g. after deleting a target node)
  const edges = useCanvasStore((s) => s.edges);
  const allNodes = useCanvasStore((s) => s.nodes);
  const config = questionTypeConfig[data.questionType];

  // Answer piping state
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [showVariablePicker, setShowVariablePicker] = useState(false);

  const ancestorQuestions = useMemo(
    () => getAncestorQuestionNodes(nodeId, allNodes, edges),
    [nodeId, allNodes, edges]
  );

  const insertVariable = useCallback(
    (refNodeId: string, questionText: string) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      const label = questionText.substring(0, 30).trim();
      const token = buildPipeToken(refNodeId, label);

      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const currentText = data.questionText;
      const newText =
        currentText.substring(0, start) + token + currentText.substring(end);

      updateNodeData(nodeId, { questionText: newText });

      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = start + token.length;
        textarea.focus();
      });

      setShowVariablePicker(false);
    },
    [data.questionText, nodeId, updateNodeData]
  );

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
    data.questionType === 'yes_no' ||
    data.questionType === 'dropdown';

  const showRating = data.questionType === 'rating';
  const showText =
    data.questionType === 'short_text' || data.questionType === 'long_text';
  const showNumber = data.questionType === 'number';
  const showEmail = data.questionType === 'email';
  const showDate = data.questionType === 'date';
  const showNps = data.questionType === 'nps';

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
          ref={textareaRef}
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

        {/* Answer piping: Insert Answer button + picker */}
        <div className="relative">
          <button
            onClick={() => setShowVariablePicker(!showVariablePicker)}
            disabled={ancestorQuestions.length === 0}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-lg transition-colors',
              ancestorQuestions.length === 0
                ? 'text-muted-foreground/50 cursor-not-allowed'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted'
            )}
            title={
              ancestorQuestions.length === 0
                ? 'Connect previous questions to enable answer piping'
                : 'Insert a reference to a previous answer'
            }
          >
            <AtSign className="h-3.5 w-3.5" />
            Insert Answer
          </button>

          <AnimatePresence>
            {showVariablePicker && ancestorQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 top-full left-0 mt-1 w-full bg-card border border-border rounded-xl shadow-lg overflow-hidden"
              >
                <div className="px-3 py-2 text-xs text-muted-foreground border-b border-border bg-muted/30">
                  Reference a previous answer
                </div>
                <div className="max-h-48 overflow-y-auto p-1">
                  {ancestorQuestions.map((node) => {
                    const qData = node.data as QuestionNodeData;
                    const qConfig = questionTypeConfig[qData.questionType];
                    const QIcon = qConfig?.icon;
                    return (
                      <button
                        key={node.id}
                        onClick={() =>
                          insertVariable(node.id, qData.questionText)
                        }
                        className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-muted transition-colors flex items-start gap-2"
                      >
                        {QIcon && (
                          <QIcon
                            className={cn(
                              'h-4 w-4 mt-0.5 shrink-0',
                              qConfig.color
                            )}
                          />
                        )}
                        <div className="min-w-0">
                          <span className="font-medium truncate block">
                            {qData.questionText.substring(0, 40)}
                            {qData.questionText.length > 40 ? '...' : ''}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {qConfig?.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Preview of piped text */}
        {data.questionText.includes('{{') && (
          <div className="px-3 py-2 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <span className="text-xs font-medium text-foreground/70">Preview: </span>
            {getDisplayText(data.questionText)}
          </div>
        )}
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

      {/* Number input settings */}
      {showNumber && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-emerald-500" />
            <label className="text-sm font-semibold text-foreground">
              Number Settings
            </label>
          </div>
          <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 space-y-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={data.placeholder || ''}
                onChange={(e) =>
                  updateNodeData(nodeId, { placeholder: e.target.value })
                }
                className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                placeholder="Enter a number..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Min Value
                </label>
                <input
                  type="number"
                  value={data.minValue ?? ''}
                  onChange={(e) =>
                    updateNodeData(nodeId, {
                      minValue: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Max Value
                </label>
                <input
                  type="number"
                  value={data.maxValue ?? ''}
                  onChange={(e) =>
                    updateNodeData(nodeId, {
                      maxValue: e.target.value ? parseInt(e.target.value) : undefined,
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Email input settings */}
      {showEmail && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-rose-500" />
            <label className="text-sm font-semibold text-foreground">
              Email Settings
            </label>
          </div>
          <input
            type="text"
            value={data.placeholder || ''}
            onChange={(e) =>
              updateNodeData(nodeId, { placeholder: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            placeholder="you@example.com"
          />
        </div>
      )}

      {/* Date settings */}
      {showDate && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-sky-500" />
            <label className="text-sm font-semibold text-foreground">
              Date Settings
            </label>
          </div>
          <input
            type="text"
            value={data.placeholder || ''}
            onChange={(e) =>
              updateNodeData(nodeId, { placeholder: e.target.value })
            }
            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-ring text-sm"
            placeholder="Select a date..."
          />
        </div>
      )}

      {/* NPS settings */}
      {showNps && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-1 h-4 rounded-full bg-lime-500" />
            <label className="text-sm font-semibold text-foreground">
              NPS Scale Labels
            </label>
          </div>
          <div className="p-3 rounded-xl bg-lime-50 dark:bg-lime-900/20 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Low Label (0)
                </label>
                <input
                  type="text"
                  value={data.minLabel || ''}
                  onChange={(e) =>
                    updateNodeData(nodeId, { minLabel: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-lime-200 dark:border-lime-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                  placeholder="Not likely"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  High Label (10)
                </label>
                <input
                  type="text"
                  value={data.maxLabel || ''}
                  onChange={(e) =>
                    updateNodeData(nodeId, { maxLabel: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-lime-200 dark:border-lime-800 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-lime-500 text-sm"
                  placeholder="Very likely"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              NPS uses a fixed 0-10 scale. Scores 0-6 are detractors, 7-8 passive, 9-10 promoters.
            </p>
          </div>
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
