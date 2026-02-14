/**
 * Graph Traversal Utilities
 * Functions to traverse the flow graph and find connected nodes
 */

import type { Edge, Node } from 'reactflow';

type RFNode = Node;
type RFEdge = Edge;

/**
 * Get all downstream nodes (following edge direction from the given node)
 * Uses BFS to traverse the graph
 */
export function getDownstreamNodes(
  nodeId: string,
  nodes: RFNode[],
  edges: RFEdge[]
): string[] {
  const visited = new Set<string>([nodeId]);
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Find all outgoing edges from current node
    edges
      .filter(e => e.source === current && !visited.has(e.target))
      .forEach(edge => {
        visited.add(edge.target);
        queue.push(edge.target);
      });
  }

  return Array.from(visited);
}

/**
 * Get all upstream nodes (against edge direction, leading to the given node)
 * Uses BFS to traverse the graph backwards
 */
export function getUpstreamNodes(
  nodeId: string,
  nodes: RFNode[],
  edges: RFEdge[]
): string[] {
  const visited = new Set<string>([nodeId]);
  const queue = [nodeId];

  while (queue.length > 0) {
    const current = queue.shift()!;

    // Find all incoming edges to current node
    edges
      .filter(e => e.target === current && !visited.has(e.source))
      .forEach(edge => {
        visited.add(edge.source);
        queue.push(edge.source);
      });
  }

  return Array.from(visited);
}

/**
 * Get the full connected branch (both upstream and downstream)
 * Returns both highlighted node IDs and edge IDs
 */
export function getConnectedBranch(
  nodeId: string,
  nodes: RFNode[],
  edges: RFEdge[],
  mode: 'full' | 'downstream' | 'upstream' = 'full'
): { nodeIds: string[]; edgeIds: string[] } {
  let nodeIds: string[];

  switch (mode) {
    case 'downstream':
      nodeIds = getDownstreamNodes(nodeId, nodes, edges);
      break;
    case 'upstream':
      nodeIds = getUpstreamNodes(nodeId, nodes, edges);
      break;
    case 'full':
    default:
      const downstream = getDownstreamNodes(nodeId, nodes, edges);
      const upstream = getUpstreamNodes(nodeId, nodes, edges);
      nodeIds = Array.from(new Set([...downstream, ...upstream]));
      break;
  }

  // Get all edges between highlighted nodes
  const nodeSet = new Set(nodeIds);
  const edgeIds = edges
    .filter(e => nodeSet.has(e.source) && nodeSet.has(e.target))
    .map(e => e.id);

  return { nodeIds, edgeIds };
}
