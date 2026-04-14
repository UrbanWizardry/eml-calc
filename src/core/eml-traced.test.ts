import { describe, it, expect } from 'vitest';
import { Complex } from './complex';
import type { TreeNode } from './eml-traced';
import {
  emlET, emlExpT, emlLnT, emlSubT, emlAddT, emlMulT, emlDivT,
  emlNegT, emlSqrtT, emlSinT, emlCosT, emlTanT, emlIT, emlPiT,
  traceBinaryOp, traceUnaryOp,
} from './eml-traced';

const TOL = 1e-10;

function inp(x: number): [Complex, TreeNode] {
  return [Complex.from(x), { kind: 'input', label: 'x', value: Complex.from(x) }];
}

function expectValue(traced: readonly [Complex, TreeNode], expected: number, tol = TOL) {
  expect(traced[0].re).toBeCloseTo(expected, -Math.log10(tol));
}

function countEmlNodes(node: TreeNode): number {
  switch (node.kind) {
    case 'eml':
      return 1 + countEmlNodes(node.left) + countEmlNodes(node.right);
    case 'named':
      return countEmlNodes(node.expansion);
    case 'const':
    case 'input':
      return 0;
  }
}

describe('traced evaluation produces correct values', () => {
  it('emlET() = e', () => {
    expectValue(emlET(), Math.E);
  });

  it('emlExpT(2) = e^2', () => {
    expectValue(emlExpT(inp(2)), Math.exp(2));
  });

  it('emlLnT(e) = 1', () => {
    expectValue(emlLnT(inp(Math.E)), 1);
  });

  it('emlSubT(5, 3) = 2', () => {
    expectValue(emlSubT(inp(5), inp(3)), 2);
  });

  it('emlAddT(3, 4) = 7', () => {
    expectValue(emlAddT(inp(3), inp(4)), 7);
  });

  it('emlMulT(3, 4) = 12', () => {
    expectValue(emlMulT(inp(3), inp(4)), 12);
  });

  it('emlDivT(10, 2) = 5', () => {
    expectValue(emlDivT(inp(10), inp(2)), 5);
  });

  it('emlNegT(7) = -7', () => {
    expectValue(emlNegT(inp(7)), -7);
  });

  it('emlSqrtT(9) = 3', () => {
    expectValue(emlSqrtT(inp(9)), 3);
  });

  it('emlSinT(pi/6) = 0.5', () => {
    expectValue(emlSinT(inp(Math.PI / 6)), 0.5, 1e-8);
  });

  it('emlCosT(pi/3) = 0.5', () => {
    expectValue(emlCosT(inp(Math.PI / 3)), 0.5, 1e-8);
  });

  it('emlTanT(pi/4) = 1', () => {
    expectValue(emlTanT(inp(Math.PI / 4)), 1, 1e-8);
  });

  it('emlIT().im = 1', () => {
    const [val] = emlIT();
    expect(Math.abs(val.re)).toBeLessThan(TOL);
    expect(val.im).toBeCloseTo(1, 8);
  });

  it('emlPiT() = pi', () => {
    expectValue(emlPiT(), Math.PI);
  });
});

describe('tree structure', () => {
  it('exp tree is a named node wrapping a single eml', () => {
    const [, tree] = emlExpT(inp(2));
    expect(tree.kind).toBe('named');
    if (tree.kind === 'named') {
      expect(tree.name).toBe('exp');
      expect(tree.args).toHaveLength(1);
      expect(tree.expansion.kind).toBe('eml');
    }
  });

  it('ln tree has 3 eml nodes', () => {
    const [, tree] = emlLnT(inp(5));
    expect(tree.kind).toBe('named');
    if (tree.kind === 'named') {
      expect(tree.name).toBe('ln');
      expect(countEmlNodes(tree.expansion)).toBe(3);
    }
  });

  it('add tree contains sub and neg named nodes', () => {
    const [, tree] = emlAddT(inp(3), inp(4));
    expect(tree.kind).toBe('named');
    if (tree.kind === 'named') {
      expect(tree.name).toBe('add');
      // expansion is sub(x, neg(y))
      expect(tree.expansion.kind).toBe('named');
      if (tree.expansion.kind === 'named') {
        expect(tree.expansion.name).toBe('sub');
      }
    }
  });

  it('sin tree contains eml nodes at leaf level', () => {
    const [, tree] = emlSinT(inp(0.5));
    expect(tree.kind).toBe('named');
    if (tree.kind === 'named') {
      expect(tree.name).toBe('sin');
      const emlCount = countEmlNodes(tree.expansion);
      expect(emlCount).toBeGreaterThan(0);
    }
  });
});

describe('traceBinaryOp / traceUnaryOp API', () => {
  it('traceBinaryOp + returns correct tree', () => {
    const tree = traceBinaryOp('+', 2, 3);
    expect(tree.kind).toBe('named');
    if (tree.kind === 'named') {
      expect(tree.name).toBe('add');
      expect(tree.value.re).toBeCloseTo(5);
    }
  });

  it('traceUnaryOp sqrt returns correct tree', () => {
    const tree = traceUnaryOp('sqrt', 16);
    expect(tree.kind).toBe('named');
    if (tree.kind === 'named') {
      expect(tree.name).toBe('sqrt');
      expect(tree.value.re).toBeCloseTo(4);
    }
  });
});
