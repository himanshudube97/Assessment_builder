'use client';

/**
 * PreviewModal Component
 * Shows assessment preview in a modal overlay
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  FlowNode,
  FlowEdge,
  StartNodeData,
  QuestionNodeData,
  EndNodeData,
  EdgeCondition,
} from '@/domain/entities/flow';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
  title: string;
}

type Answer = string | string[] | number;

export function PreviewModal({
  isOpen,
  onClose,
  nodes,
  edges,
  title,
}: PreviewModalProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [history, setHistory] = useState<string[]>([]);

  // Find start node
  const startNode = useMemo(
    () => nodes.find((n) => n.type === 'start'),
    [nodes]
  );

  // Get current node
  const currentNode = useMemo(() => {
    if (!currentNodeId) return startNode;
    return nodes.find((n) => n.id === currentNodeId);
  }, [currentNodeId, nodes, startNode]);

  // Calculate progress
  const questionNodes = useMemo(
    () => nodes.filter((n) => n.type === 'question'),
    [nodes]
  );
  const answeredCount = Object.keys(answers).length;
  const progress =
    questionNodes.length > 0
      ? Math.round((answeredCount / questionNodes.length) * 100)
      : 0;

  // Find next node based on conditions
  const findNextNode = useCallback(
    (fromNodeId: string, answer?: Answer): FlowNode | null => {
      const outgoingEdges = edges.filter((e) => e.source === fromNodeId);

      if (outgoingEdges.length === 0) return null;

      // If there's only one edge with no condition, use it
      if (outgoingEdges.length === 1 && !outgoingEdges[0].condition) {
        return nodes.find((n) => n.id === outgoingEdges[0].target) || null;
      }

      // Check conditional edges first
      for (const edge of outgoingEdges) {
        if (edge.condition && answer !== undefined) {
          if (evaluateCondition(edge.condition, answer)) {
            return nodes.find((n) => n.id === edge.target) || null;
          }
        }
      }

      // Fall back to edge without condition
      const defaultEdge = outgoingEdges.find((e) => !e.condition);
      if (defaultEdge) {
        return nodes.find((n) => n.id === defaultEdge.target) || null;
      }

      // Or just use the first edge
      return nodes.find((n) => n.id === outgoingEdges[0].target) || null;
    },
    [edges, nodes]
  );

  // Handle starting the assessment
  const handleStart = useCallback(() => {
    if (!startNode) return;
    const next = findNextNode(startNode.id);
    if (next) {
      setHistory([startNode.id]);
      setCurrentNodeId(next.id);
    }
  }, [startNode, findNextNode]);

  // Handle answering a question
  const handleAnswer = useCallback(
    (answer: Answer) => {
      if (!currentNode || currentNode.type !== 'question') return;

      setAnswers((prev) => ({ ...prev, [currentNode.id]: answer }));
    },
    [currentNode]
  );

  // Handle next
  const handleNext = useCallback(() => {
    if (!currentNode) return;

    const answer = answers[currentNode.id];
    const next = findNextNode(currentNode.id, answer);

    if (next) {
      setHistory((prev) => [...prev, currentNode.id]);
      setCurrentNodeId(next.id);
    }
  }, [currentNode, answers, findNextNode]);

  // Handle back
  const handleBack = useCallback(() => {
    if (history.length === 0) return;

    const prevId = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentNodeId(prevId === startNode?.id ? null : prevId);
  }, [history, startNode?.id]);

  // Reset preview
  const handleReset = useCallback(() => {
    setCurrentNodeId(null);
    setAnswers({});
    setHistory([]);
  }, []);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-2xl max-h-[90vh] bg-background rounded-2xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-muted-foreground">
                Preview Mode
              </span>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-muted-foreground hover:bg-muted transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Progress bar */}
          {currentNode?.type === 'question' && (
            <div className="h-1 bg-muted">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Content */}
          <div className="p-8 min-h-[400px] flex flex-col">
            <AnimatePresence mode="wait">
              {!currentNode || currentNode.type === 'start' ? (
                <StartScreen
                  key="start"
                  data={startNode?.data as StartNodeData}
                  onStart={handleStart}
                />
              ) : currentNode.type === 'question' ? (
                <QuestionScreen
                  key={currentNode.id}
                  data={currentNode.data as QuestionNodeData}
                  answer={answers[currentNode.id]}
                  onAnswer={handleAnswer}
                />
              ) : currentNode.type === 'end' ? (
                <EndScreen
                  key="end"
                  data={currentNode.data as EndNodeData}
                  score={null}
                />
              ) : null}
            </AnimatePresence>
          </div>

          {/* Footer navigation */}
          {currentNode?.type === 'question' && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-border">
              <button
                onClick={handleBack}
                disabled={history.length === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  'text-muted-foreground hover:bg-muted',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
              <button
                onClick={handleNext}
                disabled={
                  (currentNode.data as QuestionNodeData).required &&
                  !answers[currentNode.id]
                }
                className={cn(
                  'flex items-center gap-2 px-6 py-2 rounded-lg transition-all',
                  'bg-primary text-primary-foreground',
                  'hover:bg-primary/90',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// Evaluate edge condition
function evaluateCondition(condition: EdgeCondition, answer: Answer): boolean {
  const { type, value } = condition;
  const answerStr = Array.isArray(answer) ? answer.join(',') : String(answer);
  const valueStr = String(value);

  switch (type) {
    case 'equals':
      if (Array.isArray(answer)) {
        return answer.includes(valueStr);
      }
      return answerStr === valueStr;
    case 'not_equals':
      if (Array.isArray(answer)) {
        return !answer.includes(valueStr);
      }
      return answerStr !== valueStr;
    case 'contains':
      return answerStr.toLowerCase().includes(valueStr.toLowerCase());
    case 'greater_than':
      return Number(answer) > Number(value);
    case 'less_than':
      return Number(answer) < Number(value);
    default:
      return false;
  }
}

// Start Screen Component
function StartScreen({
  data,
  onStart,
}: {
  data?: StartNodeData;
  onStart: () => void;
}) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center text-center"
    >
      <h1 className="text-3xl font-bold text-foreground mb-4">{data.title}</h1>
      {data.description && (
        <p className="text-lg text-muted-foreground mb-8 max-w-md">
          {data.description}
        </p>
      )}
      <button
        onClick={onStart}
        className={cn(
          'px-8 py-3 rounded-xl text-lg font-medium transition-all',
          'bg-primary text-primary-foreground',
          'hover:bg-primary/90 hover:shadow-lg hover:-translate-y-0.5'
        )}
      >
        {data.buttonText}
      </button>
    </motion.div>
  );
}

// Question Screen Component
function QuestionScreen({
  data,
  answer,
  onAnswer,
}: {
  data: QuestionNodeData;
  answer?: Answer;
  onAnswer: (answer: Answer) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1"
    >
      <h2 className="text-2xl font-semibold text-foreground mb-2">
        {data.questionText}
      </h2>
      {data.description && (
        <p className="text-muted-foreground mb-6">{data.description}</p>
      )}

      <div className="mt-6 space-y-3">
        {/* Multiple Choice */}
        {(data.questionType === 'multiple_choice_single' ||
          data.questionType === 'yes_no') &&
          data.options?.map((option) => (
            <button
              key={option.id}
              onClick={() => onAnswer(option.text)}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all',
                answer === option.text
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    answer === option.text
                      ? 'border-primary bg-primary'
                      : 'border-muted-foreground'
                  )}
                >
                  {answer === option.text && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-foreground">{option.text}</span>
              </div>
            </button>
          ))}

        {/* Multiple Choice Multi */}
        {data.questionType === 'multiple_choice_multi' &&
          data.options?.map((option) => {
            const selected = Array.isArray(answer) && answer.includes(option.text);
            return (
              <button
                key={option.id}
                onClick={() => {
                  const current = Array.isArray(answer) ? answer : [];
                  if (selected) {
                    onAnswer(current.filter((a) => a !== option.text));
                  } else {
                    onAnswer([...current, option.text]);
                  }
                }}
                className={cn(
                  'w-full p-4 rounded-xl border-2 text-left transition-all',
                  selected
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      selected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground'
                    )}
                  >
                    {selected && (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={3}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                  <span className="text-foreground">{option.text}</span>
                </div>
              </button>
            );
          })}

        {/* Rating */}
        {data.questionType === 'rating' && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="flex gap-2">
              {Array.from({ length: (data.maxValue || 5) - (data.minValue || 1) + 1 }).map(
                (_, i) => {
                  const value = (data.minValue || 1) + i;
                  return (
                    <button
                      key={value}
                      onClick={() => onAnswer(value)}
                      className={cn(
                        'w-12 h-12 rounded-xl font-semibold transition-all',
                        answer === value
                          ? 'bg-primary text-primary-foreground scale-110'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      )}
                    >
                      {value}
                    </button>
                  );
                }
              )}
            </div>
            <div className="flex justify-between w-full text-sm text-muted-foreground">
              <span>{data.minLabel}</span>
              <span>{data.maxLabel}</span>
            </div>
          </div>
        )}

        {/* Short Text */}
        {data.questionType === 'short_text' && (
          <input
            type="text"
            value={(answer as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={data.placeholder}
            maxLength={data.maxLength}
            className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors"
          />
        )}

        {/* Long Text */}
        {data.questionType === 'long_text' && (
          <textarea
            value={(answer as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={data.placeholder}
            maxLength={data.maxLength}
            rows={4}
            className="w-full px-4 py-3 rounded-xl border-2 border-border bg-background focus:border-primary focus:outline-none transition-colors resize-none"
          />
        )}
      </div>
    </motion.div>
  );
}

// End Screen Component
function EndScreen({
  data,
  score,
}: {
  data: EndNodeData;
  score: { score: number; maxScore: number } | null;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center text-center"
    >
      <div className="mb-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
        >
          <svg
            className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </svg>
        </motion.div>
      </div>

      <h1 className="text-3xl font-bold text-foreground mb-4">{data.title}</h1>
      {data.description && (
        <p className="text-lg text-muted-foreground mb-6 max-w-md">
          {data.description}
        </p>
      )}

      {data.showScore && score && (
        <div className="text-4xl font-bold text-primary mb-4">
          {score.score} / {score.maxScore}
        </div>
      )}
    </motion.div>
  );
}
