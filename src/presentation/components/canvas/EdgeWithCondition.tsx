'use client';

/**
 * EdgeWithCondition Component
 * Custom edge that displays condition labels and allows editing
 * Features: Animated flow direction, improved visuals, condition editing
 */

import { memo, useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useCanvasStore } from '@/presentation/stores/canvas.store';
import { ConfirmDialog } from './ConfirmDialog';
import type { EdgeCondition, ConditionType, MatchMode } from '@/domain/entities/flow';

interface EdgeData {
  condition?: EdgeCondition | null;
  onConditionChange?: (condition: EdgeCondition | null) => void;
  onDelete?: () => void;
  sourceNodeType?: string;
  hasSiblingConditions?: boolean;
  isOptionBased?: boolean;
}

export const EdgeWithCondition = memo(function EdgeWithCondition({
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  selected,
  data,
  source,
  target,
  id,
}: EdgeProps<EdgeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { getNode } = useReactFlow();
  const searchHighlightIds = useCanvasStore((s) => s.searchHighlightIds);

  // Compute edge dimming based on search: both ends dimmed = fully dim, one end = partial
  const searchActive = searchHighlightIds !== null;
  const sourceInSearch = searchActive && searchHighlightIds.includes(source);
  const targetInSearch = searchActive && searchHighlightIds.includes(target);
  const edgeSearchOpacity = !searchActive ? 1 : (sourceInSearch || targetInSearch) ? 0.4 : 0.1;

  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  });

  // Get source node to determine available conditions
  const sourceNode = getNode(source);
  const hasCondition = data?.condition != null;
  const isFromStart = data?.sourceNodeType === 'start';
  const hasSiblingConditions = data?.hasSiblingConditions ?? false;
  const isOptionBased = data?.isOptionBased ?? false;

  // Edge colors: grey by default, blue on hover/select
  const isActive = selected || isHovered;
  const strokeColor = isActive
    ? hasCondition
      ? '#8B5CF6' // violet-500
      : '#6366F1' // indigo-500
    : '#CBD5E1'; // slate-300

  const glowColor = hasCondition
    ? 'rgba(139, 92, 246, 0.3)'
    : 'rgba(99, 102, 241, 0.3)';

  // Label for unconditioned edges: "Else" when siblings have conditions, otherwise nothing for start edges
  const defaultLabel = hasSiblingConditions ? 'Else' : 'Default';

  return (
    <>
      <g style={{ opacity: edgeSearchOpacity, transition: 'opacity 0.2s ease' }}>
      {/* Glow effect for selected/hovered edges */}
      {(selected || isHovered) && (
        <path
          d={edgePath}
          fill="none"
          stroke={glowColor}
          strokeWidth={8}
          style={{ filter: 'blur(4px)' }}
        />
      )}

      {/* Animated flow dots — only on hover/select */}
      {isActive && (
        <circle r="3" fill={strokeColor}>
          <animateMotion
            dur="1.5s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {/* Main edge path */}
      <BaseEdge
        path={edgePath}
        markerEnd={`url(#arrow-${isActive ? (hasCondition ? 'condition' : 'selected') : 'default'})`}
        style={{
          ...style,
          strokeWidth: selected || isHovered ? 2.5 : 2,
          stroke: strokeColor,
          transition: 'stroke 0.2s ease, stroke-width 0.2s ease',
        }}
      />

      {/* Invisible wider path for easier hover detection */}
      <path
        d={edgePath}
        fill="none"
        stroke="transparent"
        strokeWidth={20}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        style={{ cursor: 'pointer' }}
      />
      </g>

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: edgeSearchOpacity < 0.2 ? 'none' : 'all',
            opacity: edgeSearchOpacity,
            transition: 'opacity 0.2s ease',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Start node edges: no badge at all, just optional delete on hover */}
          {isFromStart ? (
            <AnimatePresence>
              {(isHovered || selected) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1"
                >
                  {data?.onDelete && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteConfirm(true);
                      }}
                      className={cn(
                        'p-1.5 rounded-full transition-all',
                        'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
                        'hover:bg-red-200 dark:hover:bg-red-800/50 hover:scale-110'
                      )}
                      title="Delete connection"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          ) : hasCondition ? (
            /* Condition badge — clickable to edit */
            <div className="flex items-center gap-1">
              <motion.div
                key="condition"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
                  'border-2 border-violet-200 dark:border-violet-700',
                  'shadow-sm transition-all',
                  'cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-800 hover:shadow-md',
                )}
                onClick={() => setIsEditing(true)}
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="max-w-[120px] truncate">
                  {formatCondition(data.condition!)}
                </span>
              </motion.div>
              {/* Delete button on hover */}
              <AnimatePresence>
                {(isHovered || selected) && data?.onDelete && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                    exit={{ opacity: 0, scale: 0.5, width: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className={cn(
                      'p-1 rounded-full transition-colors overflow-hidden',
                      'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
                      'hover:bg-red-200 dark:hover:bg-red-800/50'
                    )}
                    title="Delete connection"
                  >
                    <Trash2 className="h-3 w-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          ) : (
            /* Default/Else badge for question-sourced edges */
            <div className="flex items-center gap-1">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all',
                  hasSiblingConditions
                    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-700'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700',
                  !isOptionBased && (isHovered || selected) && 'cursor-pointer border-indigo-300 dark:border-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 shadow-sm'
                )}
                onClick={!isOptionBased && (isHovered || selected) ? () => setIsEditing(true) : undefined}
              >
                <span>{defaultLabel}</span>
                <AnimatePresence>
                  {!isOptionBased && (isHovered || selected) && !isEditing && (
                    <motion.span
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 'auto', opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      className="overflow-hidden whitespace-nowrap text-indigo-500 dark:text-indigo-400"
                    >
                      — add condition
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              {/* Delete button on hover */}
              <AnimatePresence>
                {(isHovered || selected) && data?.onDelete && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5, width: 0 }}
                    animate={{ opacity: 1, scale: 1, width: 'auto' }}
                    exit={{ opacity: 0, scale: 0.5, width: 0 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirm(true);
                    }}
                    className={cn(
                      'p-1 rounded-full transition-colors overflow-hidden',
                      'bg-red-100 dark:bg-red-900/30 text-red-500 dark:text-red-400',
                      'hover:bg-red-200 dark:hover:bg-red-800/50'
                    )}
                    title="Delete connection"
                  >
                    <Trash2 className="h-3 w-3" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Condition Editor Modal */}
          <AnimatePresence>
            {isEditing && !isFromStart && (
              <ConditionEditor
                condition={data?.condition}
                sourceNode={sourceNode}
                edgeId={id}
                sourceNodeId={source}
                onSave={(condition) => {
                  data?.onConditionChange?.(condition);
                  setIsEditing(false);
                }}
                onClose={() => setIsEditing(false)}
              />
            )}
          </AnimatePresence>
        </div>

        {/* Edge delete confirmation dialog */}
        <ConfirmDialog
          open={showDeleteConfirm}
          title="Delete this connection?"
          message="This will remove the connection and any condition set on it. This action can be undone."
          onConfirm={() => {
            setShowDeleteConfirm(false);
            data?.onDelete?.();
          }}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      </EdgeLabelRenderer>
    </>
  );
});

