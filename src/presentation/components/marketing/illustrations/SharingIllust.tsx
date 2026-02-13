'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Calendar, Mail, Check, Link2 } from 'lucide-react';
import { IllustrationShell } from './IllustrationShell';

function QrIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className} style={style}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="3" height="3" />
      <rect x="18" y="18" width="3" height="3" />
    </svg>
  );
}

const surroundingItems = [
  { Icon: Lock, label: 'Password', color: '#ef4444' },
  { Icon: QrIcon, label: 'QR Code', color: '#8b5cf6' },
  { Icon: Calendar, label: 'Schedule', color: '#f59e0b' },
  { Icon: Mail, label: 'Invite', color: '#22c55e' },
];

const positions = [
  { x: '14%', y: '18%' },
  { x: '72%', y: '18%' },
  { x: '14%', y: '62%' },
  { x: '72%', y: '62%' },
];

export function SharingIllust() {
  const [activeItem, setActiveItem] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveItem((prev) => (prev + 1) % 4);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <IllustrationShell>
      {/* Connector lines */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        {positions.map((pos, i) => {
          const isActive = i === activeItem;
          return (
            <motion.line
              key={i}
              x1="50%" y1="50%"
              x2={`${parseFloat(pos.x) + 7}%`}
              y2={`${parseFloat(pos.y) + 5}%`}
              stroke={isActive ? surroundingItems[i].color : 'rgb(148 163 184 / 0.2)'}
              strokeWidth="1"
              strokeDasharray="3,3"
              animate={{ opacity: isActive ? 0.6 : 0.2 }}
              transition={{ duration: 0.3 }}
            />
          );
        })}
      </svg>

      {/* Center link card */}
      <motion.div
        className="absolute bg-white dark:bg-slate-700 rounded-lg shadow-md border border-slate-200 dark:border-slate-600 px-3 py-2 flex items-center gap-2 z-10"
        style={{ left: '28%', top: '40%', width: '44%' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
      >
        <div className="w-5 h-5 rounded bg-indigo-500/10 flex items-center justify-center shrink-0">
          <Link2 className="w-3 h-3 text-indigo-500" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[7px] text-slate-400 truncate">flowform.app/a/x8k...</div>
        </div>
        <motion.div
          className="w-5 h-5 rounded flex items-center justify-center shrink-0"
          animate={{ backgroundColor: copied ? 'rgb(34 197 94 / 0.15)' : 'rgb(99 102 241 / 0.1)' }}
        >
          <AnimatePresence mode="wait">
            {copied ? (
              <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Check className="w-3 h-3 text-emerald-500" />
              </motion.div>
            ) : (
              <motion.div key="copy" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <svg viewBox="0 0 24 24" className="w-3 h-3 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" />
                  <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.div>

      {/* Surrounding items */}
      {surroundingItems.map((item, i) => {
        const isActive = i === activeItem;
        const pos = positions[i];
        return (
          <motion.div
            key={i}
            className="absolute flex flex-col items-center gap-1 z-10"
            style={{ left: pos.x, top: pos.y, width: '14%' }}
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{
              opacity: isActive ? 1 : 0.5,
              scale: isActive ? 1.15 : 1,
            }}
            transition={{ delay: 0.5 + i * 0.15, duration: 0.3 }}
          >
            <motion.div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              animate={{
                backgroundColor: isActive ? `${item.color}20` : 'rgb(148 163 184 / 0.1)',
                boxShadow: isActive ? `0 0 12px ${item.color}30` : '0 0 0px transparent',
              }}
              transition={{ duration: 0.3 }}
            >
              <item.Icon className="w-4 h-4" style={{ color: isActive ? item.color : '#94a3b8' }} />
            </motion.div>
            <span className="text-[7px] font-medium" style={{ color: isActive ? item.color : '#94a3b8' }}>
              {item.label}
            </span>
          </motion.div>
        );
      })}
    </IllustrationShell>
  );
}
