'use client';

/**
 * AssessmentFlow Component
 * Full-page assessment taking experience with localStorage persistence
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SubmittedScreen } from './SubmittedScreen';
import type {
  FlowNode,
  FlowEdge,
  StartNodeData,
  QuestionNodeData,
  EndNodeData,
  EdgeCondition,
} from '@/domain/entities/flow';
import type { Answer as AnswerEntity } from '@/domain/entities/response';

interface AssessmentFlowProps {
  assessmentId: string;
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  settings: {
    primaryColor?: string;
    backgroundColor?: string;
    showProgressBar?: boolean;
    allowBackNavigation?: boolean;
    scoringEnabled?: boolean;
  };
  isEmbed?: boolean;
  inviteToken?: string | null;
}

type AnswerValue = string | string[] | number;

interface SavedState {
  currentNodeId: string | null;
  answers: Record<string, AnswerValue>;
  history: string[];
  startedAt: string;
}

export function AssessmentFlow({
  assessmentId,
  title,
  nodes,
  edges,
  settings,
  isEmbed = false,
  inviteToken,
}: AssessmentFlowProps) {
  const [currentNodeId, setCurrentNodeId] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, AnswerValue>>({});
  const [history, setHistory] = useState<string[]>([]);
  const [startedAt] = useState(() => new Date().toISOString());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState<{ score: number; maxScore: number } | null>(null);
  const [endNodeData, setEndNodeData] = useState<EndNodeData | null>(null);

  const storageKey = `flowform-${assessmentId}`;
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Load saved state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const state: SavedState = JSON.parse(saved);
        setCurrentNodeId(state.currentNodeId);
        setAnswers(state.answers);
        setHistory(state.history);
      } catch (err) {
        console.error('Failed to load saved state:', err);
      }
    }
  }, [storageKey]);

  // Save state to localStorage (debounced)
  const saveState = useCallback(() => {
    if (typeof window === 'undefined') return;

    const state: SavedState = {
      currentNodeId,
      answers,
      history,
      startedAt,
    };
    localStorage.setItem(storageKey, JSON.stringify(state));
  }, [storageKey, currentNodeId, answers, history, startedAt]);

  // Debounced save on state change
  useEffect(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(saveState, 500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveState]);

  // Save on beforeunload
  useEffect(() => {
    const handleBeforeUnload = () => {
      saveState();
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [saveState]);

  // Evaluate edge condition
  const evaluateCondition = useCallback(
    (condition: EdgeCondition, answer: AnswerValue): boolean => {
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
    },
    []
  );

  // Find next node based on conditions
  const findNextNode = useCallback(
    (fromNodeId: string, answer?: AnswerValue): FlowNode | null => {
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
    [edges, nodes, evaluateCondition]
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
    (answer: AnswerValue) => {
      if (!currentNode || currentNode.type !== 'question') return;
      setAnswers((prev) => ({ ...prev, [currentNode.id]: answer }));
    },
    [currentNode]
  );

  // Submit response
  const submitResponse = useCallback(async () => {
    setIsSubmitting(true);

    try {
      // Build answers array
      const answerEntities: AnswerEntity[] = Object.entries(answers).map(
        ([nodeId, value]) => {
          const node = nodes.find((n) => n.id === nodeId);
          const questionText =
            node?.type === 'question'
              ? (node.data as QuestionNodeData).questionText
              : '';
          return {
            nodeId,
            questionText,
            value,
          };
        }
      );

      const response = await fetch(`/api/assessments/${assessmentId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers: answerEntities,
          inviteToken: inviteToken || undefined,
          metadata: {
            userAgent: navigator.userAgent,
            ipCountry: null,
            referrer: document.referrer || null,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      // Clear localStorage on successful submission
      localStorage.removeItem(storageKey);

      // Notify parent window in embed mode
      if (isEmbed && window.parent !== window) {
        window.parent.postMessage(
          { type: 'flowform:submitted', assessmentId },
          '*'
        );
      }

      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting response:', err);
      setIsSubmitting(false);
    }
  }, [assessmentId, answers, nodes, storageKey, isEmbed, inviteToken]);

  // Handle next
  const handleNext = useCallback(() => {
    if (!currentNode) return;

    const answer = answers[currentNode.id];
    const next = findNextNode(currentNode.id, answer);

    if (next) {
      setHistory((prev) => [...prev, currentNode.id]);
      setCurrentNodeId(next.id);

      // If next node is end node, submit response
      if (next.type === 'end') {
        setEndNodeData(next.data as EndNodeData);
        submitResponse();
      }
    }
  }, [currentNode, answers, findNextNode, submitResponse]);

  // Handle back
  const handleBack = useCallback(() => {
    if (history.length === 0 || !settings.allowBackNavigation) return;

    const prevId = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentNodeId(prevId === startNode?.id ? null : prevId);
  }, [history, startNode?.id, settings.allowBackNavigation]);

  // If submitted, show submitted screen
  if (isSubmitted) {
    return (
      <SubmittedScreen
        title={endNodeData?.title}
        description={endNodeData?.description}
        showScore={endNodeData?.showScore}
        score={score?.score}
        maxScore={score?.maxScore}
      />
    );
  }

  return (
    <div
      className={cn(isEmbed ? 'h-screen' : 'min-h-screen', 'flex flex-col')}
      style={{ backgroundColor: settings.backgroundColor || '#f8fafc' }}
    >
      {/* Progress bar */}
      {settings.showProgressBar && currentNode?.type === 'question' && (
        <div className="h-1 bg-slate-200 dark:bg-slate-800">
          <motion.div
            className="h-full"
            style={{ backgroundColor: settings.primaryColor || '#6366F1' }}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <AnimatePresence mode="wait">
            {!currentNode || currentNode.type === 'start' ? (
              <StartScreen
                key="start"
                data={startNode?.data as StartNodeData}
                onStart={handleStart}
                primaryColor={settings.primaryColor}
              />
            ) : currentNode.type === 'question' ? (
              <QuestionScreen
                key={currentNode.id}
                data={currentNode.data as QuestionNodeData}
                answer={answers[currentNode.id]}
                onAnswer={handleAnswer}
                primaryColor={settings.primaryColor}
              />
            ) : currentNode.type === 'end' ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                <p className="mt-4 text-slate-500">Submitting your response...</p>
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* Footer navigation */}
      {currentNode?.type === 'question' && (
        <div className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
            {settings.allowBackNavigation ? (
              <button
                onClick={handleBack}
                disabled={history.length === 0}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
                  'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </button>
            ) : (
              <div />
            )}
            <button
              onClick={handleNext}
              disabled={
                ((currentNode.data as QuestionNodeData).required &&
                  !answers[currentNode.id]) ||
                isSubmitting
              }
              className={cn(
                'flex items-center gap-2 px-6 py-2 rounded-lg transition-all',
                'text-white disabled:opacity-50 disabled:cursor-not-allowed'
              )}
              style={{ backgroundColor: settings.primaryColor || '#6366F1' }}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Next
                  <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Start Screen Component
function StartScreen({
  data,
  onStart,
  primaryColor,
}: {
  data?: StartNodeData;
  onStart: () => void;
  primaryColor?: string;
}) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center py-12"
    >
      <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
        {data.title}
      </h1>
      {data.description && (
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 max-w-md mx-auto">
          {data.description}
        </p>
      )}
      <button
        onClick={onStart}
        className="px-8 py-3 rounded-xl text-lg font-medium text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
        style={{ backgroundColor: primaryColor || '#6366F1' }}
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
  primaryColor,
}: {
  data: QuestionNodeData;
  answer?: AnswerValue;
  onAnswer: (answer: AnswerValue) => void;
  primaryColor?: string;
}) {
  const color = primaryColor || '#6366F1';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="py-8"
    >
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 mb-2">
        {data.questionText}
        {data.required && <span className="text-red-500 ml-1">*</span>}
      </h2>
      {data.description && (
        <p className="text-slate-600 dark:text-slate-400 mb-6">{data.description}</p>
      )}

      <div className="mt-6 space-y-3">
        {/* Multiple Choice Single / Yes No */}
        {(data.questionType === 'multiple_choice_single' ||
          data.questionType === 'yes_no') &&
          data.options?.map((option) => (
            <button
              key={option.id}
              onClick={() => onAnswer(option.text)}
              className={cn(
                'w-full p-4 rounded-xl border-2 text-left transition-all',
                answer === option.text
                  ? 'bg-opacity-10'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
              )}
              style={{
                borderColor: answer === option.text ? color : undefined,
                backgroundColor: answer === option.text ? `${color}15` : undefined,
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                    answer === option.text ? '' : 'border-slate-300 dark:border-slate-600'
                  )}
                  style={{
                    borderColor: answer === option.text ? color : undefined,
                    backgroundColor: answer === option.text ? color : undefined,
                  }}
                >
                  {answer === option.text && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span className="text-slate-900 dark:text-slate-100">{option.text}</span>
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
                    ? ''
                    : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                )}
                style={{
                  borderColor: selected ? color : undefined,
                  backgroundColor: selected ? `${color}15` : undefined,
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'w-5 h-5 rounded border-2 flex items-center justify-center',
                      selected ? '' : 'border-slate-300 dark:border-slate-600'
                    )}
                    style={{
                      borderColor: selected ? color : undefined,
                      backgroundColor: selected ? color : undefined,
                    }}
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
                  <span className="text-slate-900 dark:text-slate-100">{option.text}</span>
                </div>
              </button>
            );
          })}

        {/* Rating */}
        {data.questionType === 'rating' && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="flex gap-2">
              {Array.from({
                length: (data.maxValue || 5) - (data.minValue || 1) + 1,
              }).map((_, i) => {
                const value = (data.minValue || 1) + i;
                return (
                  <button
                    key={value}
                    onClick={() => onAnswer(value)}
                    className={cn(
                      'w-12 h-12 rounded-xl font-semibold transition-all',
                      answer === value
                        ? 'scale-110 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                    )}
                    style={{
                      backgroundColor: answer === value ? color : undefined,
                    }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between w-full text-sm text-slate-500 dark:text-slate-400">
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
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none transition-colors"
            style={{
              borderColor: answer ? color : undefined,
            }}
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
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none transition-colors resize-none"
            style={{
              borderColor: answer ? color : undefined,
            }}
          />
        )}

        {/* Number */}
        {data.questionType === 'number' && (
          <input
            type="number"
            value={(answer as number) ?? ''}
            onChange={(e) => onAnswer(e.target.value ? Number(e.target.value) : '')}
            placeholder={data.placeholder}
            min={data.minValue}
            max={data.maxValue}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none transition-colors"
            style={{
              borderColor: answer !== undefined && answer !== '' ? color : undefined,
            }}
          />
        )}

        {/* Email */}
        {data.questionType === 'email' && (
          <input
            type="email"
            value={(answer as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={data.placeholder || 'you@example.com'}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none transition-colors"
            style={{
              borderColor: answer ? color : undefined,
            }}
          />
        )}

        {/* Dropdown */}
        {data.questionType === 'dropdown' && data.options && (
          <select
            value={(answer as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none transition-colors"
            style={{
              borderColor: answer ? color : undefined,
            }}
          >
            <option value="">Select an option...</option>
            {data.options.map((option) => (
              <option key={option.id} value={option.text}>
                {option.text}
              </option>
            ))}
          </select>
        )}

        {/* Date */}
        {data.questionType === 'date' && (
          <input
            type="date"
            value={(answer as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none transition-colors"
            style={{
              borderColor: answer ? color : undefined,
            }}
          />
        )}

        {/* NPS */}
        {data.questionType === 'nps' && (
          <div className="flex flex-col items-center gap-4 pt-4">
            <div className="flex gap-1.5">
              {Array.from({ length: 11 }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => onAnswer(i)}
                  className={cn(
                    'w-10 h-10 rounded-lg font-semibold text-sm transition-all',
                    answer === i
                      ? 'scale-110 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  )}
                  style={{
                    backgroundColor:
                      answer === i
                        ? i <= 6
                          ? '#EF4444'
                          : i <= 8
                            ? '#EAB308'
                            : '#22C55E'
                        : undefined,
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between w-full text-sm text-slate-500 dark:text-slate-400">
              <span>{data.minLabel || 'Not likely'}</span>
              <span>{data.maxLabel || 'Very likely'}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