// Format condition for display
function formatCondition(condition: EdgeCondition): string {
  const { type, value, optionIds } = condition;

  // Handle multi-select checkbox conditions (optionIds = array of selected options)
  if (optionIds && optionIds.length > 0 && Array.isArray(value)) {
    if (value.length === 1) return `includes "${value[0]}"`;
    if (value.length === 2) return `includes "${value[0]}" + "${value[1]}"`;
    return `includes "${value[0]}" +${value.length - 1}`;
  }

  switch (type) {
    case 'equals':
      return `= "${value}"`;
    case 'not_equals':
      return `≠ "${value}"`;
    case 'contains':
      return `contains "${value}"`;
    case 'greater_than':
      return `> ${value}`;
    case 'less_than':
      return `< ${value}`;
    default:
      return String(value);
  }
}

// Condition Editor Component
interface ConditionEditorProps {
  condition?: EdgeCondition | null;
  sourceNode: ReturnType<ReturnType<typeof useReactFlow>['getNode']>;
  edgeId: string;
  sourceNodeId: string;
  onSave: (condition: EdgeCondition | null) => void;
  onClose: () => void;
}

function ConditionEditor({
  condition,
  sourceNode,
  edgeId,
  sourceNodeId,
  onSave,
  onClose,
}: ConditionEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [type, setType] = useState<ConditionType>(condition?.type || 'equals');
  const [value, setValue] = useState<string>(String(condition?.value || ''));
  const [optionId, setOptionId] = useState<string>(condition?.optionId || '');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    condition?.optionIds || []
  );
  const [matchMode, setMatchMode] = useState<MatchMode>(
    condition?.matchMode || 'any'
  );
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  // Get sibling edges for duplicate checking
  const edges = useCanvasStore((s) => s.edges);
  const edgeConditionMap = useCanvasStore((s) => s.edgeConditionMap);

  const siblingEdges = edges.filter(
    (e) => e.source === sourceNodeId && e.id !== edgeId
  );

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // Get options from source node if it's a multiple choice question
  const nodeData = sourceNode?.data as { options?: { id: string; text: string }[]; questionType?: string } | undefined;
  const options = nodeData?.options || [];
  const isSingleSelect =
    nodeData?.questionType === 'multiple_choice_single' ||
    nodeData?.questionType === 'yes_no' ||
    nodeData?.questionType === 'dropdown';
  const isMultiSelect = nodeData?.questionType === 'multiple_choice_multi';
  const isMultipleChoice = isSingleSelect || isMultiSelect;
  const isRating = nodeData?.questionType === 'rating';
  const isNumeric =
    nodeData?.questionType === 'number' ||
    nodeData?.questionType === 'nps';

  const toggleOption = (id: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Check if a new condition duplicates any sibling edge
  const checkDuplicate = (newCondition: EdgeCondition | null): boolean => {
    for (const sibling of siblingEdges) {
      const sibCond = sibling.data?.condition ?? edgeConditionMap[sibling.id];

      // Both are default/else
      if (!newCondition && !sibCond) return true;
      if (!newCondition || !sibCond) continue;

      // Single-select: match by optionId
      if (newCondition.optionId && sibCond.optionId) {
        if (newCondition.optionId === sibCond.optionId) return true;
        continue;
      }

      // Multi-select: match by same set of optionIds (order-independent)
      if (newCondition.optionIds?.length && sibCond.optionIds?.length) {
        if (newCondition.optionIds.length === sibCond.optionIds.length) {
          const sortedNew = [...newCondition.optionIds].sort();
          const sortedSib = [...sibCond.optionIds].sort();
          if (sortedNew.every((id, i) => id === sortedSib[i])) return true;
        }
        continue;
      }

      // Text/number: match by type + value
      if (newCondition.type === sibCond.type && newCondition.value === sibCond.value) {
        return true;
      }
    }
    return false;
  };

  const handleSave = () => {
    let newCondition: EdgeCondition | null = null;

    if (isMultiSelect && selectedOptionIds.length > 0) {
      const selectedTexts = options
        .filter((o) => selectedOptionIds.includes(o.id))
        .map((o) => o.text)
        .join(', ');
      newCondition = {
        type,
        value: selectedTexts,
        optionIds: selectedOptionIds,
        matchMode,
      };
    } else if (isSingleSelect && optionId) {
      const option = options.find((o) => o.id === optionId);
      newCondition = {
        type,
        value: option?.text || value,
        optionId,
      };
    } else if (value.trim()) {
      newCondition = {
        type,
        value: isRating || isNumeric ? Number(value) : value,
      };
    }

    // Check for duplicates before saving
    if (checkDuplicate(newCondition)) {
      toast.error(
        newCondition
          ? 'Another edge already has this same condition.'
          : 'A default (Else) edge already exists.'
      );
      return;
    }

    onSave(newCondition);
  };

  const handleRemove = () => {
    setShowRemoveConfirm(true);
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      className="fixed inset-0 z-[9998] flex items-center justify-center"
      onClick={onClose}
    >
      {/* Backdrop blur */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Editor card */}
      <motion.div
        ref={editorRef}
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 10 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          'relative w-80 max-h-[80vh] rounded-xl bg-card border border-border shadow-2xl',
          'flex flex-col'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Zap className="h-3.5 w-3.5 text-violet-500 dark:text-violet-400" />
            </div>
            <h4 className="font-semibold text-sm text-foreground">Set Condition</h4>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto px-4 pb-4 space-y-3">
          {/* Condition Type */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              When answer
            </label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ConditionType)}
              className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="equals">Equals</option>
              <option value="not_equals">Does not equal</option>
              {!isMultipleChoice && (
                <>
                  {!isNumeric && <option value="contains">Contains</option>}
                  <option value="greater_than">Greater than</option>
                  <option value="less_than">Less than</option>
                </>
              )}
            </select>
          </div>

          {/* Match Mode for Multi-Select */}
          {isMultiSelect && (
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Match mode
              </label>
              <select
                value={matchMode}
                onChange={(e) => setMatchMode(e.target.value as MatchMode)}
                className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="any">Any of selected</option>
                <option value="all">All of selected</option>
                <option value="exactly">Exactly selected</option>
              </select>
            </div>
          )}

          {/* Value */}
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              {isMultiSelect ? 'Select options' : 'Value'}
            </label>
            {isMultiSelect && options.length > 0 ? (
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {options.map((opt) => (
                  <label
                    key={opt.id}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors',
                      selectedOptionIds.includes(opt.id)
                        ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                        : 'hover:bg-muted'
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOptionIds.includes(opt.id)}
                      onChange={() => toggleOption(opt.id)}
                      className="rounded border-input"
                    />
                    <span className="text-sm truncate">{opt.text}</span>
                  </label>
                ))}
              </div>
            ) : isSingleSelect && options.length > 0 ? (
              <select
                value={optionId}
                onChange={(e) => {
                  setOptionId(e.target.value);
                  const opt = options.find((o) => o.id === e.target.value);
                  if (opt) setValue(opt.text);
                }}
                className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Select option...</option>
                {options.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.text}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={isRating || isNumeric ? 'number' : 'text'}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={isRating || isNumeric ? 'e.g., 3' : 'e.g., Yes'}
                className="w-full px-2 py-1.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSave}
              className="flex-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Save
            </button>
            {condition && (
              <button
                onClick={handleRemove}
                className="px-3 py-1.5 rounded-lg bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        {/* Condition remove confirmation dialog */}
        <ConfirmDialog
          open={showRemoveConfirm}
          title="Remove this condition?"
          message="The connection will remain but the condition will be removed. This action can be undone."
          confirmLabel="Remove"
          onConfirm={() => {
            setShowRemoveConfirm(false);
            onSave(null);
          }}
          onCancel={() => setShowRemoveConfirm(false)}
        />
      </motion.div>
    </motion.div>,
    document.body
  );
}
