/**
 * Layout utilities for the flow canvas
 * - tidyLayout: Gentle cleanup that respects user positioning
 * - getLayoutedElements: Full dagre layout (aggressive repositioning)
 */

import dagre from 'dagre';
import type { Node, Edge } from 'reactflow';

interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL'; // Top-Bottom, Left-Right, etc.
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number; // Vertical spacing between ranks
  nodeSep?: number; // Horizontal spacing between nodes
}

const defaultOptions: Required<LayoutOptions> = {
  direction: 'LR',
  nodeWidth: 280,
  nodeHeight: 180,
  rankSep: 80,
  nodeSep: 50,
};

interface TidyLayoutOptions {
  nodeWidth?: number;
  nodeHeight?: number;
  minGapX?: number;
  minGapY?: number;
  gridSize?: number;
  direction?: 'LR' | 'TB';
}

const defaultTidyOptions: Required<TidyLayoutOptions> = {
  nodeWidth: 280,
  nodeHeight: 180,
  minGapX: 40,
  minGapY: 40,
  gridSize: 20,
  direction: 'LR',
};

/**
 * Checks if two nodes overlap (with optional minimum gap)
 */
function nodesOverlap(
  nodeA: { x: number; y: number },
  nodeB: { x: number; y: number },
  width: number,
  height: number,
  gapX: number,
  gapY: number
): boolean {
  const aRight = nodeA.x + width + gapX;
  const aBottom = nodeA.y + height + gapY;
  const bRight = nodeB.x + width;
  const bBottom = nodeB.y + height;

  return !(
    nodeA.x >= bRight + gapX ||
    aRight <= nodeB.x ||
    nodeA.y >= bBottom + gapY ||
    aBottom <= nodeB.y
  );
}

/**
 * Snaps a value to the nearest grid unit
 */
function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Tidy Up Layout - Gentle cleanup that respects user positioning
 *
 * This layout algorithm:
 * 1. Preserves the user's general arrangement
 * 2. Resolves overlapping nodes by pushing them apart
 * 3. Ensures minimum spacing between nodes
 * 4. Snaps positions to grid for alignment
 */
export function tidyLayout<N extends Node>(
  nodes: N[],
  options: TidyLayoutOptions = {}
): N[] {
  if (nodes.length === 0) return nodes;

  const opts = { ...defaultTidyOptions, ...options };
  const { nodeWidth, nodeHeight, minGapX, minGapY, gridSize, direction } = opts;
  const isTB = direction === 'TB';

  // Create a mutable copy of positions
  const positions = nodes.map((node) => ({
    id: node.id,
    x: node.position.x,
    y: node.position.y,
  }));

  // Sort nodes in reading order based on direction
  // LR: sort by X then Y (left to right, top to bottom)
  // TB: sort by Y then X (top to bottom, left to right)
  const sortedIndices = positions
    .map((_, i) => i)
    .sort((a, b) => {
      if (isTB) {
        const yDiff = positions[a].y - positions[b].y;
        if (Math.abs(yDiff) > nodeHeight / 2) return yDiff;
        return positions[a].x - positions[b].x;
      }
      const xDiff = positions[a].x - positions[b].x;
      if (Math.abs(xDiff) > nodeWidth / 2) return xDiff;
      return positions[a].y - positions[b].y;
    });

  // Resolve overlaps by iterating through sorted nodes
  // Each node checks against all previously processed nodes
  for (let i = 1; i < sortedIndices.length; i++) {
    const currentIdx = sortedIndices[i];
    const current = positions[currentIdx];

    // Check against all previously processed nodes
    for (let j = 0; j < i; j++) {
      const prevIdx = sortedIndices[j];
      const prev = positions[prevIdx];

      // Check if nodes overlap (including minimum gap)
      if (nodesOverlap(prev, current, nodeWidth, nodeHeight, minGapX, minGapY)) {
        // Calculate how much to push the current node
        const overlapX = prev.x + nodeWidth + minGapX - current.x;
        const overlapY = prev.y + nodeHeight + minGapY - current.y;

        if (isTB) {
          // TB: prefer pushing down, then right
          if (overlapY > 0 && overlapY <= overlapX) {
            current.y = prev.y + nodeHeight + minGapY;
          } else if (overlapX > 0) {
            current.x = prev.x + nodeWidth + minGapX;
          }
        } else {
          // LR: prefer pushing right, then down
          if (overlapX > 0 && overlapX <= overlapY) {
            current.x = prev.x + nodeWidth + minGapX;
          } else if (overlapY > 0) {
            current.y = prev.y + nodeHeight + minGapY;
          }
        }
      }
    }
  }

  // Snap all positions to grid
  positions.forEach((pos) => {
    pos.x = snapToGrid(pos.x, gridSize);
    pos.y = snapToGrid(pos.y, gridSize);
  });

  // Second pass: final overlap resolution after grid snapping
  // Grid snapping might have reintroduced some overlaps
  for (let i = 1; i < sortedIndices.length; i++) {
    const currentIdx = sortedIndices[i];
    const current = positions[currentIdx];

    for (let j = 0; j < i; j++) {
      const prevIdx = sortedIndices[j];
      const prev = positions[prevIdx];

      if (nodesOverlap(prev, current, nodeWidth, nodeHeight, minGapX, minGapY)) {
        // After snapping, push right by one grid-aligned step
        current.x = snapToGrid(prev.x + nodeWidth + minGapX, gridSize);
      }
    }
  }

  // Create new nodes with updated positions
  return nodes.map((node) => {
    const pos = positions.find((p) => p.id === node.id)!;
    return {
      ...node,
      position: {
        x: pos.x,
        y: pos.y,
      },
    };
  });
}

/**
 * Applies dagre layout to nodes and edges
 * Returns new nodes with updated positions
 */
export function getLayoutedElements<N extends Node, E extends Edge>(
  nodes: N[],
  edges: E[],
  options: LayoutOptions = {}
): { nodes: N[]; edges: E[] } {
  const opts = { ...defaultOptions, ...options };

  const dagreGraph = new dagre.graphlib.Graph();
  dagreGraph.setDefaultEdgeLabel(() => ({}));
  dagreGraph.setGraph({
    rankdir: opts.direction,
    ranksep: opts.rankSep,
    nodesep: opts.nodeSep,
    marginx: 40,
    marginy: 40,
  });

  // Add nodes to dagre graph
  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, {
      width: opts.nodeWidth,
      height: opts.nodeHeight,
    });
  });

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  // Run the layout algorithm
  dagre.layout(dagreGraph);

  // Apply the calculated positions to nodes
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    return {
      ...node,
      position: {
        // Center the node on the calculated position
        x: nodeWithPosition.x - opts.nodeWidth / 2,
        y: nodeWithPosition.y - opts.nodeHeight / 2,
      },
    };
  });

  return { nodes: layoutedNodes, edges };
}
