'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IllustrationShell } from './IllustrationShell';

const options = [
  { text: 'Very satisfied', points: 10 },
  { text: 'Somewhat', points: 5 },
  { text: 'Not really', points: 0 },
];

function OptionRow({ text, points, isActive, delay }: { text: string; points: number; isActive: boolean; delay: number }) {
  return (
    <motion.div
      className="flex items-center gap-2 px-2 py-1.5 rounded-md border transition-colors"
      style={{
        borderColor: isActive ? '#6366f1' : 'rgb(148 163 184 / 0.3)',
        backgroundColor: isActive ? 'rgb(99 102 241 / 0.08)' : 'transparent',
      }}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
    >
      <motion.div
        className="w-3 h-3 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: isActive ? '#6366f1' : '#94a3b8' }}
      >
        {isActive && (
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-indigo-500"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          />
        )}
      </motion.div>
      <span className="text-[8px] text-slate-600 dark:text-slate-300 flex-1">{text}</span>
      <motion.span
        className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
        animate={{
          backgroundColor: isActive ? 'rgb(99 102 241 / 0.15)' : 'transparent',
          color: isActive ? '#6366f1' : '#94a3b8',
          scale: isActive ? 1.15 : 1,
        }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        +{points}
      </motion.span>
    </motion.div>
  );
}

function NpsGauge({ score }: { score: number }) {
  // Semicircle from -90 to 90 degrees
  const angle = -90 + (score / 100) * 180;

  return (
    <svg viewBox="0 0 100 60" className="w-full">
      {/* Background arc */}
      <path
        d="M 10 55 A 40 40 0 0 1 90 55"
        fill="none"
        stroke="rgb(148 163 184 / 0.2)"
        strokeWidth="6"
        strokeLinecap="round"
      />
      {/* Colored arc sections */}
      <path d="M 10 55 A 40 40 0 0 1 35 18" fill="none" stroke="#ef4444" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
      <path d="M 35 18 A 40 40 0 0 1 65 18" fill="none" stroke="#f59e0b" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
      <path d="M 65 18 A 40 40 0 0 1 90 55" fill="none" stroke="#22c55e" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
      {/* Needle */}
      <motion.line
        x1="50" y1="55" x2="50" y2="20"
        stroke="#6366f1"
        strokeWidth="2"
        strokeLinecap="round"
        style={{ transformOrigin: '50px 55px' }}
        initial={{ rotate: -90 }}
        animate={{ rotate: angle }}
        transition={{ duration: 2, delay: 1.5, type: 'spring', stiffness: 40, damping: 12 }}
      />
      <circle cx="50" cy="55" r="3" fill="#6366f1" />
      {/* Score text */}
      <motion.text
        x="50" y="48" textAnchor="middle"
        className="fill-slate-700 dark:fill-slate-200"
        fontSize="10" fontWeight="bold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 2 }}
      >
        {score}
      </motion.text>
    </svg>
  );
}

export function ScoringIllust() {
  const [activeOption, setActiveOption] = useState(-1);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOption((prev) => (prev + 1) % 4); // 0,1,2 active, 3 = none (reset)
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <IllustrationShell>
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="flex items-center gap-6 w-full max-w-xs">
          {/* Options side */}
          <div className="flex-1 space-y-1.5">
            <div className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mb-2">Question Score</div>
            {options.map((opt, i) => (
              <OptionRow key={i} text={opt.text} points={opt.points} isActive={i === activeOption} delay={0.3 + i * 0.1} />
            ))}
          </div>

          {/* NPS Gauge side */}
          <div className="flex-1 flex flex-col items-center">
            <div className="text-[8px] font-semibold text-slate-500 dark:text-slate-400 mb-1">NPS Score</div>
            <NpsGauge score={42} />
            {/* Mini stacked bar */}
            <div className="flex w-full h-2 rounded-full overflow-hidden mt-2 gap-px">
              <motion.div className="bg-red-400 rounded-l-full" initial={{ width: 0 }} animate={{ width: '20%' }} transition={{ delay: 2.5, duration: 0.5 }} />
              <motion.div className="bg-amber-400" initial={{ width: 0 }} animate={{ width: '30%' }} transition={{ delay: 2.7, duration: 0.5 }} />
              <motion.div className="bg-emerald-400 rounded-r-full" initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ delay: 2.9, duration: 0.5 }} />
            </div>
            <div className="flex justify-between w-full mt-0.5">
              <span className="text-[6px] text-red-400">Detract</span>
              <span className="text-[6px] text-amber-400">Passive</span>
              <span className="text-[6px] text-emerald-400">Promote</span>
            </div>
          </div>
        </div>
      </div>
    </IllustrationShell>
  );
}
