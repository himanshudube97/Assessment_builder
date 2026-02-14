'use client';

/**
 * Watermark Component
 * Shows "Powered by Assess" badge for free tier users
 */

import { ExternalLink } from 'lucide-react';

interface WatermarkProps {
  textColor?: string;
  mutedTextColor?: string;
  className?: string;
  companyName?: string | null;
}

export function Watermark({
  textColor = '#64748b',
  mutedTextColor = '#94a3b8',
  className = '',
  companyName = null,
}: WatermarkProps) {
  // If company name is provided, show custom branding instead
  if (companyName) {
    return (
      <div
        className={`flex items-center justify-center gap-1.5 text-xs ${className}`}
        style={{ color: mutedTextColor }}
      >
        <span>Powered by</span>
        <span className="font-medium" style={{ color: textColor }}>
          {companyName}
        </span>
      </div>
    );
  }

  // Default: Show "Powered by Assess"
  return (
    <div
      className={`flex items-center justify-center gap-1.5 text-xs ${className}`}
      style={{ color: mutedTextColor }}
    >
      <span>Powered by</span>
      <a
        href="https://assess.app"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 font-medium transition-colors hover:opacity-80"
        style={{ color: textColor }}
      >
        Assess
        <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}
