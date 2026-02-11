'use client';

import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useRef, useState } from 'react';

const nodeVariants = {
  initial: { scale: 1, boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' },
  hover: {
    scale: 1.08,
    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    transition: { type: 'spring', stiffness: 400, damping: 25 }
  },
};

const glowVariants = {
  initial: { opacity: 0 },
  hover: { opacity: 1 },
};

interface NodeProps {
  type: 'start' | 'question' | 'end';
  title: string;
  content: string;
  className?: string;
  delay?: number;
}

function Node({ type, title, content, className, delay = 0 }: NodeProps) {
  const borderColors = {
    start: 'border-emerald-400',
    question: 'border-indigo-500',
    end: 'border-violet-500',
  };

  const glowColors = {
    start: 'shadow-emerald-400/50',
    question: 'shadow-indigo-500/50',
    end: 'shadow-violet-500/50',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: 'easeOut' }}
      whileHover="hover"
      className={`relative ${className}`}
    >
      <motion.div
        variants={nodeVariants}
        className={`relative rounded-xl border-2 ${borderColors[type]} bg-white dark:bg-slate-800 flex flex-col overflow-hidden cursor-pointer shadow-lg`}
      >
        {/* Glow effect on hover */}
        <motion.div
          variants={glowVariants}
          className={`absolute -inset-1 rounded-xl shadow-xl ${glowColors[type]} blur-md -z-10`}
        />

        <div className="bg-slate-800 dark:bg-slate-700 text-white text-xs px-3 py-1.5 font-medium">
          {title}
        </div>
        <div className="flex-1 flex items-center justify-center text-sm text-slate-600 dark:text-slate-300 px-3 text-center py-3 font-medium">
          {content}
        </div>
      </motion.div>
    </motion.div>
  );
}

function AnimatedConnection({ delay = 0, length = 60 }: { delay?: number; length?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      className="relative flex items-center"
      style={{ width: length }}
    >
      {/* Line */}
      <motion.div
        className="absolute inset-y-0 left-0 right-4 flex items-center"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.4 }}
        style={{ originX: 0 }}
      >
        <div className="h-0.5 w-full bg-gradient-to-r from-slate-300 to-slate-400 dark:from-slate-600 dark:to-slate-500 rounded-full" />
      </motion.div>

      {/* Animated dot traveling along the line */}
      <motion.div
        className="absolute w-2 h-2 rounded-full bg-indigo-500"
        animate={{
          x: [0, length - 16, 0],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 2.5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay + 0.5,
        }}
      />

      {/* Arrow head */}
      <motion.div
        initial={{ opacity: 0, x: -5 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: delay + 0.4 }}
        className="absolute right-0"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" className="text-slate-400 dark:text-slate-500">
          <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
    </motion.div>
  );
}

function BranchingConnections({ delay = 0 }: { delay?: number }) {
  return (
    <motion.svg
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay, duration: 0.3 }}
      width="50"
      height="100"
      viewBox="0 0 50 100"
      className="text-slate-400 dark:text-slate-500"
    >
      {/* Top branch */}
      <motion.path
        d="M0 50 Q25 50 25 25 L50 25"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: delay + 0.1, duration: 0.5 }}
      />
      {/* Bottom branch */}
      <motion.path
        d="M0 50 Q25 50 25 75 L50 75"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ delay: delay + 0.2, duration: 0.5 }}
      />

      {/* Animated dots on branches */}
      <motion.circle
        r="3"
        fill="#6366f1"
        animate={{
          offsetDistance: ['0%', '100%'],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay + 0.8,
        }}
        style={{ offsetPath: 'path("M0 50 Q25 50 25 25 L50 25")' }}
      />
      <motion.circle
        r="3"
        fill="#8b5cf6"
        animate={{
          offsetDistance: ['0%', '100%'],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay + 1.2,
        }}
        style={{ offsetPath: 'path("M0 50 Q25 50 25 75 L50 75")' }}
      />
    </motion.svg>
  );
}

function GridBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(148 163 184 / 0.3) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(148 163 184 / 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Larger grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.2]"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgb(148 163 184 / 0.5) 1px, transparent 1px),
            linear-gradient(to bottom, rgb(148 163 184 / 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '96px 96px',
        }}
      />

      {/* Radial gradient overlay for depth */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white/50 dark:to-slate-900/50" />
    </div>
  );
}

