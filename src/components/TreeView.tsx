import { useState, useCallback, useRef, useMemo } from 'react';
import type { TreeNode as EmlTreeNode } from '../core/eml-traced';
import type { Orientation } from '../core/tree-layout';
import { layoutTree, layoutBounds, NODE_H } from '../core/tree-layout';
import { TreeNodeView } from './TreeNodeView';

interface TreeViewProps {
  tree: EmlTreeNode | null;
}

const PADDING = 40;

export function TreeView({ tree }: TreeViewProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastMouse = useRef({ x: 0, y: 0 });
  const [orientation, setOrientation] = useState<Orientation>('lr');

  const handleToggle = useCallback((id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const layout = useMemo(() => {
    if (!tree) return null;
    return layoutTree(tree, expanded, orientation);
  }, [tree, expanded, orientation]);

  const bounds = useMemo(() => {
    if (!layout) return { width: 0, height: 0 };
    return layoutBounds(layout, orientation);
  }, [layout, orientation]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    lastMouse.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.current.x;
    const dy = e.clientY - lastMouse.current.y;
    lastMouse.current = { x: e.clientX, y: e.clientY };
    setPan(prev => ({ x: prev.x + dx, y: prev.y + dy }));
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev * factor)));
  }, []);

  const handleReset = useCallback(() => {
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  const toggleOrientation = useCallback(() => {
    setOrientation(prev => prev === 'lr' ? 'tb' : 'lr');
    setPan({ x: 0, y: 0 });
    setZoom(1);
  }, []);

  if (!tree || !layout) {
    return (
      <div className="tree-panel">
        <div className="tree-empty">
          Perform a calculation to see its EML tree decomposition
        </div>
      </div>
    );
  }

  const nodeCount = countNodes(tree);
  // Content size at current zoom -- used for scroll extent
  const contentW = (bounds.width + PADDING * 2) * zoom + PADDING;
  const contentH = (bounds.height + PADDING * 2 + NODE_H) * zoom + PADDING;

  return (
    <div className="tree-panel">
      <div className="tree-header">
        <span className="tree-info">
          {nodeCount} eml node{nodeCount !== 1 ? 's' : ''}
          {' '}&middot;{' '}Click to expand
        </span>
        <div className="tree-header-actions">
          <button
            className={`tree-orient-btn ${orientation === 'lr' ? 'active' : ''}`}
            onClick={toggleOrientation}
            title="Toggle tree orientation"
          >
            {orientation === 'lr' ? '\u2192' : '\u2193'}
          </button>
          <button className="tree-reset-btn" onClick={handleReset}>
            Reset
          </button>
        </div>
      </div>
      <div className="tree-container">
        <svg
          ref={svgRef}
          style={{
            width: `${Math.max(contentW, 100)}px`,
            height: `${Math.max(contentH, 100)}px`,
            minWidth: '100%',
            minHeight: '100%',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <g transform={`translate(${pan.x + PADDING * zoom}, ${pan.y + PADDING * zoom}) scale(${zoom})`}>
            <TreeNodeView
              node={layout}
              onToggle={handleToggle}
              expanded={expanded}
              orientation={orientation}
            />
          </g>
        </svg>
      </div>
    </div>
  );
}

function countNodes(node: EmlTreeNode): number {
  switch (node.kind) {
    case 'const':
    case 'input':
      return 0;
    case 'eml':
      return 1 + countNodes(node.left) + countNodes(node.right);
    case 'named':
      return countNodes(node.expansion);
  }
}
