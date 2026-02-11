'use client';

/**
 * EdgeWithCondition Component
 * Custom edge that displays condition labels and allows editing
 * Features: Animated flow direction, improved visuals, condition editing
 */

import { memo, useState } from 'react';
import {
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow,
  type EdgeProps,
} from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { EdgeCondition, ConditionType, MatchMode } from '@/domain/entities/flow';

interface EdgeData {
  condition?: EdgeCondition | null;
  onConditionChange?: (condition: EdgeCondition | null) => void;
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
  id,
}: EdgeProps<EdgeData>) {
  const [isEditing, setIsEditing] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { getNode } = useReactFlow();

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

  // Edge colors with better visual hierarchy
  const strokeColor = hasCondition
    ? '#8B5CF6' // violet-500
    : selected || isHovered
      ? '#6366F1' // indigo-500
      : '#CBD5E1'; // slate-300

  const glowColor = hasCondition
    ? 'rgba(139, 92, 246, 0.3)'
    : 'rgba(99, 102, 241, 0.3)';

  return (
    <>
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

      {/* Animated flow dots */}
      {(selected || isHovered || hasCondition) && (
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
        markerEnd={`url(#arrow-${hasCondition ? 'condition' : selected ? 'selected' : 'default'})`}
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

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <AnimatePresence mode="wait">
            {hasCondition ? (
              <motion.div
                key="condition"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  'bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300',
                  'border-2 border-violet-200 dark:border-violet-700',
                  'cursor-pointer hover:bg-violet-200 dark:hover:bg-violet-800',
                  'shadow-sm hover:shadow-md transition-all'
                )}
                onClick={() => setIsEditing(true)}
              >
                <Zap className="h-3.5 w-3.5" />
                <span className="max-w-[120px] truncate">
                  {formatCondition(data.condition!)}
                </span>
              </motion.div>
            ) : (selected || isHovered) ? (
              <motion.button
                key="add"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={() => setIsEditing(true)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300',
                  'border-2 border-slate-200 dark:border-slate-600',
                  'hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400',
                  'shadow-sm hover:shadow-md transition-all'
                )}
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add logic</span>
              </motion.button>
            ) : null}
          </AnimatePresence>

          {/* Condition Editor Modal */}
          <AnimatePresence>
            {isEditing && (
              <ConditionEditor
                condition={data?.condition}
                sourceNode={sourceNode}
                onSave={(condition) => {
                  data?.onConditionChange?.(condition);
                  setIsEditing(false);
                }}
                onClose={() => setIsEditing(false)}
              />
            )}
          </AnimatePresence>
        </div>
      </EdgeLabelRenderer>
    </>
  );
});

// Format condition for display
function formatCondition(condition: EdgeCondition): string {
  const { type, value, optionIds, matchMode } = condition;

  // Handle multi-select conditions
  if (optionIds && optionIds.length > 0) {
    const modeLabel = matchMode === 'all' ? 'all of' : matchMode === 'exactly' ? 'exactly' : 'any of';
    const count = optionIds.length;
    return `${modeLabel} ${count} option${count > 1 ? 's' : ''}`;
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
  onSave: (condition: EdgeCondition | null) => void;
  onClose: () => void;
}

function ConditionEditor({
  condition,
  sourceNode,
  onSave,
  onClose,
}: ConditionEditorProps) {
  const [type, setType] = useState<ConditionType>(condition?.type || 'equals');
  const [value, setValue] = useState<string>(String(condition?.value || ''));
  const [optionId, setOptionId] = useState<string>(condition?.optionId || '');
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(
    condition?.optionIds || []
  );
  const [matchMode, setMatchMode] = useState<MatchMode>(
    condition?.matchMode || 'any'
  );

  // Get options from source node if it's a multiple choice question
  const nodeData = sourceNode?.data as { options?: { id: string; text: string }[]; questionType?: string } | undefined;
  const options = nodeData?.options || [];
  const isSingleSelect =
    nodeData?.questionType === 'multiple_choice_single' ||
    nodeData?.questionType === 'yes_no';
  const isMultiSelect = nodeData?.questionType === 'multiple_choice_multi';
  const isMultipleChoice = isSingleSelect || isMultiSelect;
  const isRating = nodeData?.questionType === 'rating';

  const toggleOption = (id: string) => {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (isMultiSelect && selectedOptionIds.length > 0) {
      // Multi-select with multiple options
      const selectedTexts = options
        .filter((o) => selectedOptionIds.includes(o.id))
        .map((o) => o.text)
        .join(', ');
      onSave({
        type,
        value: selectedTexts,
        optionIds: selectedOptionIds,
        matchMode,
      });
    } else if (isSingleSelect && optionId) {
      const option = options.find((o) => o.id === optionId);
      onSave({
        type,
        value: option?.text || value,
        optionId,
      });
    } else if (value.trim()) {
      onSave({
        type,
        value: isRating ? Number(value) : value,
      });
    } else {
      onSave(null);
    }
  };

  const handleRemove = () => {
    onSave(null);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      className={cn(
        'absolute top-full left-1/2 -translate-x-1/2 mt-2 z-50',
        'w-72 p-3 rounded-xl bg-card border border-border shadow-xl'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-sm text-foreground">Set Condition</h4>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-muted transition-colors"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>

      <div className="space-y-3">
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
                <option value="contains">Contains</option>
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
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
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
              type={isRating ? 'number' : 'text'}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={isRating ? 'e.g., 3' : 'e.g., Yes'}
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
    </motion.div>
  );
}
