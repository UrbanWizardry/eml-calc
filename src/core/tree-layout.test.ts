import { describe, it, expect } from 'vitest';
import { layoutTree, layoutBounds, NODE_W, NODE_H } from './tree-layout';
import { emlExpT, emlLnT, emlAddT, emlSinT } from './eml-traced';
import { Complex } from './complex';
import type { TreeNode, Traced } from './eml-traced';

function inp(x: number): Traced {
  return [Complex.from(x), { kind: 'input', label: 'x', value: Complex.from(x) }];
}

// Path-based IDs: root="r", expansion=".e", left=".l", right=".r"

describe('layoutTree (top-to-bottom)', () => {
  it('leaf node has basic dimensions', () => {
    const leaf: TreeNode = { kind: 'const', label: '1', value: Complex.ONE };
    const layout = layoutTree(leaf);
    expect(layout.id).toBe('r');
    expect(layout.span).toBe(NODE_W);
    expect(layout.depth).toBe(NODE_H);
    expect(layout.children).toHaveLength(0);
    expect(layout.label).toBe('1');
  });

  it('collapsed named node has no children in layout', () => {
    const [, tree] = emlExpT(inp(2));
    const layout = layoutTree(tree);
    expect(layout.label).toBe('exp');
    expect(layout.children).toHaveLength(0);
    expect(layout.span).toBe(NODE_W);
  });

  it('expanded named node shows expansion subtree', () => {
    const [, tree] = emlExpT(inp(2));
    // root "r" is the named 'exp'; expand it
    const layout = layoutTree(tree, new Set(['r']));
    expect(layout.children).toHaveLength(1);
    expect(layout.children[0].label).toBe('eml');
    expect(layout.children[0].id).toBe('r.e');
  });

  it('eml node in expanded tree shows left and right children', () => {
    const [, tree] = emlExpT(inp(2));
    // "r" = named exp, "r.e" = the eml inside (always shows children)
    const layout = layoutTree(tree, new Set(['r']));
    const emlNode = layout.children[0];
    expect(emlNode.label).toBe('eml');
    // eml nodes always show their left/right children
    expect(emlNode.children).toHaveLength(2);
    expect(emlNode.children[0].id).toBe('r.e.l');
    expect(emlNode.children[1].id).toBe('r.e.r');
  });

  it('layout span grows with expanded children', () => {
    const [, tree] = emlLnT(inp(5));
    const collapsedLayout = layoutTree(tree);
    const expandedLayout = layoutTree(tree, new Set(['r']));
    expect(expandedLayout.span).toBeGreaterThanOrEqual(collapsedLayout.span);
  });

  it('all node positions are non-negative', () => {
    const [, tree] = emlAddT(inp(3), inp(4));
    const layout = layoutTree(tree, new Set(['r', 'r.e']));

    function checkPositive(node: typeof layout) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      node.children.forEach(checkPositive);
    }
    checkPositive(layout);
  });

  it('layoutBounds returns correct dimensions', () => {
    const leaf: TreeNode = { kind: 'const', label: '1', value: Complex.ONE };
    const layout = layoutTree(leaf);
    const bounds = layoutBounds(layout);
    expect(bounds.width).toBe(NODE_W);
    expect(bounds.height).toBe(NODE_H);
  });

  it('sin tree creates a valid layout', () => {
    const [, tree] = emlSinT(inp(0.5));
    const layout = layoutTree(tree);
    expect(layout.label).toBe('sin');
    const bounds = layoutBounds(layout);
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
  });

  it('expanding one node does not collapse another', () => {
    const [, tree] = emlAddT(inp(3), inp(4));
    // add -> sub (r.e) -> two children we can both expand
    const layout1 = layoutTree(tree, new Set(['r', 'r.e']));
    const sub = layout1.children[0]; // the sub node
    expect(sub.label).toBe('sub');
    // sub has children; expand one of them too
    const childIds = sub.children.map(c => c.id);
    expect(childIds.length).toBeGreaterThan(0);

    // Expand both r.e and a child - both should stay expanded
    const expandedSet = new Set(['r', 'r.e', ...childIds]);
    const layout2 = layoutTree(tree, expandedSet);
    const sub2 = layout2.children[0];
    // sub should still be expanded (same id "r.e")
    expect(sub2.children.length).toBeGreaterThan(0);
    // And its children that were in the expanded set should also be expanded
    for (const child of sub2.children) {
      if (expandedSet.has(child.id) && child.sourceNode.kind === 'named') {
        expect(child.children.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('layoutTree (left-to-right)', () => {
  it('leaf node has swapped dimensions', () => {
    const leaf: TreeNode = { kind: 'const', label: '1', value: Complex.ONE };
    const layout = layoutTree(leaf, new Set(), 'lr');
    expect(layout.span).toBe(NODE_H);
    expect(layout.depth).toBe(NODE_W);
  });

  it('layoutBounds swaps axes for LR', () => {
    const leaf: TreeNode = { kind: 'const', label: '1', value: Complex.ONE };
    const layout = layoutTree(leaf, new Set(), 'lr');
    const bounds = layoutBounds(layout, 'lr');
    expect(bounds.width).toBe(NODE_W);
    expect(bounds.height).toBe(NODE_H);
  });

  it('expanded tree grows rightward', () => {
    const [, tree] = emlExpT(inp(2));
    const collapsed = layoutTree(tree, new Set(), 'lr');
    const expanded = layoutTree(tree, new Set(['r']), 'lr');
    expect(expanded.depth).toBeGreaterThan(collapsed.depth);
  });

  it('all node positions are non-negative in LR mode', () => {
    const [, tree] = emlAddT(inp(3), inp(4));
    const layout = layoutTree(tree, new Set(['r', 'r.e']), 'lr');

    function checkPositive(node: typeof layout) {
      expect(node.x).toBeGreaterThanOrEqual(0);
      expect(node.y).toBeGreaterThanOrEqual(0);
      node.children.forEach(checkPositive);
    }
    checkPositive(layout);
  });

  it('IDs are identical between TB and LR for same expanded set', () => {
    const [, tree] = emlExpT(inp(2));
    const expandedSet = new Set(['r']);
    const tb = layoutTree(tree, expandedSet, 'tb');
    const lr = layoutTree(tree, expandedSet, 'lr');
    expect(tb.id).toBe(lr.id);
    expect(tb.children[0].id).toBe(lr.children[0].id);
  });
});
