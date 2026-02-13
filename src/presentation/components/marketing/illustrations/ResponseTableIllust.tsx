'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IllustrationShell } from './IllustrationShell';

const allRows = [
  { name: 'Alice M.', score: '85', time: '2m 14s' },
  { name: 'Bob K.', score: '92', time: '1m 48s' },
  { name: 'Carol S.', score: '67', time: '3m 02s' },
  { name: 'Dave P.', score: '78', time: '2m 31s' },
  { name: 'Eve R.', score: '94', time: '1m 55s' },
  { name: 'Frank J.', score: '71', time: '2m 42s' },
];

function PulsingDot() {
  return (
    <div className="relative w-2 h-2">
      <div className="w-2 h-2 rounded-full bg-emerald-400" />
      <motion.div
        className="absolute inset-0 rounded-full bg-emerald-400"
        animate={{ scale: [1, 2.5], opacity: [0.6, 0] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
      />
    </div>
  );
}

export function ResponseTableIllust() {
  const [startIndex, setStartIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStartIndex((prev) => (prev + 1) % allRows.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const visibleRows = Array.from({ length: 4 }, (_, i) =>
    allRows[(startIndex + i) % allRows.length]
  );

  return (
    <IllustrationShell>
      <div className="absolute inset-0 p-4 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <PulsingDot />
            <span className="text-[8px] font-semibold text-slate-500 dark:text-slate-400">Live Responses</span>
          </div>
          <motion.div
            className="text-[7px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-500 font-medium"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            CSV
          </motion.div>
        </div>

        {/* Table */}
        <div className="flex-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 overflow-hidden">
          {/* Header row */}
          <div className="flex items-center text-[7px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-600 px-3 py-1.5">
            <div className="flex-1">Respondent</div>
            <div className="w-12 text-center">Score</div>
            <div className="w-14 text-right">Time</div>
          </div>

          {/* Data rows */}
          <AnimatePresence mode="popLayout">
            {visibleRows.map((row, i) => (
              <motion.div
                key={`${row.name}-${startIndex}-${i}`}
                className="flex items-center text-[8px] px-3 py-1.5 border-b border-slate-100 dark:border-slate-600/50"
                initial={{ opacity: 0, y: -12, backgroundColor: 'rgb(99 102 241 / 0.08)' }}
                animate={{ opacity: 1, y: 0, backgroundColor: 'transparent' }}
                exit={{ opacity: 0, y: 12 }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className="flex-1 font-medium text-slate-600 dark:text-slate-300">{row.name}</div>
                <div className="w-12 text-center">
                  <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold text-[7px]">
                    {row.score}
                  </span>
                </div>
                <div className="w-14 text-right text-slate-400 font-mono">{row.time}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </IllustrationShell>
  );
}
