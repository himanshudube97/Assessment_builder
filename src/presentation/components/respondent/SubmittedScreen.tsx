'use client';

/**
 * SubmittedScreen Component
 * Shows confirmation after successful submission
 */

import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

interface SubmittedScreenProps {
  title?: string;
  description?: string;
  showScore?: boolean;
  score?: number | null;
  maxScore?: number | null;
}

export function SubmittedScreen({
  title = 'Thank You!',
  description = 'Your response has been recorded.',
  showScore = false,
  score = null,
  maxScore = null,
}: SubmittedScreenProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center"
        >
          <motion.svg
            className="w-10 h-10 text-emerald-600 dark:text-emerald-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <motion.path
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={3}
              d="M5 13l4 4L19 7"
            />
          </motion.svg>
        </motion.div>

        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          {title}
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 mb-6">
          {description}
        </p>

        {showScore && score !== null && maxScore !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold text-indigo-600 dark:text-indigo-400"
          >
            {score} / {maxScore}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
