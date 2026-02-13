'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IllustrationShell } from './IllustrationShell';
import { MiniNode } from './MiniNode';

const options = [
  { text: 'Excellent', color: '#22c55e', endLabel: 'Follow-up', endColor: 'emerald' as const },
  { text: 'Average', color: '#f59e0b', endLabel: 'Feedback', endColor: 'amber' as const },
  { text: 'Poor', color: '#8b5cf6', endLabel: 'Support', endColor: 'violet' as const },
];

// Y positions for the 3 branches (percentage of SVG viewBox)
const branchY = [20, 50, 80];

function QuestionCard({ activeBranch }: { activeBranch: number }) {
  return (
    <motion.div
      className="absolute bg-white dark:bg-slate-700 rounded-lg border border-indigo-500 shadow-md overflow-hidden"
      style={{ left: '6%', top: '15%', width: '28%' }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.2, duration: 0.4 }}
    >
      {/* Header */}
      <div className="bg-indigo-500 text-white text-[8px] font-semibold px-2 py-1 text-center">
        Question
      </div>
      <div className="p-1.5">
        <div className="text-[7px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
          How was the service?
        </div>
        {/* MCQ Options */}
        {options.map((opt, i) => {
          const isActive = i === activeBranch;
          return (
            <motion.div
              key={opt.text}
              className="flex items-center gap-1 px-1.5 py-1 rounded mb-0.5 text-[7px]"
              animate={{
                backgroundColor: isActive ? `${opt.color}15` : 'transparent',
                borderColor: isActive ? opt.color : 'transparent',
              }}
              style={{ borderWidth: 1 }}
              transition={{ duration: 0.25 }}
            >
              <motion.div
                className="w-2.5 h-2.5 rounded-full border-[1.5px] shrink-0 flex items-center justify-center"
                animate={{ borderColor: isActive ? opt.color : '#94a3b8' }}
                transition={{ duration: 0.25 }}
              >
                {isActive && (
                  <motion.div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: opt.color }}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500 }}
                  />
                )}
              </motion.div>
              <span
                className="font-medium"
                style={{ color: isActive ? opt.color : '#64748b' }}
              >
                {opt.text}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

function BranchPaths({ activeBranch }: { activeBranch: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
      {branchY.map((y, i) => {
        const isActive = i === activeBranch;
        const path = `M 35 50 Q 48 50 48 ${y} L 66 ${y}`;
        return (
          <g key={i}>
            <motion.path
              d={path}
              stroke={isActive ? options[i].color : 'rgb(148 163 184 / 0.3)'}
              strokeWidth={isActive ? '0.8' : '0.5'}
              fill="none"
              vectorEffect="non-scaling-stroke"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1, stroke: isActive ? options[i].color : 'rgb(148 163 184 / 0.3)' }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.6 }}
            />
            {isActive && (
              <motion.circle
                r="1.5"
                fill={options[i].color}
                animate={{ offsetDistance: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                style={{ offsetPath: `path("${path}")` }}
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export function BranchingIllust() {
  const [activeBranch, setActiveBranch] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveBranch((prev) => (prev + 1) % 3);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <IllustrationShell>
      <BranchPaths activeBranch={activeBranch} />

      {/* Question card with MCQ options */}
      <QuestionCard activeBranch={activeBranch} />

      {/* End nodes */}
      {options.map((opt, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{ left: '67%', top: `${branchY[i] - 10}%`, width: '22%' }}
          animate={{
            opacity: i === activeBranch ? 1 : 0.35,
            scale: i === activeBranch ? 1.05 : 1,
          }}
          transition={{ duration: 0.3 }}
        >
          <MiniNode label={opt.endLabel} color={opt.endColor} delay={0.8 + i * 0.15} size="sm" />
        </motion.div>
      ))}
    </IllustrationShell>
  );
}
