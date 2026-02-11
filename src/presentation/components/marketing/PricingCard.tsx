'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import Link from 'next/link';

interface PricingCardProps {
  name: string;
  price: number | string;
  period: string;
  description: string;
  features: string[];
  cta: string;
  ctaHref: string;
  highlighted?: boolean;
  index?: number;
}

export function PricingCard({
  name,
  price,
  period,
  description,
  features,
  cta,
  ctaHref,
  highlighted = false,
  index = 0,
}: PricingCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      whileHover={highlighted ? {} : { y: -8, transition: { duration: 0.2 } }}
      className={cn(
        'relative p-8 rounded-2xl border transition-all duration-200',
        highlighted
          ? 'border-indigo-500 bg-gradient-to-b from-indigo-500/5 to-transparent shadow-lg scale-105'
          : 'border-border bg-card hover:shadow-lg hover:shadow-indigo-500/5'
      )}
    >
      {highlighted && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-indigo-500 text-white text-sm font-medium rounded-full"
        >
          Most Popular
        </motion.div>
      )}

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-foreground mb-2">{name}</h3>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>

      <div className="mb-6">
        <span className="text-4xl font-bold text-foreground">
          {typeof price === 'number' ? `$${price}` : price}
        </span>
        {period && (
          <span className="text-muted-foreground ml-2">/{period}</span>
        )}
      </div>

      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <Link
          href={ctaHref}
          className={cn(
            'block w-full py-3 px-4 rounded-lg font-medium text-center transition-colors mb-8',
            highlighted
              ? 'bg-indigo-500 text-white hover:bg-indigo-600'
              : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
          )}
        >
          {cta}
        </Link>
      </motion.div>

      <ul className="space-y-3">
        {features.map((feature, i) => (
          <motion.li
            key={i}
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 + i * 0.05 }}
            className="flex items-start gap-3"
          >
            <Check className="w-5 h-5 text-indigo-500 flex-shrink-0 mt-0.5" />
            <span className="text-muted-foreground">{feature}</span>
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}
