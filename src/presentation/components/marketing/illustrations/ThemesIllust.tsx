'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { IllustrationShell } from './IllustrationShell';

const themes = [
  { name: 'Default', primary: '#6366F1', bg: '#FFFFFF', radius: 12, textColor: '#1e293b' },
  { name: 'Midnight', primary: '#8B5CF6', bg: '#0F172A', radius: 8, textColor: '#e2e8f0' },
  { name: 'Ocean', primary: '#0EA5E9', bg: '#F0F9FF', radius: 16, textColor: '#0c4a6e' },
  { name: 'Forest', primary: '#059669', bg: '#ECFDF5', radius: 8, textColor: '#064e3b' },
  { name: 'Sunset', primary: '#EA580C', bg: '#FFF7ED', radius: 12, textColor: '#7c2d12' },
];

export function ThemesIllust() {
  const [activeTheme, setActiveTheme] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTheme((prev) => (prev + 1) % themes.length);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  const t = themes[activeTheme];

  return (
    <IllustrationShell>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 gap-3">
        {/* Mini form card */}
        <motion.div
          className="w-48 shadow-lg overflow-hidden"
          animate={{
            backgroundColor: t.bg,
            borderRadius: t.radius,
            borderColor: `${t.primary}33`,
          }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
          style={{ borderWidth: 1.5 }}
        >
          {/* Progress bar */}
          <motion.div
            className="h-1"
            animate={{ backgroundColor: `${t.primary}30` }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="h-full w-2/3"
              animate={{ backgroundColor: t.primary }}
              transition={{ duration: 0.6 }}
              style={{ borderRadius: '0 2px 2px 0' }}
            />
          </motion.div>

          <div className="p-3">
            {/* Question */}
            <motion.div
              className="text-[9px] font-bold mb-2"
              animate={{ color: t.textColor }}
              transition={{ duration: 0.6 }}
            >
              How was your experience?
            </motion.div>

            {/* Options */}
            {['Great', 'Okay'].map((opt, i) => (
              <motion.div
                key={opt}
                className="flex items-center gap-1.5 mb-1.5 px-2 py-1.5 text-[8px] font-medium"
                animate={{
                  borderRadius: t.radius * 0.6,
                  borderColor: i === 0 ? t.primary : `${t.primary}30`,
                  backgroundColor: i === 0 ? `${t.primary}12` : 'transparent',
                  color: t.textColor,
                }}
                transition={{ duration: 0.6 }}
                style={{ borderWidth: 1.5 }}
              >
                <motion.div
                  className="w-2.5 h-2.5 rounded-full border-[1.5px] shrink-0 flex items-center justify-center"
                  animate={{ borderColor: i === 0 ? t.primary : `${t.primary}50` }}
                  transition={{ duration: 0.6 }}
                >
                  {i === 0 && (
                    <motion.div
                      className="w-1.5 h-1.5 rounded-full"
                      animate={{ backgroundColor: t.primary }}
                      transition={{ duration: 0.6 }}
                    />
                  )}
                </motion.div>
                {opt}
              </motion.div>
            ))}

            {/* Button */}
            <motion.div
              className="text-center text-[8px] font-semibold text-white py-1.5 mt-2"
              animate={{
                backgroundColor: t.primary,
                borderRadius: t.radius * 0.5,
              }}
              transition={{ duration: 0.6 }}
            >
              Next
            </motion.div>
          </div>
        </motion.div>

        {/* Theme swatches */}
        <div className="flex items-center gap-2">
          {themes.map((theme, i) => (
            <motion.div
              key={i}
              className="relative cursor-pointer"
              animate={{ scale: i === activeTheme ? 1.3 : 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {i === activeTheme && (
                <motion.div
                  className="absolute -inset-1 rounded-full border-2"
                  style={{ borderColor: theme.primary }}
                  layoutId="themeRing"
                  transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                />
              )}
              <div
                className="w-4 h-4 rounded-full border border-slate-300 dark:border-slate-600"
                style={{ backgroundColor: theme.primary }}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </IllustrationShell>
  );
}
