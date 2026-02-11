'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { ReactNode } from 'react';

interface CTAButtonProps {
  href: string;
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'default' | 'lg';
  className?: string;
}

export function CTAButton({
  href,
  children,
  variant = 'primary',
  size = 'default',
  className,
}: CTAButtonProps) {
  return (
    <motion.div
      className="relative inline-block group"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Glow effect behind button */}
      <motion.div
        className={cn(
          'absolute -inset-1 rounded-xl opacity-0 blur-md transition-opacity duration-300 group-hover:opacity-100',
          variant === 'primary' && 'bg-gradient-to-r from-slate-400 to-slate-600',
          variant === 'secondary' && 'bg-gradient-to-r from-indigo-500 to-violet-500',
          variant === 'outline' && 'bg-gradient-to-r from-indigo-400/50 to-violet-400/50'
        )}
      />

      <Link
        href={href}
        className={cn(
          'relative inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-lg overflow-hidden',
          // Size variants
          size === 'default' && 'px-4 py-2 text-sm',
          size === 'lg' && 'px-6 py-3 text-base',
          // Style variants
          variant === 'primary' &&
            'bg-foreground text-background hover:bg-foreground/90',
          variant === 'secondary' &&
            'bg-indigo-500 text-white hover:bg-indigo-600',
          variant === 'outline' &&
            'border border-border text-foreground hover:bg-accent',
          className
        )}
      >
        {/* Shine effect */}
        <span className="absolute inset-0 overflow-hidden rounded-lg">
          <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
        </span>

        {/* Button content */}
        <span className="relative flex items-center gap-2">
          {children}
        </span>
      </Link>
    </motion.div>
  );
}
