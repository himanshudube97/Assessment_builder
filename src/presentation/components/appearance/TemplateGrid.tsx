'use client';

import { THEME_TEMPLATES } from '@/domain/constants/templates';
import { TemplateCard } from './TemplateCard';
import type { AssessmentSettings } from '@/domain/entities/assessment';

interface TemplateGridProps {
  currentSettings: Partial<AssessmentSettings>;
  onSelect: (values: Partial<AssessmentSettings>) => void;
}

function getSelectedTemplateId(settings: Partial<AssessmentSettings>): string | null {
  return THEME_TEMPLATES.find((t) =>
    t.values.primaryColor === settings.primaryColor &&
    t.values.backgroundColor === settings.backgroundColor &&
    t.values.fontFamily === (settings.fontFamily || 'Geist Sans') &&
    t.values.borderRadius === (settings.borderRadius || '12px') &&
    t.values.buttonStyle === (settings.buttonStyle || 'filled') &&
    t.values.cardStyle === (settings.cardStyle || 'bordered')
  )?.id ?? null;
}

export function TemplateGrid({ currentSettings, onSelect }: TemplateGridProps) {
  const selectedId = getSelectedTemplateId(currentSettings);

  return (
    <div className="grid grid-cols-3 gap-3">
      {THEME_TEMPLATES.map((template) => (
        <TemplateCard
          key={template.id}
          template={template}
          isSelected={selectedId === template.id}
          onSelect={() => onSelect(template.values)}
        />
      ))}
    </div>
  );
}
