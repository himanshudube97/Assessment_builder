'use client';

/**
 * PreviewModal Component
 * Shows assessment preview in a modal overlay
 */

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hexWithAlpha, isLightColor, getFontFamilyCSS } from '@/lib/theme';
import type { AssessmentSettings } from '@/domain/entities/assessment';
import type {
  FlowNode,
  FlowEdge,
  StartNodeData,
  QuestionNodeData,
  EndNodeData,
  EdgeCondition,
} from '@/domain/entities/flow';
import { resolveAnswerPipes } from '@/lib/answerPiping';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: FlowNode[];
  edges: FlowEdge[];
  title: string;
  settings?: AssessmentSettings | null;
}

type Answer = string | string[] | number;

export function PreviewModal({
  isOpen,
  onClose,
  nodes,
  edges,
  title,
  settings,
}: PreviewModalProps) {
  const color = settings?.primaryColor || '#6366F1';
  const bgColor = settings?.backgroundColor || '#ffffff';
  const radius = settings?.borderRadius || '12px';
  const btnStyle = settings?.buttonStyle || 'filled';
  const fontFamily = settings?.fontFamily || 'Geist Sans';
  const lightBg = isLightColor(bgColor);
  const previewTextColor = lightBg ? '#0f172a' : '#f8fafc';
  const previewMutedColor = lightBg ? '#64748b' : '#94a3b8';
  const previewBorder = lightBg ? '#e2e8f0' : '#334155';
  const previewCardBg = lightBg ? '#ffffff' : '#1e293b';

  const getThemedButtonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { borderRadius: btnStyle === 'pill' ? '9999px' : radius };
    if (btnStyle === 'outline') {
      return { ...base, backgroundColor: 'transparent', border: `2px solid ${color}`, color };
    }
    return { ...base, backgroundColor: color, color: '#ffffff' };
  };
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

  // Find next node based on conditions and per-option branching
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

      // Per-option branching: match answer to sourceHandle
      if (answer !== undefined) {
        const handleEdges = outgoingEdges.filter((e) => e.sourceHandle);
        if (handleEdges.length > 0) {
          const sourceNode = nodes.find((n) => n.id === fromNodeId);
          if (sourceNode?.type === 'question') {
            const data = sourceNode.data as QuestionNodeData;
            if (data.options) {
              const matchedOption = data.options.find(
                (opt) => opt.text === String(answer)
              );
              if (matchedOption) {
                const matchedEdge = handleEdges.find(
                  (e) => e.sourceHandle === matchedOption.id
                );
                if (matchedEdge) {
                  return nodes.find((n) => n.id === matchedEdge.target) || null;
                }
              }
            }
          }
        }
      }

      // Fall back to edge without condition (default path)
      const defaultEdge = outgoingEdges.find(
        (e) => !e.condition && !e.sourceHandle
      );
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
            <div className="h-1" style={{ backgroundColor: hexWithAlpha(color, 0.15) }}>
              <motion.div
                className="h-full"
                style={{ backgroundColor: color }}
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}

          {/* Content */}
          <div
            className="p-8 min-h-[400px] flex flex-col"
            style={{
              backgroundColor: bgColor,
              fontFamily: getFontFamilyCSS(fontFamily),
              color: previewTextColor,
            }}
          >
            <AnimatePresence mode="wait">
              {!currentNode || currentNode.type === 'start' ? (
                <StartScreen
                  key="start"
                  data={startNode?.data as StartNodeData}
                  onStart={handleStart}
                  buttonStyle={getThemedButtonStyle()}
                  textColor={previewTextColor}
                  mutedColor={previewMutedColor}
                />
              ) : currentNode.type === 'question' ? (
                <QuestionScreen
                  key={currentNode.id}
                  data={currentNode.data as QuestionNodeData}
                  answer={answers[currentNode.id]}
                  onAnswer={handleAnswer}
                  allAnswers={answers}
                  nodes={nodes}
                  primaryColor={color}
                  textColor={previewTextColor}
                  mutedColor={previewMutedColor}
                  borderRadius={radius}
                  cardBg={previewCardBg}
                  cardBorder={previewBorder}
                />
              ) : currentNode.type === 'end' ? (
                <EndScreen
                  key="end"
                  data={currentNode.data as EndNodeData}
                  score={null}
                  primaryColor={color}
                  textColor={previewTextColor}
                  mutedColor={previewMutedColor}
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
                className="flex items-center gap-2 px-6 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={getThemedButtonStyle()}
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
  buttonStyle,
  textColor,
  mutedColor,
}: {
  data?: StartNodeData;
  onStart: () => void;
  buttonStyle: React.CSSProperties;
  textColor: string;
  mutedColor: string;
}) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1 flex flex-col items-center justify-center text-center"
    >
      <h1 className="text-3xl font-bold mb-4" style={{ color: textColor }}>{data.title}</h1>
      {data.description && (
        <p className="text-lg mb-8 max-w-md" style={{ color: mutedColor }}>
          {data.description}
        </p>
      )}
      <button
        onClick={onStart}
        className="px-8 py-3 text-lg font-medium transition-all hover:shadow-lg hover:-translate-y-0.5"
        style={buttonStyle}
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
  allAnswers,
  nodes,
  primaryColor,
  textColor,
  mutedColor,
  borderRadius,
  cardBg,
  cardBorder,
}: {
  data: QuestionNodeData;
  answer?: Answer;
  onAnswer: (answer: Answer) => void;
  allAnswers: Record<string, Answer>;
  nodes: FlowNode[];
  primaryColor: string;
  textColor: string;
  mutedColor: string;
  borderRadius: string;
  cardBg: string;
  cardBorder: string;
}) {
  const resolvedText = useMemo(
    () => resolveAnswerPipes(data.questionText, allAnswers),
    [data.questionText, allAnswers]
  );

  const optionStyle = (isSelected: boolean): React.CSSProperties => ({
    borderRadius,
    borderColor: isSelected ? primaryColor : cardBorder,
    backgroundColor: isSelected ? hexWithAlpha(primaryColor, 0.08) : cardBg,
    borderWidth: '2px',
  });

  const inputStyle = (hasValue: boolean): React.CSSProperties => ({
    borderRadius,
    borderColor: hasValue ? primaryColor : cardBorder,
    backgroundColor: cardBg,
    color: textColor,
    borderWidth: '2px',
  });

  const unselectedBtnBg = hexWithAlpha(textColor, 0.06);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex-1"
    >
      <h2 className="text-2xl font-semibold mb-2" style={{ color: textColor }}>
        {resolvedText}
      </h2>
      {data.description && (
        <p className="mb-6" style={{ color: mutedColor }}>{data.description}</p>
      )}

      <div className="mt-6 space-y-3">
        {/* Multiple Choice */}
        {(data.questionType === 'multiple_choice_single' ||
          data.questionType === 'yes_no') &&
          data.options?.map((option) => (
            <button
              key={option.id}
              onClick={() => onAnswer(option.text)}
              className="w-full p-4 text-left transition-all border-solid"
              style={optionStyle(answer === option.text)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: answer === option.text ? primaryColor : cardBorder,
                    backgroundColor: answer === option.text ? primaryColor : undefined,
                  }}
                >
                  {answer === option.text && (
                    <div className="w-2 h-2 rounded-full bg-white" />
                  )}
                </div>
                <span style={{ color: textColor }}>{option.text}</span>
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
                className="w-full p-4 text-left transition-all border-solid"
                style={optionStyle(selected)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded border-2 flex items-center justify-center"
                    style={{
                      borderColor: selected ? primaryColor : cardBorder,
                      backgroundColor: selected ? primaryColor : undefined,
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
                  <span style={{ color: textColor }}>{option.text}</span>
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
                      className="w-12 h-12 font-semibold transition-all"
                      style={{
                        borderRadius,
                        backgroundColor: answer === value ? primaryColor : unselectedBtnBg,
                        color: answer === value ? '#ffffff' : mutedColor,
                        transform: answer === value ? 'scale(1.1)' : undefined,
                      }}
                    >
                      {value}
                    </button>
                  );
                }
              )}
            </div>
            <div className="flex justify-between w-full text-sm" style={{ color: mutedColor }}>
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
            className="w-full px-4 py-3 focus:outline-none transition-colors"
            style={inputStyle(!!answer)}
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
            className="w-full px-4 py-3 focus:outline-none transition-colors resize-none"
            style={inputStyle(!!answer)}
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
            className="w-full px-4 py-3 focus:outline-none transition-colors"
            style={inputStyle(answer !== undefined && answer !== '')}
          />
        )}

        {/* Email */}
        {data.questionType === 'email' && (
          <input
            type="email"
            value={(answer as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            placeholder={data.placeholder || 'you@example.com'}
            className="w-full px-4 py-3 focus:outline-none transition-colors"
            style={inputStyle(!!answer)}
          />
        )}

        {/* Dropdown */}
        {data.questionType === 'dropdown' && data.options && (
          <select
            value={(answer as string) || ''}
            onChange={(e) => onAnswer(e.target.value)}
            className="w-full px-4 py-3 focus:outline-none transition-colors"
            style={inputStyle(!!answer)}
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
            className="w-full px-4 py-3 focus:outline-none transition-colors"
            style={inputStyle(!!answer)}
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
                  className="w-10 h-10 font-semibold text-sm transition-all"
                  style={{
                    borderRadius: `calc(${borderRadius} * 0.6)`,
                    backgroundColor:
                      answer === i
                        ? i <= 6 ? '#EF4444' : i <= 8 ? '#EAB308' : '#22C55E'
                        : unselectedBtnBg,
                    color: answer === i ? '#ffffff' : mutedColor,
                    transform: answer === i ? 'scale(1.1)' : undefined,
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between w-full text-sm" style={{ color: mutedColor }}>
              <span>{data.minLabel || 'Not likely'}</span>
              <span>{data.maxLabel || 'Very likely'}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// End Screen Component
function EndScreen({
  data,
  score,
  primaryColor,
  textColor,
  mutedColor,
}: {
  data: EndNodeData;
  score: { score: number; maxScore: number } | null;
  primaryColor: string;
  textColor: string;
  mutedColor: string;
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
          className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ backgroundColor: hexWithAlpha(primaryColor, 0.12) }}
        >
          <svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: primaryColor }}
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

      <h1 className="text-3xl font-bold mb-4" style={{ color: textColor }}>{data.title}</h1>
      {data.description && (
        <p className="text-lg mb-6 max-w-md" style={{ color: mutedColor }}>
          {data.description}
        </p>
      )}

      {data.showScore && score && (
        <div className="text-4xl font-bold mb-4" style={{ color: primaryColor }}>
          {score.score} / {score.maxScore}
        </div>
      )}
    </motion.div>
  );
}
