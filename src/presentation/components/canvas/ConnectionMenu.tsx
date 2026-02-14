'use client';

/**
 * ConnectionMenu Component
 * Floating menu that appears when clicking "+" on a node.
 * Allows connecting to existing nodes or creating new ones.
 * Respects edge count limits for option-based question types.
 */

import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Flag,
  HelpCircle,
  CircleDot,
  CheckSquare,
  Type,
  AlignLeft,
  Star,
  ToggleLeft,
  Hash,
  Mail,
  ChevronDown,
  Calendar,
  Gauge,
  ChevronRight,
  ArrowLeft,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/presentation/stores/canvas.store';
import type { QuestionNodeData, QuestionType } from '@/domain/entities/flow';

interface ConnectionMenuProps {
  sourceNodeId: string;
  onClose: () => void;
}

const questionTypes: { type: QuestionType; label: string; icon: React.ReactNode }[] = [
  { type: 'multiple_choice_single', label: 'Multiple Choice', icon: <CircleDot className="h-3.5 w-3.5" /> },
  { type: 'multiple_choice_multi', label: 'Checkboxes', icon: <CheckSquare className="h-3.5 w-3.5" /> },
  { type: 'yes_no', label: 'Yes / No', icon: <ToggleLeft className="h-3.5 w-3.5" /> },
  { type: 'short_text', label: 'Short Text', icon: <Type className="h-3.5 w-3.5" /> },
  { type: 'long_text', label: 'Long Text', icon: <AlignLeft className="h-3.5 w-3.5" /> },
  { type: 'rating', label: 'Rating', icon: <Star className="h-3.5 w-3.5" /> },
  { type: 'number', label: 'Number', icon: <Hash className="h-3.5 w-3.5" /> },
  { type: 'email', label: 'Email', icon: <Mail className="h-3.5 w-3.5" /> },
  { type: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="h-3.5 w-3.5" /> },
  { type: 'date', label: 'Date', icon: <Calendar className="h-3.5 w-3.5" /> },
  { type: 'nps', label: 'NPS Score', icon: <Gauge className="h-3.5 w-3.5" /> },
];

export function ConnectionMenu({ sourceNodeId, onClose }: ConnectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const addNodeWithEdge = useCanvasStore((s) => s.addNodeWithEdge);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid catching the click that opened the menu
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
        if (showTypePicker) {
          setShowTypePicker(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose, showTypePicker]);

  // Source node info for edge limit checks
  const sourceNode = nodes.find((n) => n.id === sourceNodeId);
  const sourceData = sourceNode?.data as QuestionNodeData | undefined;
  const sourceOptions = sourceData?.options;
  const sourceType = sourceData?.questionType;

  // Count existing edges from this source
  const outgoingEdges = edges.filter((e) => e.source === sourceNodeId);
  const conditionalEdgeCount = outgoingEdges.filter(
    (e) => e.data?.condition != null
  ).length;
  const hasDefaultEdge = outgoingEdges.some(
    (e) => e.data?.condition == null
  );

  // Determine max allowed edges for option-based types
  const isOptionBased =
    sourceType === 'yes_no' ||
    sourceType === 'multiple_choice_single' ||
    sourceType === 'dropdown';
  const maxConditionalEdges = isOptionBased && sourceOptions
    ? sourceOptions.length
    : undefined; // unlimited for text, number, etc.

  // Check if we've reached the edge limit
  // For option-based: max N conditional + 1 default = N+1 total
  // For others: unlimited conditional + 1 default
  const atConditionalLimit =
    maxConditionalEdges !== undefined && conditionalEdgeCount >= maxConditionalEdges;
  const atTotalLimit = atConditionalLimit && hasDefaultEdge;

  // Connectable targets: question + end nodes, excluding self and already-connected targets
  const connectedTargets = new Set(
    edges.filter((e) => e.source === sourceNodeId).map((e) => e.target)
  );

  const connectableNodes = nodes.filter((n) => {
    if (n.id === sourceNodeId) return false;
    if (n.type === 'start') return false;
    if (connectedTargets.has(n.id)) return false;
    return true;
  });

  const handleConnectExisting = (targetNodeId: string) => {
    onConnect({
      source: sourceNodeId,
      target: targetNodeId,
      sourceHandle: null,
      targetHandle: null,
    });
    onClose();
  };

  const handleCreateNew = (type: 'question' | 'end', questionType?: QuestionType) => {
    addNodeWithEdge(type, sourceNodeId, questionType);
    onClose();
  };

  const getNodeLabel = (node: typeof nodes[0]) => {
    if (node.type === 'end') {
      return (node.data as { title?: string })?.title || 'End Screen';
    }
    const data = node.data as QuestionNodeData;
    return data?.questionText || 'Untitled question';
  };

  const getNodeTypeIcon = (node: typeof nodes[0]) => {
    if (node.type === 'end') return <Flag className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />;
    return <HelpCircle className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />;
  };

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={cn(
        'w-64 rounded-xl bg-card border border-border shadow-xl overflow-hidden',
        'nodrag nopan'
      )}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Edge limit warning */}
      {atTotalLimit && (
        <div className="px-3 pt-3 pb-2 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20">
          <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
          <span>
            All {sourceOptions?.length} options are covered. Remove a condition to add more branches.
          </span>
        </div>
      )}

      <AnimatePresence mode="wait">
        {showTypePicker ? (
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
                onClick={() => setShowTypePicker(false)}
                className="p-0.5 rounded hover:bg-muted transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Question type
              </span>
            </div>
            <div className="max-h-64 overflow-y-auto px-1.5 pb-1.5">
              {questionTypes.map((qt) => (
                <button
                  key={qt.type}
                  onClick={() => handleCreateNew('question', qt.type)}
                  disabled={atTotalLimit}
                  className={cn(
                    'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left',
                    'hover:bg-muted transition-colors',
                    atTotalLimit && 'opacity-40 cursor-not-allowed'
                  )}
                >
                  <span className="text-indigo-500 flex-shrink-0">{qt.icon}</span>
                  <span className="text-foreground">{qt.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          /* Main menu */
          <motion.div
            key="main-menu"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.12 }}
          >
            {/* Existing nodes */}
            {connectableNodes.length > 0 && !atTotalLimit && (
              <>
                <div className="px-3 pt-3 pb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Connect to
                  </span>
                </div>
                <div className="max-h-48 overflow-y-auto px-1.5 pb-1.5">
                  {connectableNodes.map((node) => (
                    <button
                      key={node.id}
                      onClick={() => handleConnectExisting(node.id)}
                      className={cn(
                        'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm text-left',
                        'hover:bg-muted transition-colors'
                      )}
                    >
                      {getNodeTypeIcon(node)}
                      <span className="truncate text-foreground">{getNodeLabel(node)}</span>
                    </button>
                  ))}
                </div>
                <div className="border-t border-border" />
              </>
            )}

            {/* Create new */}
            <div className="p-1.5">
              <button
                onClick={() => setShowTypePicker(true)}
                disabled={atTotalLimit}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm',
                  'hover:bg-muted transition-colors',
                  atTotalLimit && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Plus className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <span className="flex-1 text-left text-foreground">New Question</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
              <button
                onClick={() => handleCreateNew('end')}
                disabled={atTotalLimit}
                className={cn(
                  'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-sm',
                  'hover:bg-muted transition-colors',
                  atTotalLimit && 'opacity-40 cursor-not-allowed'
                )}
              >
                <Flag className="h-3.5 w-3.5 text-violet-500 flex-shrink-0" />
                <span className="text-foreground">End Screen</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
