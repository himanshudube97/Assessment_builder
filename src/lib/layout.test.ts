import { describe, it, expect } from 'vitest';
import { tidyLayout, getLayoutedElements } from './layout';
import type { Node, Edge } from 'reactflow';

function makeNode(id: string, x: number, y: number): Node {
  return {
    id,
    position: { x, y },
    data: {},
  };
}

describe('tidyLayout', () => {
  it('returns empty array for empty input', () => {
    expect(tidyLayout([])).toEqual([]);
  });

  it('does not move a single node significantly', () => {
    const nodes = [makeNode('a', 100, 200)];
    const result = tidyLayout(nodes);
    // Should snap to grid (gridSize=20 by default) but stay close
    expect(result[0].position.x).toBe(100); // already on grid
    expect(result[0].position.y).toBe(200); // already on grid
  });

  it('resolves overlapping nodes by pushing them apart', () => {
    // Two nodes at the same position
    const nodes = [makeNode('a', 0, 0), makeNode('b', 0, 0)];
    const result = tidyLayout(nodes);
    // They should no longer overlap
    const a = result.find((n) => n.id === 'a')!;
    const b = result.find((n) => n.id === 'b')!;
    const separated =
      Math.abs(a.position.x - b.position.x) >= 280 ||
      Math.abs(a.position.y - b.position.y) >= 180;
    expect(separated).toBe(true);
  });

  it('snaps positions to grid (default gridSize 20)', () => {
    const nodes = [makeNode('a', 13, 27)];
    const result = tidyLayout(nodes);
    expect(result[0].position.x % 20).toBe(0);
    expect(result[0].position.y % 20).toBe(0);
  });

  it('preserves user positioning when no overlaps exist', () => {
    const nodes = [
      makeNode('a', 0, 0),
      makeNode('b', 400, 0),
      makeNode('c', 0, 300),
    ];
    const result = tidyLayout(nodes);
    // Positions should be close to original (just grid-snapped)
    expect(result.find((n) => n.id === 'a')!.position).toEqual({ x: 0, y: 0 });
    expect(result.find((n) => n.id === 'b')!.position).toEqual({ x: 400, y: 0 });
    expect(result.find((n) => n.id === 'c')!.position).toEqual({ x: 0, y: 300 });
  });

  it('returns same number of nodes', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 50, 50)];
    const result = tidyLayout(nodes);
    expect(result).toHaveLength(2);
  });
});

describe('getLayoutedElements', () => {
  it('returns same number of nodes and edges', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 0, 0)];
    const edges: Edge[] = [{ id: 'e1', source: 'a', target: 'b' }];
    const result = getLayoutedElements(nodes, edges);
    expect(result.nodes).toHaveLength(2);
    expect(result.edges).toHaveLength(1);
  });

  it('positions nodes with dagre algorithm', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 0, 0), makeNode('c', 0, 0)];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b' },
      { id: 'e2', source: 'b', target: 'c' },
    ];
    const result = getLayoutedElements(nodes, edges);
    // In TB direction, nodes should be vertically ordered
    const aY = result.nodes.find((n) => n.id === 'a')!.position.y;
    const bY = result.nodes.find((n) => n.id === 'b')!.position.y;
    const cY = result.nodes.find((n) => n.id === 'c')!.position.y;
    expect(aY).toBeLessThan(bY);
    expect(bY).toBeLessThan(cY);
  });

  it('handles LR direction', () => {
    const nodes = [makeNode('a', 0, 0), makeNode('b', 0, 0)];
    const edges: Edge[] = [{ id: 'e1', source: 'a', target: 'b' }];
    const result = getLayoutedElements(nodes, edges, { direction: 'LR' });
    // In LR direction, nodes should be horizontally ordered
    const aX = result.nodes.find((n) => n.id === 'a')!.position.x;
    const bX = result.nodes.find((n) => n.id === 'b')!.position.x;
    expect(aX).toBeLessThan(bX);
  });
});
