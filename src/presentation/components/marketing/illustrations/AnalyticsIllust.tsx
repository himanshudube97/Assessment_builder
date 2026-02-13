'use client';

import { motion } from 'framer-motion';
import { IllustrationShell } from './IllustrationShell';

const barHeights = [45, 70, 55, 85, 60, 40, 75];
const areaPoints = '10,80 25,55 40,65 55,40 70,50 85,30 95,35';
const areaFill = '10,80 25,55 40,65 55,40 70,50 85,30 95,35 95,90 10,90';

function StatCard({ label, value, delay }: { label: string; value: string; delay: number }) {
  return (
    <motion.div
      className="bg-white dark:bg-slate-700 rounded-lg px-3 py-2 shadow-sm border border-slate-200 dark:border-slate-600"
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <div className="text-[7px] text-slate-400 uppercase tracking-wider">{label}</div>
      <motion.div
        className="text-sm font-bold text-slate-700 dark:text-slate-200"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay + 0.3 }}
      >
        {value}
      </motion.div>
    </motion.div>
  );
}

export function AnalyticsIllust() {
  return (
    <IllustrationShell>
      <div className="absolute inset-0 p-4 flex flex-col gap-3">
        {/* Stat cards row */}
        <div className="flex gap-2">
          <StatCard label="Responses" value="142" delay={0.2} />
          <StatCard label="Completion" value="87%" delay={0.35} />
          <StatCard label="Avg Score" value="4.2" delay={0.5} />
        </div>

        {/* Charts row */}
        <div className="flex-1 flex gap-3 min-h-0">
          {/* Area chart */}
          <div className="flex-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 p-2 flex flex-col">
            <div className="text-[7px] text-slate-400 mb-1">Response Trend</div>
            <svg viewBox="0 0 100 100" className="flex-1 w-full" preserveAspectRatio="none">
              {/* Grid lines */}
              {[25, 50, 75].map((y) => (
                <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgb(148 163 184 / 0.15)" strokeWidth="0.5" />
              ))}
              {/* Area fill */}
              <motion.polygon
                points={areaFill}
                fill="url(#areaGrad)"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.3 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              />
              {/* Line */}
              <motion.polyline
                points={areaPoints}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 0.8, duration: 1.5 }}
              />
              {/* Dots */}
              {areaPoints.split(' ').map((pt, i) => {
                const [x, y] = pt.split(',');
                return (
                  <motion.circle
                    key={i} cx={x} cy={y} r="2"
                    fill="#6366f1"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + i * 0.2 }}
                  />
                );
              })}
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Bar chart */}
          <div className="flex-1 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-200 dark:border-slate-600 p-2 flex flex-col">
            <div className="text-[7px] text-slate-400 mb-1">Score Distribution</div>
            <div className="flex-1 flex items-end gap-1">
              {barHeights.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex-1 bg-indigo-500 rounded-t"
                  initial={{ height: 0 }}
                  animate={{ height: `${h}%` }}
                  transition={{
                    delay: 1.2 + i * 0.1,
                    duration: 0.5,
                    type: 'spring',
                    stiffness: 100,
                    damping: 12,
                  }}
                  style={{ opacity: 0.6 + (h / 85) * 0.4 }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </IllustrationShell>
  );
}
