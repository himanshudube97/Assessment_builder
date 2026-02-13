'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { IllustrationShell } from './IllustrationShell';

const screens = [
  {
    question: 'How was the service?',
    options: ['Excellent', 'Good', 'Average'],
    selected: 0,
    progress: 33,
  },
  {
    question: 'Would you recommend us?',
    options: ['Definitely', 'Maybe', 'No'],
    selected: 1,
    progress: 66,
  },
  {
    question: 'Any suggestions?',
    options: [],
    isText: true,
    progress: 100,
  },
];

function PhoneScreen({ screen, direction }: { screen: (typeof screens)[number]; direction: number }) {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col p-2"
      initial={{ x: direction > 0 ? '100%' : '-100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: direction > 0 ? '-100%' : '100%', opacity: 0 }}
      transition={{ duration: 0.4, ease: 'easeInOut' }}
    >
      {/* Progress bar */}
      <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full mb-3 overflow-hidden">
        <motion.div
          className="h-full bg-indigo-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${screen.progress}%` }}
          transition={{ duration: 0.5, delay: 0.3 }}
        />
      </div>

      {/* Question */}
      <div className="text-[9px] font-bold text-slate-700 dark:text-slate-200 mb-2">
        {screen.question}
      </div>

      {/* Options or text */}
      {'isText' in screen ? (
        <div className="flex-1">
          <motion.div
            className="w-full h-10 rounded border border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-600 p-1.5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="text-[7px] text-slate-400"
              animate={{ opacity: [0, 1, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Type here...
            </motion.div>
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 space-y-1.5">
          {screen.options.map((opt, i) => (
            <motion.div
              key={opt}
              className="flex items-center gap-1.5 px-2 py-1.5 rounded-md border text-[8px] font-medium"
              style={{
                borderColor: i === screen.selected ? '#6366f1' : 'rgb(203 213 225 / 0.5)',
                backgroundColor: i === screen.selected ? 'rgb(99 102 241 / 0.08)' : 'transparent',
                color: i === screen.selected ? '#6366f1' : '#64748b',
              }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
            >
              <div
                className="w-2.5 h-2.5 rounded-full border-[1.5px] shrink-0 flex items-center justify-center"
                style={{ borderColor: i === screen.selected ? '#6366f1' : '#94a3b8' }}
              >
                {i === screen.selected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />}
              </div>
              {opt}
            </motion.div>
          ))}
        </div>
      )}

      {/* Next button */}
      <motion.div
        className="bg-indigo-500 text-white text-center text-[8px] font-semibold py-1.5 rounded-md mt-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        Next
      </motion.div>
    </motion.div>
  );
}

export function MobileIllust() {
  const [currentScreen, setCurrentScreen] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const interval = setInterval(() => {
      setDirection(1);
      setCurrentScreen((prev) => (prev + 1) % screens.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <IllustrationShell>
      <div className="absolute inset-0 flex items-center justify-center gap-6 p-4">
        {/* Phone frame */}
        <div className="relative w-32 h-56 rounded-[1.2rem] border-4 border-slate-700 dark:border-slate-500 bg-white dark:bg-slate-800 shadow-xl overflow-hidden">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-3 bg-slate-700 dark:bg-slate-500 rounded-b-lg z-20" />

          {/* Screen content */}
          <div className="absolute inset-0 pt-4">
            <AnimatePresence mode="wait" initial={false}>
              <PhoneScreen key={currentScreen} screen={screens[currentScreen]} direction={direction} />
            </AnimatePresence>
          </div>

          {/* Touch indicator */}
          <motion.div
            className="absolute w-5 h-5 rounded-full bg-indigo-500/30 border border-indigo-500/50 z-30 pointer-events-none"
            animate={{
              left: ['50%', '50%', '50%'],
              top: ['55%', '55%', '80%'],
              scale: [0, 1, 1, 0.8, 0],
              opacity: [0, 0.7, 0.7, 0.5, 0],
            }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 0.5 }}
            style={{ transform: 'translate(-50%, -50%)' }}
          />
        </div>

        {/* Desktop mini preview */}
        <motion.div
          className="hidden md:flex flex-col items-center gap-1"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 0.5, x: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="w-20 h-14 rounded border-2 border-slate-400 dark:border-slate-500 bg-white dark:bg-slate-700 p-1.5 flex flex-col gap-0.5">
            <div className="h-0.5 bg-indigo-500/30 rounded-full w-full" />
            <div className="flex-1 flex flex-col justify-center gap-0.5">
              <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full w-3/4" />
              <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full w-1/2" />
              <div className="h-1 bg-slate-200 dark:bg-slate-600 rounded-full w-2/3" />
            </div>
          </div>
          <div className="w-6 h-1 bg-slate-400 dark:bg-slate-500 rounded-full" />
          <div className="text-[7px] text-slate-400 mt-1">Desktop</div>
        </motion.div>
      </div>
    </IllustrationShell>
  );
}
