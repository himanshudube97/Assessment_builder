'use client';

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Palette, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TemplateGrid } from './TemplateGrid';
import { CustomThemePanel } from './CustomThemePanel';
import { BrandingPanel } from './BrandingPanel';
import type { AssessmentSettings } from '@/domain/entities/assessment';

type Tab = 'templates' | 'customize' | 'branding';

interface AppearanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings: AssessmentSettings | null;
  onApply: (settings: Partial<AssessmentSettings>) => Promise<void>;
}

const THEME_KEYS = [
  'primaryColor',
  'backgroundColor',
  'fontFamily',
  'borderRadius',
  'buttonStyle',
  'cardStyle',
] as const;

function pickThemeSettings(s: Partial<AssessmentSettings>): Partial<AssessmentSettings> {
  const result: Partial<AssessmentSettings> = {};
  for (const key of THEME_KEYS) {
    if (s[key] !== undefined) {
      (result as Record<string, unknown>)[key] = s[key];
    }
  }
  return result;
}

export function AppearanceModal({
  isOpen,
  onClose,
  currentSettings,
  onApply,
}: AppearanceModalProps) {
  const [tab, setTab] = useState<Tab>('templates');
  const [pending, setPending] = useState<Partial<AssessmentSettings>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Reset pending state when modal opens
  useEffect(() => {
    if (isOpen && currentSettings) {
      setPending(pickThemeSettings(currentSettings));
    }
    setTab('templates');
  }, [isOpen, currentSettings]);

  const handleChange = useCallback((partial: Partial<AssessmentSettings>) => {
    setPending((prev) => ({ ...prev, ...partial }));
  }, []);

  const handleApply = useCallback(async () => {
    setIsSaving(true);
    try {
      await onApply(pending);
      onClose();
    } finally {
      setIsSaving(false);
    }
  }, [pending, onApply, onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="relative w-full max-w-lg bg-background rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-muted">
                <Palette className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <h2 className="font-semibold text-foreground">Appearance</h2>
                <p className="text-sm text-muted-foreground">Choose a template or customize</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5 text-muted-foreground" />
            </button>
          </div>

          {/* Tabs */}
          <div className="px-6 pt-4">
            <div className="flex gap-1 p-1 rounded-lg bg-muted">
              {([
                { key: 'templates' as const, label: 'Templates' },
                { key: 'customize' as const, label: 'Customize' },
                { key: 'branding' as const, label: 'Branding' },
              ]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={cn(
                    'flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
                    tab === key
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1">
            {tab === 'templates' ? (
              <TemplateGrid
                currentSettings={pending}
                onSelect={handleChange}
              />
            ) : tab === 'customize' ? (
              <CustomThemePanel
                settings={pending}
                onChange={handleChange}
              />
            ) : (
              <BrandingPanel
                settings={pending}
                onChange={handleChange}
              />
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:bg-muted transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              disabled={isSaving}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                'bg-primary text-primary-foreground hover:bg-primary/90',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Palette className="h-4 w-4" />
              )}
              Apply Theme
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
