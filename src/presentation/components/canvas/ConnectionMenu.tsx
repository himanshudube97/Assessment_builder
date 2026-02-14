'use client';

/**
 * ConnectionMenu Component
 * Floating menu that appears when clicking "+" on a node.
 * Allows connecting to existing nodes or creating new ones.
 * For option-based types, shows an option/condition picker first.
 */

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Flag,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
  GitBranch,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCanvasStore } from '@/presentation/stores/canvas.store';
import type { QuestionNodeData, QuestionType, EdgeCondition } from '@/domain/entities/flow';
import { QUESTION_TYPES_LIST } from '@/domain/constants/questionTypes';

interface ConnectionMenuProps {
  sourceNodeId: string;
  onClose: () => void;
}

export function ConnectionMenu({ sourceNodeId, onClose }: ConnectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const edgeConditionMap = useCanvasStore((s) => s.edgeConditionMap);
  const addNodeWithEdge = useCanvasStore((s) => s.addNodeWithEdge);

  // Source node info
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const sourceData = sourceNode?.data as QuestionNodeData | undefined;
  const sourceOptions = sourceData?.options;
  const sourceType = sourceData?.questionType;

  // Single-select option-based types (one option per edge, mutually exclusive)
  const isSingleSelect =
    sourceType === 'yes_no' ||
    sourceType === 'multiple_choice_single' ||
    sourceType === 'dropdown';

  // Multi-select: checkboxes (multiple options per edge, options can overlap)
  const isMultiSelect = sourceType === 'multiple_choice_multi';

  // Either type needs the condition picker
  const needsConditionPick = (isSingleSelect || isMultiSelect) && !!sourceOptions?.length;

  // Count existing edges from this source
  const outgoingEdges = edges.filter((e) => e.source === sourceNodeId);
  const hasDefaultEdge = outgoingEdges.some(
    (e) => {
      const cond = e.data?.condition ?? edgeConditionMap[e.id];
      return cond == null;
    }
  );

  // Compute uncovered options for single-select types (each option can only be in one edge)
  const uncoveredOptions = isSingleSelect && sourceOptions
    ? sourceOptions.filter((opt) => {
        return !outgoingEdges.some((e) => {
          const cond = e.data?.condition ?? edgeConditionMap[e.id];
          return cond?.optionId === opt.id;
        });
      })
    : [];

  // For single-select: at limit when all options are covered AND a default edge exists
  // For multi-select: never at limit (same option can appear in multiple combo edges)
  const atTotalLimit = isSingleSelect && uncoveredOptions.length === 0 && hasDefaultEdge;

  // Show condition picker when needed
  const showConditionPicker = needsConditionPick && !atTotalLimit;

  const [phase, setPhase] = useState<'option-pick' | 'main' | 'type-picker'>(
    showConditionPicker ? 'option-pick' : 'main'
  );
  const [selectedCondition, setSelectedCondition] = useState<EdgeCondition | null | undefined>(undefined);

  // Multi-select checkbox state (for checkbox question types)
  const [checkedOptionIds, setCheckedOptionIds] = useState<string[]>([]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (phase === 'type-picker') {
          setPhase('main');
        } else if (phase === 'main' && showConditionPicker) {
          setPhase('option-pick');
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, phase, showConditionPicker]);


  // Single-select: pick one option
  const handleSelectOption = (condition: EdgeCondition | null) => {
    setSelectedCondition(condition);
    setPhase('main');
  };

  // Multi-select: toggle checkbox
  const toggleCheckboxOption = (optId: string) => {
    setCheckedOptionIds((prev) =>
      prev.includes(optId) ? prev.filter((id) => id !== optId) : [...prev, optId]
    );
  };

  // Multi-select: confirm selection and build condition
  const handleConfirmMultiSelect = () => {
    if (!sourceOptions || checkedOptionIds.length === 0) return;

    // Check for duplicate: same set of optionIds already exists on another edge
    const sortedNew = [...checkedOptionIds].sort();
    const isDuplicate = outgoingEdges.some((e) => {
      const cond = e.data?.condition ?? edgeConditionMap[e.id];
      if (!cond?.optionIds?.length) return false;
      if (cond.optionIds.length !== sortedNew.length) return false;
      const sortedExisting = [...cond.optionIds].sort();
      return sortedNew.every((id, i) => id === sortedExisting[i]);
    });

    if (isDuplicate) {
      toast.error('This combination already has an edge.');
      onClose();
      return;
    }

    const selectedTexts = sourceOptions
      .filter((o) => checkedOptionIds.includes(o.id))
      .map((o) => o.text);
    const condition: EdgeCondition = {
      type: 'equals',
      value: selectedTexts,
      optionIds: checkedOptionIds,
    };
    setSelectedCondition(condition);
    setCheckedOptionIds([]);
    setPhase('main');
  };

  const handleCreateNew = (type: 'question' | 'end', questionType?: QuestionType) => {
    addNodeWithEdge(type, sourceNodeId, questionType, selectedCondition);
    onClose();
  };

  // Label for the selected condition shown in the main menu header
  const conditionLabel = selectedCondition
    ? Array.isArray(selectedCondition.value)
      ? selectedCondition.value.length === 1
        ? `includes "${selectedCondition.value[0]}"`
        : `includes "${selectedCondition.value[0]}" +${selectedCondition.value.length - 1}`
      : `= "${selectedCondition.value}"`
    : selectedCondition === null
      ? 'Else (default)'
      : null;

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -12, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.92 }}
      transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
      className={cn(
        'w-72 rounded-2xl bg-card/95 backdrop-blur-xl border border-border/60 shadow-[0_12px_48px_rgba(0,0,0,0.15)] ring-1 ring-black/5 overflow-hidden',
        'nodrag nopan nowheel'
      )}
      onClick={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      {/* Edge limit warning */}
      {atTotalLimit && (
        <div className="px-3 pt-3 pb-2 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            All {sourceOptions?.length} options are covered. Remove an edge to add more branches.
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {phase === 'option-pick' ? (
          /* Condition picker */
          <motion.div
            key="option-pick"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.12 }}
          >
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Route by option
              </span>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-muted/80 transition-all duration-200 hover:scale-110">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto px-1.5 pb-1.5">
              {isSingleSelect ? (
                /* Single-select: one-click per option */
                <>
                  {uncoveredOptions.map((opt) => (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption({
                        type: 'equals',
                        value: opt.text,
                        optionId: opt.id,
                      })}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm text-left font-medium',
                        'hover:bg-muted/80 transition-all duration-200 hover:scale-[1.02] group'
                      )}
                    >
                      <GitBranch className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                      <span className="text-foreground truncate">= &quot;{opt.text}&quot;</span>
                    </button>
                  ))}
                </>
              ) : isMultiSelect && sourceOptions ? (
                /* Multi-select: checkboxes with confirm button */
                <>
                  {sourceOptions.map((opt) => (
                    <label
                      key={opt.id}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm cursor-pointer',
                        'transition-colors',
                        checkedOptionIds.includes(opt.id)
                          ? 'bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300'
                          : 'hover:bg-muted text-foreground'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checkedOptionIds.includes(opt.id)}
                        onChange={() => toggleCheckboxOption(opt.id)}
                        className="rounded border-input accent-violet-600"
                      />
                      <span className="truncate">{opt.text}</span>
                    </label>
                  ))}
                  {checkedOptionIds.length > 0 && (
                    <button
                      onClick={handleConfirmMultiSelect}
                      className={cn(
                        'w-full flex items-center justify-center gap-2 px-3 py-2.5 mt-2 rounded-xl text-sm font-semibold',
                        'bg-gradient-to-br from-violet-500 to-violet-600 text-white',
                        'shadow-[0_4px_12px_rgba(139,92,246,0.25)]',
                        'hover:shadow-[0_6px_20px_rgba(139,92,246,0.35)] hover:scale-[1.02]',
                        'transition-all duration-200'
                      )}
                    >
                      <GitBranch className="h-4 w-4" />
                      <span>
                        Create branch
                        {checkedOptionIds.length > 1 && ` (${checkedOptionIds.length} options)`}
                      </span>
                    </button>
                  )}
                </>
              ) : null}

              {/* Else option — only if no default edge already exists */}
              {!hasDefaultEdge && (
                <>
                  {(isSingleSelect || isMultiSelect) && (
                    <div className="border-t border-border my-1" />
                  )}
                  <button
                    onClick={() => handleSelectOption(null)}
                    className={cn(
                      'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left',
                      'hover:bg-muted transition-colors'
                    )}
                  >
                    <GitBranch className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    <span className="text-foreground">Else (all other options)</span>
                  </button>
                </>
              )}
            </div>
          </motion.div>
        ) : phase === 'type-picker' ? (
          /* Question type picker sub-menu */
          <motion.div
            key="type-picker"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.12 }}
          >
            <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
              <button
                onClick={() => setPhase('main')}
                className="p-0.5 rounded hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Question type
              </span>
              <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>
            <div className="max-h-105 overflow-y-auto px-1.5 pb-1.5">
              {QUESTION_TYPES_LIST.map(([type, meta]) => {
                const Icon = meta.icon;
                return (
                  <button
                    key={type}
                    onClick={() => handleCreateNew('question', type)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-lg text-left',
                      'hover:bg-muted transition-colors',
                    )}
                  >
                    <span className={cn(
                      'shrink-0 w-8 h-8 rounded-lg flex items-center justify-center',
                      meta.bgColor,
                    )}>
                      <Icon className={cn('h-4 w-4', meta.color)} />
                    </span>
                    <div className="flex flex-col min-w-0">
                      <span className="text-sm font-medium text-foreground">{meta.label}</span>
                      <span className="text-[11px] text-muted-foreground truncate">{meta.description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        ) : (
          /* Main menu — target picker */
          <motion.div
            key="main-menu"
            initial={{ opacity: 0, x: showConditionPicker ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.12 }}
          >
            {/* Header with optional condition label */}
            <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
              {conditionLabel && (
                <button
                  onClick={() => setPhase('option-pick')}
                  className="p-0.5 rounded hover:bg-muted transition-colors"
                >
                  <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
              )}
              {conditionLabel ? (
                <span className={cn(
                  'flex-1 text-xs font-medium px-2 py-0.5 rounded-full w-fit',
                  selectedCondition
                    ? 'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300'
                    : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
                )}>
                  {conditionLabel}
                </span>
              ) : (
                <span className="flex-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Connect to
                </span>
              )}
              <button onClick={onClose} className="p-0.5 rounded hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </div>

            {/* Create new */}
            {!atTotalLimit && (
              <div className="p-1.5">
                <button
                  onClick={() => setPhase('type-picker')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm',
                    'hover:bg-muted transition-colors',
                  )}
                >
                  <Plus className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="flex-1 text-left text-foreground">New Question</span>
                  <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <button
                  onClick={() => handleCreateNew('end')}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm',
                    'hover:bg-muted transition-colors',
                  )}
                >
                  <Flag className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                  <span className="text-foreground">End Screen</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
