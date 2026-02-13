'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Configuration types ---

export type AssessmentLength = 'short' | 'medium' | 'detailed';
export type AssessmentTone = 'professional' | 'casual' | 'friendly' | 'academic';
export type AssessmentComplexity = 'simple' | 'moderate' | 'complex';

export interface AIGenerateConfig {
  prompt: string;
  length: AssessmentLength;
  tone: AssessmentTone;
  complexity: AssessmentComplexity;
  includeScoring: boolean;
}

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (config: AIGenerateConfig) => Promise<void>;
  isFlowLocked: boolean;
}

// --- Option definitions ---

const LENGTH_OPTIONS: { value: AssessmentLength; label: string; desc: string }[] = [
  { value: 'short', label: 'Short', desc: '3-5 questions' },
  { value: 'medium', label: 'Medium', desc: '5-8 questions' },
  { value: 'detailed', label: 'Detailed', desc: '8-15 questions' },
];

const TONE_OPTIONS: { value: AssessmentTone; label: string }[] = [
  { value: 'professional', label: 'Professional' },
  { value: 'casual', label: 'Casual' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'academic', label: 'Academic' },
];

const COMPLEXITY_OPTIONS: { value: AssessmentComplexity; label: string; desc: string }[] = [
  { value: 'simple', label: 'Simple', desc: 'Linear flow, no branching' },
  { value: 'moderate', label: 'Moderate', desc: 'Some conditional branching' },
  { value: 'complex', label: 'Complex', desc: 'Multiple branches and paths' },
];

const EXAMPLE_PROMPTS = [
  'Customer satisfaction survey for SaaS',
  'Employee onboarding feedback',
  'Event registration form',
  'Product-market fit survey',
  'Course evaluation questionnaire',
];

// --- Pill selector component ---

function PillSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  disabled,
}: {
  label: string;
  options: { value: T; label: string; desc?: string }[];
  value: T;
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
        {label}
      </label>
      <div className="flex gap-1.5">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            disabled={disabled}
            title={opt.desc}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              'border disabled:opacity-50 disabled:cursor-not-allowed',
              value === opt.value
                ? 'bg-violet-600 text-white border-violet-600'
                : 'bg-background text-muted-foreground border-border hover:border-violet-300 hover:text-foreground'
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// --- Main modal ---

export function AIGenerateModal({
  isOpen,
  onClose,
  onGenerate,
  isFlowLocked,
}: AIGenerateModalProps) {
  const [prompt, setPrompt] = useState('');
  const [length, setLength] = useState<AssessmentLength>('medium');
  const [tone, setTone] = useState<AssessmentTone>('professional');
  const [complexity, setComplexity] = useState<AssessmentComplexity>('simple');
  const [includeScoring, setIncludeScoring] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    try {
      await onGenerate({
        prompt: prompt.trim(),
        length,
        tone,
        complexity,
        includeScoring,
      });
      setPrompt('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to generate assessment'
      );
    } finally {
      setIsGenerating(false);
    }
  }, [prompt, length, tone, complexity, includeScoring, isGenerating, onGenerate]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        handleGenerate();
      }
    },
    [handleGenerate]
  );

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
          className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-violet-100 dark:bg-violet-900/30">
                <Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">
                  Generate with AI
                </h2>
                <p className="text-sm text-muted-foreground">
                  Describe your assessment and AI will build it
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content — scrollable */}
          <div className="p-6 space-y-4 overflow-y-auto">
            {/* Warning if flow is locked */}
            {isFlowLocked && (
              <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-sm text-amber-700 dark:text-amber-400">
                This assessment is published. Generation is disabled while the
                flow is locked.
              </div>
            )}

            {/* Prompt input */}
            <div>
              <label className="text-sm font-medium text-foreground mb-2 block">
                What kind of assessment do you want?
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value.slice(0, 500))}
                onKeyDown={handleKeyDown}
                placeholder="e.g., Customer satisfaction survey for a SaaS product with NPS rating and open-ended feedback..."
                rows={3}
                disabled={isGenerating || isFlowLocked}
                className={cn(
                  'w-full px-4 py-3 rounded-lg border border-border bg-background text-foreground text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-violet-500/50 focus:border-violet-500',
                  'placeholder:text-muted-foreground',
                  'resize-none',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
              />
              <div className="flex justify-between mt-1.5">
                <p className="text-xs text-muted-foreground">
                  {prompt.length}/500
                </p>
                <p className="text-xs text-muted-foreground">
                  {typeof navigator !== 'undefined' && navigator.platform?.includes('Mac') ? 'Cmd' : 'Ctrl'}+Enter
                  to generate
                </p>
              </div>
            </div>

            {/* Example prompts */}
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Try an example:
              </p>
              <div className="flex flex-wrap gap-2">
                {EXAMPLE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    onClick={() => setPrompt(example)}
                    disabled={isGenerating || isFlowLocked}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick config: Length */}
            <PillSelect
              label="Length"
              options={LENGTH_OPTIONS}
              value={length}
              onChange={setLength}
              disabled={isGenerating || isFlowLocked}
            />

            {/* Advanced toggle */}
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronDown
                className={cn(
                  'h-3.5 w-3.5 transition-transform',
                  showAdvanced && 'rotate-180'
                )}
              />
              Advanced options
            </button>

            {/* Advanced options */}
            {showAdvanced && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4"
              >
                <PillSelect
                  label="Tone"
                  options={TONE_OPTIONS}
                  value={tone}
                  onChange={setTone}
                  disabled={isGenerating || isFlowLocked}
                />

                <PillSelect
                  label="Complexity"
                  options={COMPLEXITY_OPTIONS}
                  value={complexity}
                  onChange={setComplexity}
                  disabled={isGenerating || isFlowLocked}
                />

                {/* Scoring toggle */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                    Scoring
                  </label>
                  <button
                    type="button"
                    onClick={() => setIncludeScoring(!includeScoring)}
                    disabled={isGenerating || isFlowLocked}
                    className={cn(
                      'flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      includeScoring
                        ? 'bg-violet-600 text-white border-violet-600'
                        : 'bg-background text-muted-foreground border-border hover:border-violet-300'
                    )}
                  >
                    Include scoring & correct answers
                  </button>
                </div>
              </motion.div>
            )}

            {/* Error message */}
            {error && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 shrink-0" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {/* Replacement warning */}
            <p className="text-xs text-muted-foreground">
              This will replace your current assessment flow. You can undo with
              Ctrl+Z.
            </p>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating || isFlowLocked}
              className={cn(
                'w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all text-base',
                'bg-violet-600 text-white',
                'hover:bg-violet-700',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  Generate Assessment
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
