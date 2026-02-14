'use client';

/**
 * CanvasSearch Component
 * Floating search bar with text search, question type filters, and result list.
 * Highlights matching nodes on the canvas and allows zooming to results.
 */

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useReactFlow } from 'reactflow';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCanvasStore } from '@/presentation/stores/canvas.store';
import { QUESTION_TYPE_META, QUESTION_TYPES_LIST } from '@/domain/constants/questionTypes';
import type { QuestionType, QuestionNodeData, StartNodeData, EndNodeData } from '@/domain/entities/flow';

interface CanvasSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SearchResult {
  id: string;
  label: string;
  nodeType: 'start' | 'question' | 'end';
  questionType?: QuestionType;
}

export function CanvasSearch({ isOpen, onClose }: CanvasSearchProps) {
  const [searchText, setSearchText] = useState('');
  const [activeTypeFilters, setActiveTypeFilters] = useState<Set<QuestionType>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const nodes = useCanvasStore((s) => s.nodes);
  const setSearchHighlight = useCanvasStore((s) => s.setSearchHighlight);
  const reactFlow = useReactFlow();

  // Build search results
  const results: SearchResult[] = useMemo(() => {
    return nodes
      .map((node) => {
        let label = '';
        let questionType: QuestionType | undefined;

        if (node.type === 'start') {
          label = (node.data as StartNodeData).title || 'Welcome';
        } else if (node.type === 'end') {
          label = (node.data as EndNodeData).title || 'End Screen';
        } else if (node.type === 'question') {
          const data = node.data as QuestionNodeData;
          label = data.questionText || 'Untitled question';
          questionType = data.questionType;
        }

        return { id: node.id, label, nodeType: node.type as SearchResult['nodeType'], questionType };
      })
      .filter((item) => {
        // Text filter (case-insensitive substring)
        const textMatch =
          !searchText || item.label.toLowerCase().includes(searchText.toLowerCase());

        // Type filter — only applies to question nodes
        const typeMatch =
          activeTypeFilters.size === 0 ||
          (item.questionType && activeTypeFilters.has(item.questionType));

        // If type filters are active, exclude start/end nodes
        if (activeTypeFilters.size > 0 && !item.questionType) return false;

        return textMatch && typeMatch;
      });
  }, [nodes, searchText, activeTypeFilters]);

  // Update store highlight whenever results change
  const hasFilters = searchText.length > 0 || activeTypeFilters.size > 0;
  useEffect(() => {
    if (!isOpen) {
      setSearchHighlight(null);
      return;
    }
    if (!hasFilters) {
      setSearchHighlight(null);
      return;
    }
    setSearchHighlight(results.map((r) => r.id));
  }, [isOpen, hasFilters, results, setSearchHighlight]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      setSearchText('');
      setActiveTypeFilters(new Set());
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      // Small delay to let animation start
      const timer = setTimeout(() => inputRef.current?.focus(), 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Keep selectedIndex in bounds
  useEffect(() => {
    if (selectedIndex >= results.length) {
      setSelectedIndex(Math.max(0, results.length - 1));
    }
  }, [results.length, selectedIndex]);

  const zoomToNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find((n) => n.id === nodeId);
      if (!node) return;
      reactFlow.fitView({
        nodes: [{ id: nodeId }],
        padding: 0.5,
        duration: 300,
      });
    },
    [nodes, reactFlow]
  );

  const handleClose = useCallback(() => {
    setSearchHighlight(null);
    onClose();
  }, [onClose, setSearchHighlight]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        zoomToNode(results[selectedIndex].id);
      }
    },
    [handleClose, results, selectedIndex, zoomToNode]
  );

  const toggleTypeFilter = (type: QuestionType) => {
    setActiveTypeFilters((prev) => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
    setSelectedIndex(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -12, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.97 }}
          transition={{ duration: 0.15 }}
          className="w-[380px] rounded-xl bg-card border border-border shadow-xl overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
            <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={searchText}
              onChange={(e) => {
                setSearchText(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Search questions..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            <button
              onClick={handleClose}
              className="p-1 rounded-md hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Type filter chips */}
          <div className="flex flex-wrap gap-1.5 px-3 py-2 border-b border-border">
            {QUESTION_TYPES_LIST.map(([type, meta]) => {
              const isActive = activeTypeFilters.has(type);
              const Icon = meta.icon;
              return (
                <button
                  key={type}
                  onClick={() => toggleTypeFilter(type)}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium',
                    'transition-all duration-150',
                    isActive
                      ? cn(meta.bgColor, meta.color, 'ring-1 ring-current/20')
                      : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
                  )}
                >
                  <Icon className="h-3 w-3" />
                  {meta.label}
                </button>
              );
            })}
          </div>

          {/* Results list */}
          {hasFilters && (
            <div className="max-h-[200px] overflow-y-auto">
              {results.length === 0 ? (
                <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                  No matching questions
                </div>
              ) : (
                <div className="py-1">
                  {results.map((result, index) => {
                    const meta = result.questionType
                      ? QUESTION_TYPE_META[result.questionType]
                      : null;
                    const Icon = meta?.icon;
                    return (
                      <button
                        key={result.id}
                        onClick={() => zoomToNode(result.id)}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={cn(
                          'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left',
                          'transition-colors',
                          index === selectedIndex
                            ? 'bg-muted'
                            : 'hover:bg-muted/50'
                        )}
                      >
                        {Icon ? (
                          <span className={cn('flex-shrink-0', meta?.color)}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                        ) : (
                          <span className="flex-shrink-0 w-3.5 h-3.5 rounded-full bg-muted-foreground/30" />
                        )}
                        <span className="flex-1 truncate text-foreground">
                          {result.label}
                        </span>
                        {meta && (
                          <span className="text-[10px] text-muted-foreground flex-shrink-0">
                            {meta.label}
                          </span>
                        )}
                        {result.nodeType === 'start' && (
                          <span className="text-[10px] text-emerald-500 flex-shrink-0">Start</span>
                        )}
                        {result.nodeType === 'end' && (
                          <span className="text-[10px] text-violet-500 flex-shrink-0">End</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
