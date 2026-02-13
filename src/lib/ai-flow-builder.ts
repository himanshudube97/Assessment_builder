/**
 * AI Flow Builder
 *
 * Deterministic converter: validated AI JSON → FlowNode[] + FlowEdge[]
 * Uses existing factory functions so structure is always correct.
 */

import type { AIAssessmentOutput } from '@/domain/schemas/ai-assessment.schema';
import type {
  FlowNode,
  FlowEdge,
  QuestionNodeData,
  ConditionType,
  EdgeCondition,
} from '@/domain/entities/flow';
import {
  createStartNode,
  createQuestionNode,
  createEndNode,
  createEdge,
} from '@/domain/entities/flow';
import { getLayoutedElements } from '@/lib/layout';
import type { Node, Edge } from 'reactflow';

interface BuildResult {
  title: string;
  description: string | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

export function buildFlowFromAIOutput(output: AIAssessmentOutput): BuildResult {
  // Placeholder position — dagre will reposition everything
  const POS = { x: 0, y: 0 };

  // 1. Create start node
  const startNode = createStartNode(POS);
  startNode.data = {
    title: output.startNode.title,
    description: output.startNode.description,
    buttonText: output.startNode.buttonText,
  };

  // 2. Create question nodes, tracking AI id → real node id
  const idMap = new Map<string, string>();
  const questionNodes: FlowNode[] = [];

  for (const q of output.questions) {
    const node = createQuestionNode(POS, q.type);
    idMap.set(q.id, node.id);

    const data = node.data as QuestionNodeData;
    data.questionText = q.text;
    data.description = q.description;
    data.required = q.required;

    // Populate options for option-based types
    const optionTypes = [
      'multiple_choice_single',
      'multiple_choice_multi',
      'dropdown',
      'yes_no',
    ];
    if (q.options && optionTypes.includes(q.type)) {
      data.options = q.options.map((text, i) => ({
        id: `opt-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
        text,
      }));
    }

    // Populate rating/NPS fields
    if (q.type === 'rating' || q.type === 'nps') {
      data.minValue = q.min ?? (q.type === 'nps' ? 0 : 1);
      data.maxValue = q.max ?? (q.type === 'nps' ? 10 : 5);
      if (q.minLabel) data.minLabel = q.minLabel;
      if (q.maxLabel) data.maxLabel = q.maxLabel;
    }

    // Populate number fields
    if (q.type === 'number') {
      if (q.min != null) data.minValue = q.min;
      if (q.max != null) data.maxValue = q.max;
    }

    node.data = data;
    questionNodes.push(node);
  }

  // 3. Create end node
  const endNode = createEndNode(POS);
  endNode.data = {
    title: output.endNode.title,
    description: output.endNode.description,
    showScore: output.endNode.showScore,
    redirectUrl: null,
  };

  // 4. Build linear edge chain: start → q1 → q2 → ... → end
  const allNodes = [startNode, ...questionNodes, endNode];
  const edges: FlowEdge[] = [];

  edges.push(createEdge(startNode.id, questionNodes[0].id));

  for (let i = 0; i < questionNodes.length - 1; i++) {
    edges.push(createEdge(questionNodes[i].id, questionNodes[i + 1].id));
  }

  edges.push(
    createEdge(questionNodes[questionNodes.length - 1].id, endNode.id)
  );

  // 5. Add branching edges (additive on top of the linear chain)
  for (const branch of output.branching) {
    const sourceId = idMap.get(branch.from);
    const targetId =
      branch.goto === 'end' ? endNode.id : idMap.get(branch.goto);

    if (!sourceId || !targetId) continue;

    // Skip if this edge duplicates an existing linear edge
    const duplicate = edges.some(
      (e) => e.source === sourceId && e.target === targetId && !e.condition
    );
    if (duplicate) {
      // Update the existing edge with the condition instead of adding a duplicate
      const existing = edges.find(
        (e) => e.source === sourceId && e.target === targetId && !e.condition
      );
      if (existing) {
        existing.condition = {
          type: branch.condition as ConditionType,
          value: branch.value,
        };
        continue;
      }
    }

    const condition: EdgeCondition = {
      type: branch.condition as ConditionType,
      value: branch.value,
    };

    edges.push(createEdge(sourceId, targetId, condition));
  }

  // 6. Auto-layout with dagre (left-to-right)
  const rfNodes: Node[] = allNodes.map((n) => ({
    id: n.id,
    type: n.type,
    position: n.position,
    data: n.data,
  }));
  const rfEdges: Edge[] = edges.map((e) => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
  }));

  const layouted = getLayoutedElements(rfNodes, rfEdges, {
    direction: 'LR',
    rankSep: 100,
    nodeSep: 60,
  });

  // Map layouted positions back to domain nodes
  const layoutMap = new Map(
    layouted.nodes.map((n) => [n.id, n.position])
  );
  for (const node of allNodes) {
    const pos = layoutMap.get(node.id);
    if (pos) node.position = pos;
  }

  return {
    title: output.title,
    description: output.description,
    nodes: allNodes,
    edges,
  };
}
