import type { TreeNode } from './eml-traced';

export type Orientation = 'tb' | 'lr';

export interface LayoutNode {
  id: string;
  x: number;
  y: number;
  /** Subtree extent in the primary axis (horizontal for tb, vertical for lr). */
  span: number;
  /** Subtree extent in the secondary axis. */
  depth: number;
  label: string;
  kind: TreeNode['kind'];
  value: string;
  children: LayoutNode[];
  sourceNode: TreeNode;
}

const NODE_W = 64;
const NODE_H = 32;
const SIBLING_GAP = 12;
const LEVEL_GAP = 48;

function formatValue(node: TreeNode): string {
  const v = node.value;
  if (!isFinite(v.re) || isNaN(v.re)) return '?';
  if (Math.abs(v.im) < 1e-10) {
    return formatNum(v.re);
  }
  if (Math.abs(v.re) < 1e-10) {
    return `${formatNum(v.im)}i`;
  }
  const sign = v.im >= 0 ? '+' : '-';
  return `${formatNum(v.re)}${sign}${formatNum(Math.abs(v.im))}i`;
}

function formatNum(n: number): string {
  if (Number.isInteger(n) && Math.abs(n) < 1e6) return String(n);
  const s = n.toPrecision(4);
  if (s.includes('.')) return s.replace(/\.?0+$/, '');
  return s;
}

function nodeLabel(node: TreeNode): string {
  switch (node.kind) {
    case 'eml': return 'eml';
    case 'const': return node.label;
    case 'input': return node.label;
    case 'named': return node.name;
  }
}

/**
 * Get display children and their path suffixes.
 * Path suffixes are stable regardless of which other nodes are expanded:
 * - eml nodes: children get ".l" (left) and ".r" (right)
 * - named nodes: expansion gets ".e"
 */
function getDisplayChildren(
  node: TreeNode,
  expanded: ReadonlySet<string>,
  nodeId: string,
): Array<{ child: TreeNode; suffix: string }> {
  switch (node.kind) {
    case 'const':
    case 'input':
      return [];
    case 'eml':
      return [
        { child: node.left, suffix: '.l' },
        { child: node.right, suffix: '.r' },
      ];
    case 'named':
      if (expanded.has(nodeId)) {
        return [{ child: node.expansion, suffix: '.e' }];
      }
      return [];
  }
}

// ─── Top-to-bottom layout ───────────────────────────────────────────────

function layoutNodeTB(
  node: TreeNode,
  x: number,
  y: number,
  id: string,
  expanded: ReadonlySet<string>,
): LayoutNode {
  const displayChildren = getDisplayChildren(node, expanded, id);

  if (displayChildren.length === 0) {
    return {
      id, x, y,
      span: NODE_W, depth: NODE_H,
      label: nodeLabel(node), kind: node.kind,
      value: formatValue(node), children: [], sourceNode: node,
    };
  }

  const childLayouts: LayoutNode[] = [];
  let totalChildSpan = 0;
  for (let i = 0; i < displayChildren.length; i++) {
    if (i > 0) totalChildSpan += SIBLING_GAP;
    const { child, suffix } = displayChildren[i];
    const childLayout = layoutNodeTB(child, 0, 0, id + suffix, expanded);
    childLayouts.push(childLayout);
    totalChildSpan += childLayout.span;
  }

  const mySpan = Math.max(NODE_W, totalChildSpan);
  const childY = y + NODE_H + LEVEL_GAP;

  let childX = x + (mySpan - totalChildSpan) / 2;
  for (const child of childLayouts) {
    offsetTB(child, childX, childY);
    childX += child.span + SIBLING_GAP;
  }

  const maxChildDepth = Math.max(...childLayouts.map(c => c.depth));

  return {
    id,
    x: x + mySpan / 2 - NODE_W / 2,
    y,
    span: mySpan,
    depth: NODE_H + LEVEL_GAP + maxChildDepth,
    label: nodeLabel(node), kind: node.kind,
    value: formatValue(node), children: childLayouts, sourceNode: node,
  };
}

function offsetTB(node: LayoutNode, dx: number, dy: number): void {
  const totalChildSpan = node.children.reduce(
    (sum, c, i) => sum + c.span + (i > 0 ? SIBLING_GAP : 0), 0,
  );
  node.x = dx + (node.span / 2 - NODE_W / 2);
  node.y = dy;
  let childX = dx + (node.span - totalChildSpan) / 2;
  for (const child of node.children) {
    offsetTB(child, childX, dy + NODE_H + LEVEL_GAP);
    childX += child.span + SIBLING_GAP;
  }
}

// ─── Left-to-right layout ───────────────────────────────────────────────

function layoutNodeLR(
  node: TreeNode,
  x: number,
  y: number,
  id: string,
  expanded: ReadonlySet<string>,
): LayoutNode {
  const displayChildren = getDisplayChildren(node, expanded, id);

  if (displayChildren.length === 0) {
    return {
      id, x, y,
      span: NODE_H,
      depth: NODE_W,
      label: nodeLabel(node), kind: node.kind,
      value: formatValue(node), children: [], sourceNode: node,
    };
  }

  const childLayouts: LayoutNode[] = [];
  let totalChildSpan = 0;
  for (let i = 0; i < displayChildren.length; i++) {
    if (i > 0) totalChildSpan += SIBLING_GAP;
    const { child, suffix } = displayChildren[i];
    const childLayout = layoutNodeLR(child, 0, 0, id + suffix, expanded);
    childLayouts.push(childLayout);
    totalChildSpan += childLayout.span;
  }

  const mySpan = Math.max(NODE_H, totalChildSpan);
  const childX = x + NODE_W + LEVEL_GAP;

  let childY = y + (mySpan - totalChildSpan) / 2;
  for (const child of childLayouts) {
    offsetLR(child, childX, childY);
    childY += child.span + SIBLING_GAP;
  }

  const maxChildDepth = Math.max(...childLayouts.map(c => c.depth));

  return {
    id,
    x,
    y: y + mySpan / 2 - NODE_H / 2,
    span: mySpan,
    depth: NODE_W + LEVEL_GAP + maxChildDepth,
    label: nodeLabel(node), kind: node.kind,
    value: formatValue(node), children: childLayouts, sourceNode: node,
  };
}

function offsetLR(node: LayoutNode, dx: number, dy: number): void {
  const totalChildSpan = node.children.reduce(
    (sum, c, i) => sum + c.span + (i > 0 ? SIBLING_GAP : 0), 0,
  );
  node.x = dx;
  node.y = dy + (node.span / 2 - NODE_H / 2);
  let childY = dy + (node.span - totalChildSpan) / 2;
  for (const child of node.children) {
    offsetLR(child, dx + NODE_W + LEVEL_GAP, childY);
    childY += child.span + SIBLING_GAP;
  }
}

// ─── Public API ─────────────────────────────────────────────────────────

export function layoutTree(
  root: TreeNode,
  expanded: ReadonlySet<string> = new Set(),
  orientation: Orientation = 'tb',
): LayoutNode {
  const rootId = 'r';
  if (orientation === 'lr') {
    return layoutNodeLR(root, 0, 0, rootId, expanded);
  }
  return layoutNodeTB(root, 0, 0, rootId, expanded);
}

export function layoutBounds(root: LayoutNode, orientation: Orientation = 'tb'): { width: number; height: number } {
  if (orientation === 'lr') {
    return { width: root.depth, height: root.span };
  }
  return { width: root.span, height: root.depth };
}

export { NODE_W, NODE_H };
