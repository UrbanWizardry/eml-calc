import type { LayoutNode, Orientation } from '../core/tree-layout';
import { NODE_W, NODE_H } from '../core/tree-layout';

interface TreeNodeViewProps {
  node: LayoutNode;
  onToggle: (id: string) => void;
  expanded: ReadonlySet<string>;
  orientation: Orientation;
}

const COLORS: Record<string, { fill: string; stroke: string }> = {
  eml: { fill: '#1a3a4a', stroke: '#64ffda' },
  named: { fill: '#2a1a4a', stroke: '#c084fc' },
  const: { fill: '#1a1a3e', stroke: '#4a5568' },
  input: { fill: '#1a2e1a', stroke: '#68d391' },
};

function getColors(kind: string) {
  return COLORS[kind] ?? COLORS.const;
}

function edgePath(parent: LayoutNode, child: LayoutNode, orientation: Orientation): string {
  const pcx = parent.x + NODE_W / 2;
  const pcy = parent.y + NODE_H / 2;
  const ccx = child.x + NODE_W / 2;
  const ccy = child.y + NODE_H / 2;

  if (orientation === 'lr') {
    // Edge exits right side of parent, enters left side of child
    const x0 = parent.x + NODE_W;
    const y0 = pcy;
    const x1 = child.x;
    const y1 = ccy;
    const mx = (x0 + x1) / 2;
    return `M ${x0} ${y0} C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
  }
  // TB: edge exits bottom of parent, enters top of child
  const x0 = pcx;
  const y0 = parent.y + NODE_H;
  const x1 = ccx;
  const y1 = child.y;
  const my = (y0 + y1) / 2;
  return `M ${x0} ${y0} C ${x0} ${my}, ${x1} ${my}, ${x1} ${y1}`;
}

export function TreeNodeView({ node, onToggle, expanded, orientation }: TreeNodeViewProps) {
  const { fill, stroke } = getColors(node.kind);
  const isExpandable = node.sourceNode.kind === 'named' || node.sourceNode.kind === 'eml';
  const isExpanded = expanded.has(node.id);
  const cx = node.x + NODE_W / 2;
  const cy = node.y + NODE_H / 2;

  // Value annotation position
  const valX = orientation === 'lr' ? cx : cx;
  const valY = orientation === 'lr' ? node.y + NODE_H + 12 : node.y + NODE_H + 12;

  return (
    <g>
      {/* Edges to children */}
      {node.children.map(child => (
        <path
          key={`edge-${child.id}`}
          d={edgePath(node, child, orientation)}
          fill="none"
          stroke="#4a5568"
          strokeWidth={1.5}
        />
      ))}

      {/* Node rectangle */}
      <rect
        x={node.x}
        y={node.y}
        width={NODE_W}
        height={NODE_H}
        rx={6}
        fill={fill}
        stroke={stroke}
        strokeWidth={isExpanded ? 2 : 1.5}
        style={{ cursor: isExpandable ? 'pointer' : 'default' }}
        onClick={() => isExpandable && onToggle(node.id)}
      />

      {/* Label */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={stroke}
        fontSize={node.label.length > 4 ? 9 : 11}
        fontWeight={600}
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {node.label}
      </text>

      {/* Value annotation */}
      <text
        x={valX}
        y={valY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#6b7280"
        fontSize={8}
        fontFamily="'Courier New', monospace"
        style={{ pointerEvents: 'none' }}
      >
        {node.value}
      </text>

      {/* Expand indicator for collapsed named nodes */}
      {node.sourceNode.kind === 'named' && !isExpanded && (
        <text
          x={orientation === 'lr' ? node.x + NODE_W - 4 : node.x + NODE_W - 6}
          y={orientation === 'lr' ? cy : node.y + 8}
          textAnchor="middle"
          dominantBaseline="central"
          fill={stroke}
          fontSize={orientation === 'lr' ? 10 : 8}
          style={{ pointerEvents: 'none', opacity: 0.7 }}
        >
          {orientation === 'lr' ? '\u25B8' : '+'}
        </text>
      )}

      {/* Recurse into children */}
      {node.children.map(child => (
        <TreeNodeView
          key={child.id}
          node={child}
          onToggle={onToggle}
          expanded={expanded}
          orientation={orientation}
        />
      ))}
    </g>
  );
}
