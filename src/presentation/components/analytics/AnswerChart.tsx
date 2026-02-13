'use client';

/**
 * AnswerChart Component
 * Bar chart showing answer distribution for a question
 */

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface AnswerChartProps {
  questionText: string;
  questionType: string;
  distribution: Record<string, number>;
}

const questionTypeLabels: Record<string, string> = {
  multiple_choice_single: 'Single Choice',
  multiple_choice_multi: 'Multiple Choice',
  short_text: 'Short Text',
  long_text: 'Long Text',
  rating: 'Rating',
  yes_no: 'Yes/No',
};

export function AnswerChart({
  questionText,
  questionType,
  distribution,
}: AnswerChartProps) {
  const data = useMemo(() => {
    const entries = Object.entries(distribution);
    const total = entries.reduce((sum, [, count]) => sum + count, 0);

    return entries
      .map(([answer, count]) => ({
        answer,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [distribution]);

  const maxCount = useMemo(() => {
    return Math.max(...data.map((d) => d.count), 1);
  }, [data]);

  if (data.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="mb-4">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate">
            {questionText}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {questionTypeLabels[questionType] || questionType}
          </p>
        </div>
        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-8">
          No responses yet
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6"
    >
      <div className="mb-6">
        <h3 className="font-semibold text-slate-900 dark:text-slate-100">
          {questionText}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {questionTypeLabels[questionType] || questionType}
        </p>
      </div>

      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={item.answer} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                {item.answer}
              </span>
              <span className="text-slate-500 dark:text-slate-400 ml-2 flex-shrink-0">
                {item.count} ({item.percentage}%)
              </span>
            </div>
            <div className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / maxCount) * 100}%` }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="h-full bg-indigo-500 rounded-lg flex items-center justify-end pr-2"
              >
                {item.percentage > 15 && (
                  <span className="text-xs font-medium text-white">
                    {item.percentage}%
                  </span>
                )}
              </motion.div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
