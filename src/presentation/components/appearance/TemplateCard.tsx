'use client';

import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';
import type { ThemeTemplate } from '@/domain/constants/templates';

interface TemplateCardProps {
  template: ThemeTemplate;
  isSelected: boolean;
  onSelect: () => void;
}

export function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const { preview, values } = template;
  const radiusNum = parseInt(values.borderRadius) || 12;
  const previewRadius = Math.min(radiusNum, 12);

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative flex flex-col rounded-xl border-2 p-1.5 transition-all text-left',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-muted-foreground/40'
      )}
    >
      {/* Mini preview */}
      <div
        className="w-full aspect-[4/3] rounded-lg overflow-hidden p-3 flex flex-col gap-2"
        style={{ backgroundColor: preview.background }}
      >
        {/* Mock progress bar */}
        <div
          className="h-1 w-3/5 rounded-full opacity-60"
          style={{ backgroundColor: preview.primary }}
        />

        {/* Mock question text */}
        <div className="flex flex-col gap-1 mt-1">
          <div
            className="h-2 w-4/5 rounded"
            style={{ backgroundColor: preview.primary, opacity: 0.15 }}
          />
          <div
            className="h-2 w-3/5 rounded"
            style={{ backgroundColor: preview.primary, opacity: 0.1 }}
          />
        </div>

        {/* Mock option cards */}
        <div className="flex flex-col gap-1.5 mt-auto">
          {[0.7, 0.5].map((w, i) => (
            <div
              key={i}
              className={cn(
                'h-4',
                values.cardStyle === 'elevated' && 'shadow-sm',
                values.cardStyle === 'flat' && 'border-0',
              )}
              style={{
                width: `${w * 100}%`,
                borderRadius: `${previewRadius / 2}px`,
                border: values.cardStyle !== 'flat' ? `1.5px solid ${preview.accent}` : undefined,
                backgroundColor: i === 0 ? `${preview.primary}15` : preview.background,
              }}
            />
          ))}
        </div>

        {/* Mock button */}
        <div
          className="h-5 w-2/5 self-end mt-1"
          style={{
            borderRadius: values.buttonStyle === 'pill' ? '999px' : `${previewRadius / 2}px`,
            backgroundColor: values.buttonStyle === 'outline' ? 'transparent' : preview.primary,
            border: values.buttonStyle === 'outline' ? `1.5px solid ${preview.primary}` : undefined,
          }}
        />
      </div>

      {/* Label */}
      <div className="px-1.5 py-1.5">
        <p className="text-xs font-medium text-foreground">{template.name}</p>
        <p className="text-[10px] text-muted-foreground leading-tight">{template.description}</p>
      </div>

      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-2 right-2 p-0.5 rounded-full bg-primary text-primary-foreground">
          <Check className="h-3 w-3" />
        </div>
      )}
    </button>
  );
}
