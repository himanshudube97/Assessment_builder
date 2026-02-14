'use client';

/**
 * AssessmentFlow Component
 * Full-page assessment taking experience with localStorage persistence
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hexWithAlpha, isLightColor, getCardClasses, getFontFamilyCSS } from '@/lib/theme';
import { ThemeFontLoader } from './ThemeFontLoader';
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
import { resolveAnswerPipes } from '@/lib/answerPiping';
import { BackgroundDecorations } from '@/presentation/components/assessment/BackgroundDecorations';

interface AssessmentFlowProps {
  assessmentId: string;
  title: string;
  nodes: FlowNode[];
  edges: FlowEdge[];
  settings: {
    primaryColor?: string;
    backgroundColor?: string;
    backgroundGradient?: string;
    backgroundDecoration?: any;
    showProgressBar?: boolean;
    allowBackNavigation?: boolean;
    scoringEnabled?: boolean;
    fontFamily?: string;
    borderRadius?: string;
    buttonStyle?: string;
    cardStyle?: string;
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

      // OR matching: if value is an array, any match succeeds
      if (Array.isArray(value)) {
        return value.some((v) =>
          evaluateCondition({ ...condition, value: v }, answer)
        );
      }

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

  // Find next node based on conditions and per-option branching
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

      // Per-option branching: match answer to sourceHandle
      // (yes/no and MCQ with branching use sourceHandle = option.id)
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
      // Build answers array (resolve piped variables so exports show actual text)
      const answerEntities: AnswerEntity[] = Object.entries(answers).map(
        ([nodeId, value]) => {
          const node = nodes.find((n) => n.id === nodeId);
          const rawText =
            node?.type === 'question'
              ? (node.data as QuestionNodeData).questionText
              : '';
          const questionText = resolveAnswerPipes(rawText, answers);
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
          startedAt,
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

  // Derive theme values
  const color = settings.primaryColor || '#6366F1';
  const bgColor = settings.backgroundColor || '#f8fafc';
  const radius = settings.borderRadius || '12px';
  const btnStyle = settings.buttonStyle || 'filled';
  const cardStyle = settings.cardStyle || 'bordered';
  const fontFamily = settings.fontFamily || 'Geist Sans';
  const lightBg = isLightColor(bgColor);
  const textColor = lightBg ? '#0f172a' : '#f8fafc';
  const mutedTextColor = lightBg ? '#64748b' : '#94a3b8';
  const cardBg = lightBg ? '#ffffff' : '#1e293b';
  const cardBorder = lightBg ? '#e2e8f0' : '#334155';
  const footerBg = lightBg ? '#ffffff' : '#0f172a';
  const footerBorder = lightBg ? '#e2e8f0' : '#1e293b';

  // Button style helpers
  const getNextButtonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { borderRadius: btnStyle === 'pill' ? '9999px' : radius };
    if (btnStyle === 'outline') {
      return { ...base, backgroundColor: 'transparent', border: `2px solid ${color}`, color };
    }
    return { ...base, backgroundColor: color, color: '#ffffff' };
  };

  const getStartButtonStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = { borderRadius: btnStyle === 'pill' ? '9999px' : radius };
    if (btnStyle === 'outline') {
      return { ...base, backgroundColor: 'transparent', border: `2px solid ${color}`, color };
    }
    return { ...base, backgroundColor: color, color: '#ffffff' };
  };

  // If submitted, show submitted screen
  if (isSubmitted) {
    return (
      <ThemeFontLoader fontFamily={fontFamily}>
        <SubmittedScreen
          title={endNodeData?.title}
          description={endNodeData?.description}
          showScore={endNodeData?.showScore}
          score={score?.score}
          maxScore={score?.maxScore}
        />
      </ThemeFontLoader>
    );
  }

  return (
    <ThemeFontLoader fontFamily={fontFamily}>
      <div
        className={cn(isEmbed ? 'h-screen' : 'min-h-screen', 'relative flex flex-col overflow-hidden')}
        style={{
          background: settings.backgroundGradient || bgColor,
          fontFamily: getFontFamilyCSS(fontFamily),
          color: textColor,
        }}
      >
        {/* Background decorations */}
        <BackgroundDecorations decoration={settings.backgroundDecoration} />

        {/* Content with z-index */}
        <div className="relative z-10 flex flex-col flex-1">
          {/* Progress bar */}
          {settings.showProgressBar && currentNode?.type === 'question' && (
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
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <AnimatePresence mode="wait">
                {!currentNode || currentNode.type === 'start' ? (
                  <StartScreen
                    key="start"
                    data={startNode?.data as StartNodeData}
                    onStart={handleStart}
                    primaryColor={color}
                    textColor={textColor}
                    mutedTextColor={mutedTextColor}
                    buttonStyle={getStartButtonStyle()}
                  />
                ) : currentNode.type === 'question' ? (
                  <QuestionScreen
                    key={currentNode.id}
                    data={currentNode.data as QuestionNodeData}
                    answer={answers[currentNode.id]}
                    onAnswer={handleAnswer}
                    primaryColor={color}
                    textColor={textColor}
                    mutedTextColor={mutedTextColor}
                    borderRadius={radius}
                    cardStyle={cardStyle}
                    cardBg={cardBg}
                    cardBorder={cardBorder}
                    allAnswers={answers}
                  />
                ) : currentNode.type === 'end' ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin" style={{ color: mutedTextColor }} />
                    <p className="mt-4" style={{ color: mutedTextColor }}>Submitting your response...</p>
                  </div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>

          {/* Footer navigation */}
          {currentNode?.type === 'question' && (
            <div style={{ borderTop: `1px solid ${footerBorder}`, backgroundColor: footerBg }}>
              <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
                {settings.allowBackNavigation ? (
                  <button
                    onClick={handleBack}
                    disabled={history.length === 0}
                    className="flex items-center gap-2 px-4 py-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ color: mutedTextColor, borderRadius: radius }}
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
                  className="flex items-center gap-2 px-6 py-2 font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={getNextButtonStyle()}
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
      </div>
    </ThemeFontLoader>
  );
}

// Start Screen Component
function StartScreen({
  data,
  onStart,
  primaryColor,
  textColor,
  mutedTextColor,
  buttonStyle,
}: {
  data?: StartNodeData;
  onStart: () => void;
  primaryColor: string;
  textColor: string;
  mutedTextColor: string;
  buttonStyle: React.CSSProperties;
}) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="text-center py-12"
    >
      <h1 className="text-4xl font-bold mb-4" style={{ color: textColor }}>
        {data.title}
      </h1>
      {data.description && (
        <p className="text-lg mb-8 max-w-md mx-auto" style={{ color: mutedTextColor }}>
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
  primaryColor,
  textColor,
  mutedTextColor,
  borderRadius,
  cardStyle,
  cardBg,
  cardBorder,
  allAnswers,
}: {
  data: QuestionNodeData;
  answer?: AnswerValue;
  onAnswer: (answer: AnswerValue) => void;
  primaryColor: string;
  textColor: string;
  mutedTextColor: string;
  borderRadius: string;
  cardStyle: string;
  cardBg: string;
  cardBorder: string;
  allAnswers: Record<string, AnswerValue>;
}) {
  const color = primaryColor;
  const resolvedText = useMemo(
    () => resolveAnswerPipes(data.questionText, allAnswers),
    [data.questionText, allAnswers]
  );

  const optionBaseStyle = (isSelected: boolean): React.CSSProperties => ({
    borderRadius,
    borderColor: isSelected ? color : cardBorder,
    backgroundColor: isSelected ? hexWithAlpha(color, 0.08) : cardBg,
    ...(cardStyle === 'elevated' && !isSelected ? { boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: 'none' } : {}),
    ...(cardStyle === 'flat' ? { borderWidth: '1px' } : { borderWidth: '2px' }),
  });

  const inputStyle = (hasValue: boolean): React.CSSProperties => ({
    borderRadius,
    borderColor: hasValue ? color : cardBorder,
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
      className="py-8"
    >
      <h2 className="text-2xl font-semibold mb-2" style={{ color: textColor }}>
        {resolvedText}
        {data.required && <span className="text-red-500 ml-1">*</span>}
      </h2>
      {data.description && (
        <p className="mb-6" style={{ color: mutedTextColor }}>{data.description}</p>
      )}

      <div className="mt-6 space-y-3">
        {/* Multiple Choice Single / Yes No */}
        {(data.questionType === 'multiple_choice_single' ||
          data.questionType === 'yes_no') &&
          data.options?.map((option) => (
            <button
              key={option.id}
              onClick={() => onAnswer(option.text)}
              className="w-full p-4 text-left transition-all border-solid"
              style={optionBaseStyle(answer === option.text)}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                  style={{
                    borderColor: answer === option.text ? color : cardBorder,
                    backgroundColor: answer === option.text ? color : undefined,
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
                style={optionBaseStyle(selected)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded border-2 flex items-center justify-center"
                    style={{
                      borderColor: selected ? color : cardBorder,
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
                  <span style={{ color: textColor }}>{option.text}</span>
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
                    className="w-12 h-12 font-semibold transition-all"
                    style={{
                      borderRadius,
                      backgroundColor: answer === value ? color : unselectedBtnBg,
                      color: answer === value ? '#ffffff' : mutedTextColor,
                      transform: answer === value ? 'scale(1.1)' : undefined,
                    }}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
            <div className="flex justify-between w-full text-sm" style={{ color: mutedTextColor }}>
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
                        ? i <= 6
                          ? '#EF4444'
                          : i <= 8
                            ? '#EAB308'
                            : '#22C55E'
                        : unselectedBtnBg,
                    color: answer === i ? '#ffffff' : mutedTextColor,
                    transform: answer === i ? 'scale(1.1)' : undefined,
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
            <div className="flex justify-between w-full text-sm" style={{ color: mutedTextColor }}>
              <span>{data.minLabel || 'Not likely'}</span>
              <span>{data.maxLabel || 'Very likely'}</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
