'use client';

/**
 * SubmittedScreen Component
 * Shows confirmation after successful submission
 */

import { motion } from 'framer-motion';
import { hexWithAlpha, isLightColor, getFontFamilyCSS } from '@/lib/theme';

interface SubmittedScreenProps {
  title?: string;
  description?: string;
  showScore?: boolean;
  score?: number | null;
  maxScore?: number | null;
  primaryColor?: string;
  backgroundColor?: string;
  fontFamily?: string;
}

export function SubmittedScreen({
  title = 'Thank You!',
  description = 'Your response has been recorded.',
  showScore = false,
  score = null,
  maxScore = null,
  primaryColor = '#6366F1',
  backgroundColor = '#f8fafc',
  fontFamily = 'Geist Sans',
}: SubmittedScreenProps) {
  const lightBg = isLightColor(backgroundColor);
  const textColor = lightBg ? '#0f172a' : '#f8fafc';
  const mutedTextColor = lightBg ? '#64748b' : '#94a3b8';

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ backgroundColor, fontFamily: getFontFamilyCSS(fontFamily) }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
          className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
          style={{ backgroundColor: hexWithAlpha(primaryColor, 0.12) }}
        >
          <motion.svg
            className="w-10 h-10"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            style={{ color: primaryColor }}
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

        <h1 className="text-3xl font-bold mb-4" style={{ color: textColor }}>
          {title}
        </h1>
        <p className="text-lg mb-6" style={{ color: mutedTextColor }}>
          {description}
        </p>

        {showScore && score !== null && maxScore !== null && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="text-4xl font-bold"
            style={{ color: primaryColor }}
          >
            {score} / {maxScore}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
