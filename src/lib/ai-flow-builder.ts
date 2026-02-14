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
  //
  // Strategy: For option-based types (yes_no, multiple_choice_single, dropdown)
  // with "equals" conditions, use per-option sourceHandle branching instead of
  // edge conditions. This avoids redundant condition labels on the canvas.
  // For all other types (number, rating, text, etc.), use edge conditions.

  const OPTION_BASED_TYPES = new Set([
    'yes_no',
    'multiple_choice_single',
    'dropdown',
  ]);

  // Group branches by source node to handle per-option branching holistically
  const branchesBySource = new Map<string, typeof output.branching>();
  for (const branch of output.branching) {
    const list = branchesBySource.get(branch.from) || [];
    list.push(branch);
    branchesBySource.set(branch.from, list);
  }

  for (const [aiSourceId, branches] of branchesBySource) {
    const sourceId = idMap.get(aiSourceId);
    if (!sourceId) continue;

    const sourceQuestion = output.questions.find((q) => q.id === aiSourceId);
    const sourceNode = questionNodes.find((n) => n.id === sourceId);
    if (!sourceQuestion || !sourceNode) continue;

    const data = sourceNode.data as QuestionNodeData;
    const isOptionType =
      OPTION_BASED_TYPES.has(sourceQuestion.type) && data.options;

    if (isOptionType && branches.every((b) => b.condition === 'equals')) {
      // --- Per-option branching ---
      data.enableBranching = true;

      // Find the linear chain edge from this node (sourceHandle: null)
      const linearEdgeIdx = edges.findIndex(
        (e) => e.source === sourceId && !e.sourceHandle && !e.condition
      );
      const linearTarget =
        linearEdgeIdx !== -1 ? edges[linearEdgeIdx].target : null;

      // Build a map of optionId → target for explicit branches
      const optionTargetMap = new Map<string, string>();
      for (const branch of branches) {
        const targetId =
          branch.goto === 'end' ? endNode.id : idMap.get(branch.goto);
        if (!targetId) continue;

        const matchedOption = data.options!.find(
          (opt) => opt.text === String(branch.value)
        );
        if (matchedOption) {
          optionTargetMap.set(matchedOption.id, targetId);
        }
      }

      // Create edges for every option
      for (const option of data.options!) {
        const target = optionTargetMap.get(option.id) || linearTarget;
        if (!target) continue;

        // Check if this reuses the existing linear edge target
        const existingIdx = edges.findIndex(
          (e) =>
            e.source === sourceId &&
            e.target === target &&
            !e.sourceHandle
        );
        if (existingIdx !== -1) {
          // Reuse and set sourceHandle
          edges[existingIdx].sourceHandle = option.id;
        } else {
          edges.push(createEdge(sourceId, target, null, option.id));
        }
      }

      // Remove the original linear chain edge if it still has sourceHandle: null
      // (it was either reused above or is now redundant)
      const remainingLinearIdx = edges.findIndex(
        (e) => e.source === sourceId && !e.sourceHandle && !e.condition
      );
      if (remainingLinearIdx !== -1) {
        edges.splice(remainingLinearIdx, 1);
      }
    } else {
      // --- Edge condition branching (number, rating, text, etc.) ---
      for (const branch of branches) {
        const targetId =
          branch.goto === 'end' ? endNode.id : idMap.get(branch.goto);
        if (!targetId) continue;

        const existing = edges.find(
          (e) => e.source === sourceId && e.target === targetId
        );
        if (existing) {
          existing.condition = {
            type: branch.condition as ConditionType,
            value: branch.value,
          };
          continue;
        }

        const condition: EdgeCondition = {
          type: branch.condition as ConditionType,
          value: branch.value,
        };
        edges.push(createEdge(sourceId, targetId, condition));
      }
    }
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
