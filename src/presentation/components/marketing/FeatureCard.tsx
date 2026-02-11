'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
  index?: number;
}

export function FeatureCard({ icon: Icon, title, description, className, index = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={{ y: -4 }}
      className={cn('relative group', className)}
    >
      {/* Glow border effect */}
      <motion.div
        className="absolute -inset-[1px] rounded-2xl bg-gradient-to-r from-indigo-500 via-violet-500 to-indigo-500 opacity-0 blur-sm transition-opacity duration-300 group-hover:opacity-70"
      />

      {/* Card content */}
      <div
        className={cn(
          'relative p-6 rounded-2xl border border-border bg-card cursor-pointer',
          'transition-shadow duration-200 hover:shadow-lg'
        )}
      >
        {/* Icon with glow */}
        <motion.div
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 flex items-center justify-center mb-4 group"
        >
          {/* Icon glow on card hover */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/20 to-violet-500/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
          <Icon className="relative w-6 h-6 text-indigo-500" />
        </motion.div>

        <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </motion.div>
  );
}
