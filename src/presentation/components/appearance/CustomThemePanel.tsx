'use client';

import type { AssessmentSettings, ButtonStyle, CardStyle } from '@/domain/entities/assessment';
import { cn } from '@/lib/utils';
import { Dropdown } from '@/presentation/components/ui/Dropdown';

interface CustomThemePanelProps {
  settings: Partial<AssessmentSettings>;
  onChange: (partial: Partial<AssessmentSettings>) => void;
}

const FONT_OPTIONS = [
  { id: 'geist-sans', text: 'Geist Sans' },
  { id: 'inter', text: 'Inter' },
  { id: 'merriweather', text: 'Merriweather' },
];

const BUTTON_STYLES: { value: ButtonStyle; label: string }[] = [
  { value: 'filled', label: 'Filled' },
  { value: 'outline', label: 'Outline' },
  { value: 'pill', label: 'Pill' },
];

const CARD_STYLES: { value: CardStyle; label: string }[] = [
  { value: 'bordered', label: 'Bordered' },
  { value: 'elevated', label: 'Elevated' },
  { value: 'flat', label: 'Flat' },
];

export function CustomThemePanel({ settings, onChange }: CustomThemePanelProps) {
  return (
    <div className="space-y-5">
      {/* Colors */}
      <div className="space-y-3">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Colors
        </h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Primary</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.primaryColor || '#6366F1'}
                onChange={(e) => onChange({ primaryColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor || '#6366F1'}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange({ primaryColor: v });
                }}
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Background</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={settings.backgroundColor || '#FFFFFF'}
                onChange={(e) => onChange({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded-lg border border-border cursor-pointer"
              />
              <input
                type="text"
                value={settings.backgroundColor || '#FFFFFF'}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) onChange({ backgroundColor: v });
                }}
                className="flex-1 px-2 py-1.5 rounded-lg border border-border bg-background text-foreground text-xs font-mono"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Font */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Font
        </h4>
        <Dropdown
          options={FONT_OPTIONS}
          value={settings.fontFamily || 'Geist Sans'}
          onChange={(value) => onChange({ fontFamily: value })}
          placeholder="Select a font..."
        />
      </div>

      {/* Border Radius */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Roundness
          </h4>
          <span className="text-xs text-muted-foreground">
            {settings.borderRadius || '12px'}
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="24"
          step="2"
          value={parseInt(settings.borderRadius || '12')}
          onChange={(e) => onChange({ borderRadius: `${e.target.value}px` })}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Sharp</span>
          <span>Rounded</span>
        </div>
      </div>

      {/* Button Style */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Button Style
        </h4>
        <div className="flex gap-2">
          {BUTTON_STYLES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ buttonStyle: opt.value })}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                (settings.buttonStyle || 'filled') === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Card Style */}
      <div className="space-y-2">
        <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Card Style
        </h4>
        <div className="flex gap-2">
          {CARD_STYLES.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ cardStyle: opt.value })}
              className={cn(
                'flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                (settings.cardStyle || 'bordered') === opt.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
