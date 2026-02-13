'use client';

/**
 * TemplateGrid Component
 * Displays a grid of theme template options
 */

import { useState } from 'react';
import { THEME_TEMPLATES } from '@/domain/constants/templates';
import { TemplateCard } from './TemplateCard';
import type { AssessmentSettings } from '@/domain/entities/assessment';

interface TemplateGridProps {
  currentSettings: Partial<AssessmentSettings>;
  onSelect: (values: Partial<AssessmentSettings>) => void;
}

type FilterType = 'all' | 'animated' | 'plain';

export function TemplateGrid({ currentSettings, onSelect }: TemplateGridProps) {
  const [filter, setFilter] = useState<FilterType>('all');

  // Find currently selected template
  const selectedId = THEME_TEMPLATES.find((t) => {
    return (
      t.values.primaryColor === currentSettings.primaryColor &&
      t.values.backgroundColor === currentSettings.backgroundColor
    );
  })?.id;

  // Filter templates
  const filteredTemplates = THEME_TEMPLATES.filter((template) => {
    if (filter === 'animated') {
      return template.values.backgroundDecoration && template.values.backgroundDecoration.type !== 'none';
    }
    if (filter === 'plain') {
      return !template.values.backgroundDecoration || template.values.backgroundDecoration.type === 'none';
    }
    return true; // 'all'
  });

  return (
    <div>
      {/* Filter tabs */}
      <div className="flex gap-2 mb-4 border-b border-border">
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${filter === 'all'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          All Templates ({THEME_TEMPLATES.length})
        </button>
        <button
          onClick={() => setFilter('animated')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-1 ${filter === 'animated'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          ✨ Animated ({THEME_TEMPLATES.filter(t => t.values.backgroundDecoration && t.values.backgroundDecoration.type !== 'none').length})
        </button>
        <button
          onClick={() => setFilter('plain')}
          className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${filter === 'plain'
            ? 'border-primary text-primary'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          Plain ({THEME_TEMPLATES.filter(t => !t.values.backgroundDecoration || t.values.backgroundDecoration.type === 'none').length})
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {filteredTemplates.map((template) => (
          <TemplateCard
            key={template.id}
            template={template}
            isSelected={selectedId === template.id}
            onSelect={() => onSelect(template.values)}
          />
        ))}
      </div>
    </div>
  );
}
