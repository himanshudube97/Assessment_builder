'use client';

import { motion } from 'framer-motion';

const colors = {
  emerald: { bar: 'bg-emerald-500', border: 'border-emerald-400' },
  indigo: { bar: 'bg-indigo-500', border: 'border-indigo-500' },
  violet: { bar: 'bg-violet-500', border: 'border-violet-500' },
  amber: { bar: 'bg-amber-500', border: 'border-amber-400' },
  red: { bar: 'bg-red-500', border: 'border-red-400' },
};

interface MiniNodeProps {
  label: string;
  content?: string;
  color?: keyof typeof colors;
  delay?: number;
  className?: string;
  size?: 'sm' | 'md';
}

export function MiniNode({ label, content, color = 'indigo', delay = 0, className = '', size = 'md' }: MiniNodeProps) {
  const c = colors[color];
  const textSize = size === 'sm' ? 'text-[8px]' : 'text-[10px]';
  const barPy = size === 'sm' ? 'py-0.5' : 'py-1';
  const contentPy = size === 'sm' ? 'py-1 px-1.5' : 'py-2 px-2';

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: 'easeOut' }}
      className={`rounded-lg border ${c.border} bg-white dark:bg-slate-700 shadow-md overflow-hidden ${className}`}
    >
      <div className={`${c.bar} text-white ${textSize} font-semibold px-2 ${barPy} text-center`}>
        {label}
      </div>
      {content && (
        <div className={`${textSize} text-slate-600 dark:text-slate-300 ${contentPy} text-center font-medium`}>
          {content}
        </div>
      )}
    </motion.div>
  );
}
