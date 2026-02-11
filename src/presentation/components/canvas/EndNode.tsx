'use client';

/**
 * EndNode Component
 * The completion point of an assessment flow
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { Flag, ExternalLink, Trophy } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { EndNodeData } from '@/domain/entities/flow';

export const EndNode = memo(function EndNode({
  id,
  data,
  selected,
}: NodeProps<EndNodeData>) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      type="end"
      title="End"
      icon={<Flag className="h-4 w-4" />}
      showSourceHandle={false}
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">{data.title}</h3>
        {data.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}

        <div className="flex flex-wrap gap-2 pt-1">
          {data.showScore && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
              <Trophy className="h-3 w-3" />
              Show Score
            </span>
          )}
          {data.redirectUrl && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300">
              <ExternalLink className="h-3 w-3" />
              Redirect
            </span>
          )}
        </div>
      </div>
    </BaseNode>
  );
});
