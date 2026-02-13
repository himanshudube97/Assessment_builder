'use client';

import { cn } from '@/lib/utils';
import { Check, Sparkles } from 'lucide-react';
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
  const hasGradient = !!preview.gradient;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'group relative flex flex-col rounded-xl border-2 p-1.5 transition-all text-left overflow-hidden',
        'hover:scale-[1.02] active:scale-[0.99]',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:border-muted-foreground/40 hover:shadow-lg'
      )}
    >
      {/* Category badge */}
      {template.category && (
        <div className="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-full bg-black/20 backdrop-blur-sm">
          <p className="text-[9px] font-medium text-white uppercase tracking-wider">
            {template.category}
          </p>
        </div>
      )}

      {/* Custom CSS badge */}
      {template.values.customCSSEnabled && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-blue-500/90 backdrop-blur-sm" title="Requires custom CSS - Click for documentation">
          <p className="text-[9px] font-medium text-white uppercase tracking-wider">
            📝 Custom CSS
          </p>
        </div>
      )}

      {/* Animated badge */}
      {template.values.backgroundDecoration && template.values.backgroundDecoration.type !== 'none' && (
        <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 backdrop-blur-sm animate-pulse" title="Includes animated background">
          <p className="text-[9px] font-medium text-white uppercase tracking-wider flex items-center gap-0.5">
            ✨ Animated
          </p>
        </div>
      )}

      {/* Mini preview */}
      <div
        className="relative w-full aspect-[4/3] rounded-lg overflow-hidden p-3 flex flex-col gap-2"
        style={{
          background: hasGradient ? preview.gradient : preview.background,
        }}
      >
        {/* Glassmorphism overlay if applicable */}
        {values.glassEffect && (
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
        )}

        <div className="relative z-10 flex flex-col h-full">
          {/* Mock progress bar */}
          <div
            className="h-1 w-3/5 rounded-full opacity-70 transition-all group-hover:w-4/5"
            style={{
              background: values.accentGradient || preview.primary,
            }}
          />

          {/* Mock question text */}
          <div className="flex flex-col gap-1 mt-1">
            <div
              className="h-2 w-4/5 rounded transition-all group-hover:w-full"
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
                  'h-4 transition-all',
                  values.cardStyle === 'elevated' && 'shadow-sm',
                  values.cardStyle === 'flat' && 'border-0',
                  values.glassEffect && 'backdrop-blur-sm bg-white/20',
                  i === 0 && 'group-hover:scale-[1.02]'
                )}
                style={{
                  width: `${w * 100}%`,
                  borderRadius: `${previewRadius / 2}px`,
                  border:
                    values.cardStyle !== 'flat' && !values.glassEffect
                      ? `1.5px solid ${preview.accent}`
                      : undefined,
                  backgroundColor:
                    values.glassEffect
                      ? i === 0
                        ? 'rgba(255,255,255,0.3)'
                        : 'rgba(255,255,255,0.15)'
                      : i === 0
                        ? `${preview.primary}15`
                        : preview.background,
                }}
              />
            ))}
          </div>

          {/* Mock button */}
          <div
            className="h-5 w-2/5 self-end mt-1 transition-all group-hover:shadow-md"
            style={{
              borderRadius: values.buttonStyle === 'pill' ? '999px' : `${previewRadius / 2}px`,
              background:
                values.buttonStyle === 'outline'
                  ? 'transparent'
                  : values.accentGradient || preview.primary,
              border: values.buttonStyle === 'outline' ? `1.5px solid ${preview.primary}` : undefined,
              boxShadow: values.shadowStyle === 'dramatic' ? '0 4px 12px rgba(0,0,0,0.15)' : undefined,
            }}
          />
        </div>
      </div>

      {/* Label */}
      <div className="px-1.5 py-1.5">
        <div className="flex items-center gap-1">
          <p className="text-xs font-medium text-foreground">{template.name}</p>
          {values.glassEffect && (
            <Sparkles className="h-3 w-3 text-primary/60" />
          )}
        </div>
        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">
          {template.description}
        </p>

        {/* Feature tags */}
        <div className="flex flex-wrap gap-1 mt-1">
          {values.animationPreset && values.animationPreset !== 'subtle' && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
              {values.animationPreset}
            </span>
          )}
          {values.shadowStyle === 'dramatic' && (
            <span className="text-[8px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">
              dramatic
            </span>
          )}
        </div>
      </div>

      {/* Selected check */}
      {isSelected && (
        <div className="absolute top-2 right-2 p-0.5 rounded-full bg-primary text-primary-foreground shadow-md z-20">
          <Check className="h-3 w-3" />
        </div>
      )}

      {/* Hover shine effect */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent" />
      </div>
    </button>
  );
}