function FloatingElements() {
  const elements = [
    { x: '10%', y: '20%', delay: 0, icon: '✨', size: 'text-lg' },
    { x: '85%', y: '15%', delay: 0.3, icon: '🎯', size: 'text-base' },
    { x: '5%', y: '75%', delay: 0.6, icon: '📊', size: 'text-base' },
    { x: '90%', y: '80%', delay: 0.9, icon: '✅', size: 'text-lg' },
  ];

  return (
    <>
      {elements.map((el, i) => (
        <motion.div
          key={i}
          className={`absolute ${el.size} select-none pointer-events-none`}
          style={{ left: el.x, top: el.y }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: [0, 0.6, 0.6, 0],
            scale: [0.5, 1, 1, 0.5],
            y: [0, -10, 0, 10, 0],
          }}
          transition={{
            duration: 4,
            delay: el.delay + 1,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {el.icon}
        </motion.div>
      ))}
    </>
  );
}

function Cursor() {
  return (
    <motion.div
      className="absolute pointer-events-none"
      initial={{ opacity: 0, x: 200, y: 100 }}
      animate={{
        opacity: [0, 1, 1, 1, 0],
        x: [200, 300, 400, 500, 500],
        y: [100, 120, 80, 100, 100],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay: 2,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path
          d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87c.48 0 .72-.58.38-.92L6.35 2.85a.5.5 0 0 0-.85.36Z"
          fill="#6366f1"
          stroke="#4f46e5"
          strokeWidth="1.5"
        />
      </svg>
    </motion.div>
  );
}

function MiniToolbar() {
  return (
    <motion.div
      className="absolute top-4 left-4 flex items-center gap-1 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.5, duration: 0.4 }}
    >
      {['⊕', '↔', '⊖'].map((icon, i) => (
        <motion.div
          key={i}
          className="w-7 h-7 flex items-center justify-center rounded text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer text-sm"
          whileHover={{ scale: 1.1 }}
        >
          {icon}
        </motion.div>
      ))}
    </motion.div>
  );
}

function MiniPanel() {
  return (
    <motion.div
      className="absolute top-4 right-4 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 p-3 w-32"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.6, duration: 0.4 }}
    >
      <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Questions</div>
      <div className="space-y-1.5">
        {[
          { color: 'bg-emerald-400', label: 'Start' },
          { color: 'bg-indigo-500', label: 'Question' },
          { color: 'bg-violet-500', label: 'End' },
        ].map((item, i) => (
          <motion.div
            key={i}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 + i * 0.1 }}
          >
            <div className={`w-2 h-2 rounded-full ${item.color}`} />
            {item.label}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

// 3D Tilt Card Component
function TiltCard({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  // Mouse position
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring animations
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [8, -8]), {
    stiffness: 150,
    damping: 20,
  });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-8, 8]), {
    stiffness: 150,
    damping: 20,
  });

  // Shine position
  const shineX = useSpring(useTransform(mouseX, [-0.5, 0.5], [0, 100]), {
    stiffness: 150,
    damping: 20,
  });
  const shineY = useSpring(useTransform(mouseY, [-0.5, 0.5], [0, 100]), {
    stiffness: 150,
    damping: 20,
  });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;

    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      className="mt-12 md:mt-16 relative"
      style={{
        perspective: 1000,
      }}
    >
      <motion.div
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative"
      >
        {/* Glowing border effect */}
        <motion.div
          className="absolute -inset-[1px] rounded-2xl opacity-0 transition-opacity duration-300"
          animate={{
            opacity: isHovered ? 1 : 0,
          }}
          style={{
            background: 'linear-gradient(135deg, #6366f1, #8b5cf6, #6366f1, #a855f7)',
            backgroundSize: '300% 300%',
          }}
        >
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'linear',
            }}
            className="absolute inset-0 rounded-2xl"
            style={{
              background: 'inherit',
              backgroundSize: 'inherit',
            }}
          />
        </motion.div>

        {/* Main card */}
        <div className="relative rounded-2xl border border-slate-200 dark:border-slate-700 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 shadow-2xl overflow-hidden">
          {/* Shine effect */}
          <motion.div
            className="absolute inset-0 pointer-events-none z-10"
            style={{
              background: useTransform(
                [shineX, shineY],
                ([x, y]) =>
                  `radial-gradient(circle at ${x}% ${y}%, rgba(255,255,255,0.15) 0%, transparent 50%)`
              ),
              opacity: isHovered ? 1 : 0,
            }}
          />

          {children}
        </div>

        {/* Border glow on hover */}
        <motion.div
          className="absolute -inset-0.5 rounded-2xl -z-10"
          animate={{
            boxShadow: isHovered
              ? '0 0 30px rgba(99, 102, 241, 0.4), 0 0 60px rgba(139, 92, 246, 0.2)'
              : '0 0 0px rgba(99, 102, 241, 0)',
          }}
          transition={{ duration: 0.3 }}
        />
      </motion.div>

      {/* Animated gradient glow effect behind */}
      <motion.div
        className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-violet-500/20 to-indigo-500/20 blur-3xl -z-10 rounded-3xl"
        animate={{
          opacity: isHovered ? [0.5, 0.8, 0.5] : [0.3, 0.5, 0.3],
          scale: isHovered ? [1.02, 1.05, 1.02] : [1, 1.02, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
    </motion.div>
  );
}

export function CanvasPreview() {
  return (
    <TiltCard>
      {/* Reduced aspect ratio */}
      <div className="aspect-[16/9] md:aspect-[2.2/1] relative">
        <GridBackground />
        <FloatingElements />
        <MiniToolbar />
        <MiniPanel />
        <Cursor />

        {/* Canvas Nodes */}
        <div className="absolute inset-0 flex items-center justify-center p-4 md:p-8">
          <div className="flex items-center gap-2 md:gap-4 scale-[0.65] sm:scale-75 md:scale-90 lg:scale-100">
            {/* Start Node */}
            <Node
              type="start"
              title="Start"
              content="Welcome!"
              className="w-28"
              delay={0.3}
            />

            {/* Connection to Question */}
            <AnimatedConnection delay={0.5} length={50} />

            {/* Question Node */}
            <Node
              type="question"
              title="Question"
              content="How did you hear about us?"
              className="w-44"
              delay={0.6}
            />

            {/* Branching connections */}
            <BranchingConnections delay={0.8} />

            {/* End Nodes */}
            <div className="flex flex-col gap-6">
              <Node
                type="end"
                title="End"
                content="Social Media"
                className="w-28"
                delay={1}
              />
              <Node
                type="end"
                title="End"
                content="Search"
                className="w-28"
                delay={1.1}
              />
            </div>
          </div>
        </div>
      </div>
    </TiltCard>
  );
}
