'use client';

import { motion } from 'framer-motion';
import { IllustrationShell } from './IllustrationShell';
import { MiniNode } from './MiniNode';

function ConnectionLine({ x1, y1, x2, y2, delay = 0 }: { x1: number; y1: number; x2: number; y2: number; delay?: number }) {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ overflow: 'visible' }}>
      <motion.line
        x1={`${x1}%`} y1={`${y1}%`} x2={`${x2}%`} y2={`${y2}%`}
        stroke="rgb(148 163 184 / 0.6)"
        strokeWidth="2"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay, duration: 0.6 }}
      />
      <motion.circle
        r="3" fill="#6366f1"
        animate={{
          cx: [`${x1}%`, `${x2}%`],
          cy: [`${y1}%`, `${y2}%`],
          opacity: [0, 1, 1, 0],
        }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: delay + 0.8 }}
      />
    </svg>
  );
}

function Cursor() {
  return (
    <motion.div
      className="absolute pointer-events-none z-10"
      animate={{
        left: ['35%', '40%', '45%', '40%', '35%'],
        top: ['42%', '38%', '42%', '46%', '42%'],
        opacity: [0, 1, 1, 1, 0],
      }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <path d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
          fill="#6366f1" stroke="#4f46e5" strokeWidth="1.5" />
      </svg>
    </motion.div>
  );
}

function MiniToolbar() {
  return (
    <motion.div
      className="absolute top-3 left-3 flex items-center gap-0.5 bg-white dark:bg-slate-700 rounded px-1 py-0.5 shadow-sm border border-slate-200 dark:border-slate-600 z-10"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.3 }}
    >
      {['+', '−', '⊞'].map((icon, i) => (
        <div key={i} className="w-5 h-5 flex items-center justify-center text-slate-400 text-[10px]">{icon}</div>
      ))}
    </motion.div>
  );
}

export function FlowBuilderIllust() {
  return (
    <IllustrationShell>
      <MiniToolbar />
      <Cursor />

      {/* Connections */}
      <ConnectionLine x1={28} y1={50} x2={43} y2={50} delay={0.6} />
      <ConnectionLine x1={60} y1={50} x2={75} y2={50} delay={0.9} />

      {/* Nodes */}
      <div className="absolute" style={{ left: '10%', top: '35%', width: '18%' }}>
        <MiniNode label="Start" content="Welcome" color="emerald" delay={0.2} size="sm" />
      </div>
      <motion.div
        className="absolute"
        style={{ width: '22%' }}
        animate={{
          left: ['36%', '38%', '36%'],
          top: ['33%', '30%', '33%'],
        }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
      >
        <MiniNode label="Question" content="How did you find us?" color="indigo" delay={0.5} size="sm" />
      </motion.div>
      <div className="absolute" style={{ left: '72%', top: '35%', width: '18%' }}>
        <MiniNode label="End" content="Thank you!" color="violet" delay={0.8} size="sm" />
      </div>
    </IllustrationShell>
  );
}
