'use client';

/**
 * StartNode Component
 * The entry point of an assessment flow
 */

import { memo } from 'react';
import { type NodeProps } from 'reactflow';
import { Play } from 'lucide-react';
import { BaseNode } from './BaseNode';
import type { StartNodeData } from '@/domain/entities/flow';

export const StartNode = memo(function StartNode({
  id,
  data,
  selected,
}: NodeProps<StartNodeData>) {
  return (
    <BaseNode
      id={id}
      selected={selected}
      type="start"
      title="Start"
      icon={<Play className="h-4 w-4" />}
      showTargetHandle={false}
      dataTour="start-node"
    >
      <div className="space-y-2">
        <h3 className="font-semibold text-foreground">{data.title}</h3>
        {data.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {data.description}
          </p>
        )}
        <div className="pt-2">
          <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            {data.buttonText}
          </span>
        </div>
      </div>
    </BaseNode>
  );
});
