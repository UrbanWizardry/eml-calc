import { Complex } from './complex';
import { eml } from './eml';

// --- Tree node types ---

export type TreeNode =
  | { kind: 'eml'; left: TreeNode; right: TreeNode; value: Complex }
  | { kind: 'const'; label: string; value: Complex }
  | { kind: 'input'; label: string; value: Complex }
  | { kind: 'named'; name: string; args: TreeNode[]; expansion: TreeNode; value: Complex };

/** A traced result pairs a computed value with its tree. */
export type Traced = readonly [Complex, TreeNode];

// --- Helpers ---

function c(label: string, value: Complex): Traced {
  return [value, { kind: 'const', label, value }];
}

function inp(label: string, value: Complex): Traced {
  return [value, { kind: 'input', label, value }];
}

const ONE_T: Traced = c('1', Complex.ONE);

function emlT(x: Traced, y: Traced): Traced {
  const result = eml(x[0], y[0]);
  return [result, { kind: 'eml', left: x[1], right: y[1], value: result }];
}

function named(name: string, args: TreeNode[], expansion: Traced): Traced {
  return [expansion[0], { kind: 'named', name, args, expansion: expansion[1], value: expansion[0] }];
}

// --- Level 1: e and exp ---

export function emlET(): Traced {
  const inner = emlT(ONE_T, ONE_T);
  return named('e', [], inner);
}

export function emlExpT(x: Traced): Traced {
  const inner = emlT(x, ONE_T);
  return named('exp', [x[1]], inner);
}

// --- Level 2: ln ---

export function emlLnT(x: Traced): Traced {
  // ln(x) = eml(1, eml(eml(1, x), 1))
  const inner = emlT(ONE_T, emlT(emlT(ONE_T, x), ONE_T));
  return named('ln', [x[1]], inner);
}

// --- Level 3: zero and subtraction ---

export function emlZeroT(): Traced {
  // 0 = eml(1, eml(e, 1))
  const e = emlET();
  const inner = emlT(ONE_T, emlT(c('e', e[0]), ONE_T));
  return named('0', [], inner);
}

export function emlSubT(x: Traced, y: Traced): Traced {
  // x - y = eml(ln(x), exp(y))
  const inner = emlT(emlLnT(x), emlExpT(y));
  return named('sub', [x[1], y[1]], inner);
}

// --- Level 4: negation and addition ---

export function emlNegT(x: Traced): Traced {
  const inner = emlSubT(emlZeroT(), x);
  return named('neg', [x[1]], inner);
}

export function emlAddT(x: Traced, y: Traced): Traced {
  // x + y = x - (-y)
  const inner = emlSubT(x, emlNegT(y));
  return named('add', [x[1], y[1]], inner);
}

// --- Level 5: multiplication and division ---

export function emlMulT(x: Traced, y: Traced): Traced {
  // Guard for zero (matches eml.ts)
  if (x[0].magnitude < 1e-300 || y[0].magnitude < 1e-300) {
    return named('mul', [x[1], y[1]], c('0', Complex.ZERO));
  }
  const inner = emlExpT(emlAddT(emlLnT(x), emlLnT(y)));
  return named('mul', [x[1], y[1]], inner);
}

export function emlDivT(x: Traced, y: Traced): Traced {
  if (x[0].magnitude < 1e-300) {
    return named('div', [x[1], y[1]], c('0', Complex.ZERO));
  }
  const inner = emlExpT(emlSubT(emlLnT(x), emlLnT(y)));
  return named('div', [x[1], y[1]], inner);
}

// --- Level 6: constants ---

export function emlTwoT(): Traced {
  const inner = emlAddT(ONE_T, ONE_T);
  return named('2', [], inner);
}

export function emlHalfT(): Traced {
  const inner = emlDivT(ONE_T, emlTwoT());
  return named('1/2', [], inner);
}

export function emlNegOneT(): Traced {
  const inner = emlNegT(ONE_T);
  return named('-1', [], inner);
}

export function emlIT(): Traced {
  // i = exp(ln(-1) * 1/2), with sign correction
  const rawInner = emlExpT(emlMulT(emlLnT(emlNegOneT()), emlHalfT()));
  const rawValue = rawInner[0];
  if (rawValue.im < 0) {
    const corrected = emlNegT(rawInner);
    return named('i', [], corrected);
  }
  return named('i', [], rawInner);
}

export function emlPiT(): Traced {
  // pi = ln(-1) / i, with sign correction
  const rawInner = emlDivT(emlLnT(emlNegOneT()), emlIT());
  const rawValue = rawInner[0];
  if (rawValue.re < 0) {
    const corrected = emlNegT(rawInner);
    return named('pi', [], corrected);
  }
  return named('pi', [], rawInner);
}

// --- Level 7: powers and roots ---

export function emlPowT(base: Traced, exponent: Traced): Traced {
  if (base[0].magnitude < 1e-300) {
    return named('pow', [base[1], exponent[1]], c('0', Complex.ZERO));
  }
  const inner = emlExpT(emlMulT(exponent, emlLnT(base)));
  return named('pow', [base[1], exponent[1]], inner);
}

export function emlSqrtT(x: Traced): Traced {
  const inner = emlPowT(x, emlHalfT());
  return named('sqrt', [x[1]], inner);
}

// --- Level 8: trigonometric ---

export function emlSinT(x: Traced): Traced {
  const i = emlIT();
  const ix = emlMulT(i, x);
  const negIx = emlNegT(ix);
  const inner = emlDivT(
    emlSubT(emlExpT(ix), emlExpT(negIx)),
    emlMulT(emlTwoT(), i),
  );
  return named('sin', [x[1]], inner);
}

export function emlCosT(x: Traced): Traced {
  const i = emlIT();
  const ix = emlMulT(i, x);
  const negIx = emlNegT(ix);
  const inner = emlDivT(
    emlAddT(emlExpT(ix), emlExpT(negIx)),
    emlTwoT(),
  );
  return named('cos', [x[1]], inner);
}

export function emlTanT(x: Traced): Traced {
  const inner = emlDivT(emlSinT(x), emlCosT(x));
  return named('tan', [x[1]], inner);
}

// --- Level 9: reciprocal ---

export function emlRecipT(x: Traced): Traced {
  const inner = emlDivT(ONE_T, x);
  return named('1/x', [x[1]], inner);
}

// --- Level 10: hyperbolic ---

export function emlSinhT(x: Traced): Traced {
  const inner = emlDivT(emlSubT(emlExpT(x), emlExpT(emlNegT(x))), emlTwoT());
  return named('sinh', [x[1]], inner);
}

export function emlCoshT(x: Traced): Traced {
  const inner = emlDivT(emlAddT(emlExpT(x), emlExpT(emlNegT(x))), emlTwoT());
  return named('cosh', [x[1]], inner);
}

export function emlTanhT(x: Traced): Traced {
  const inner = emlDivT(emlSinhT(x), emlCoshT(x));
  return named('tanh', [x[1]], inner);
}

// --- Level 11: inverse trigonometric ---

export function emlArcsinT(x: Traced): Traced {
  const i = emlIT();
  const ix = emlMulT(i, x);
  const body = emlAddT(ix, emlSqrtT(emlSubT(ONE_T, emlMulT(x, x))));
  const inner = emlMulT(emlNegT(i), emlLnT(body));
  return named('arcsin', [x[1]], inner);
}

export function emlArccosT(x: Traced): Traced {
  const inner = emlSubT(emlDivT(emlPiT(), emlTwoT()), emlArcsinT(x));
  return named('arccos', [x[1]], inner);
}

export function emlArctanT(x: Traced): Traced {
  const i = emlIT();
  const ix = emlMulT(i, x);
  const num = emlAddT(ONE_T, ix);
  const den = emlSubT(ONE_T, ix);
  const inner = emlMulT(emlDivT(ONE_T, emlMulT(emlTwoT(), i)), emlLnT(emlDivT(num, den)));
  return named('arctan', [x[1]], inner);
}

// --- Level 12: logarithms ---

export function emlLog10T(x: Traced): Traced {
  const inner = emlDivT(emlLnT(x), emlLnT(c('10', Complex.from(10))));
  return named('log10', [x[1]], inner);
}

export function emlLog2T(x: Traced): Traced {
  const inner = emlDivT(emlLnT(x), emlLnT(emlTwoT()));
  return named('log2', [x[1]], inner);
}

// --- Level 13: angle conversions ---

export function emlDegToRadT(x: Traced): Traced {
  const inner = emlMulT(x, emlDivT(emlPiT(), c('180', Complex.from(180))));
  return named('rad', [x[1]], inner);
}

export function emlRadToDegT(x: Traced): Traced {
  const inner = emlMulT(x, emlDivT(c('180', Complex.from(180)), emlPiT()));
  return named('deg', [x[1]], inner);
}

// --- Public API for calculator integration ---

export type BinaryOp = '+' | '-' | '*' | '/' | 'pow';
export type UnaryOp =
  | 'sin' | 'cos' | 'tan' | 'sqrt'
  | 'arcsin' | 'arccos' | 'arctan'
  | 'sinh' | 'cosh' | 'tanh'
  | 'log10' | 'log2' | 'ln' | 'exp'
  | 'recip' | 'rad' | 'deg';
export type ConstOp = 'e' | 'pi';

export function traceBinaryOp(op: BinaryOp, a: number, b: number): TreeNode {
  const ta: Traced = inp('x', Complex.from(a));
  const tb: Traced = inp('y', Complex.from(b));
  let result: Traced;
  switch (op) {
    case '+': result = emlAddT(ta, tb); break;
    case '-': result = emlSubT(ta, tb); break;
    case '*': result = emlMulT(ta, tb); break;
    case '/': result = emlDivT(ta, tb); break;
    case 'pow': result = emlPowT(ta, tb); break;
  }
  return result[1];
}

export function traceUnaryOp(op: UnaryOp, x: number): TreeNode {
  const tx: Traced = inp('x', Complex.from(x));
  let result: Traced;
  switch (op) {
    case 'sin': result = emlSinT(tx); break;
    case 'cos': result = emlCosT(tx); break;
    case 'tan': result = emlTanT(tx); break;
    case 'sqrt': result = emlSqrtT(tx); break;
    case 'arcsin': result = emlArcsinT(tx); break;
    case 'arccos': result = emlArccosT(tx); break;
    case 'arctan': result = emlArctanT(tx); break;
    case 'sinh': result = emlSinhT(tx); break;
    case 'cosh': result = emlCoshT(tx); break;
    case 'tanh': result = emlTanhT(tx); break;
    case 'log10': result = emlLog10T(tx); break;
    case 'log2': result = emlLog2T(tx); break;
    case 'ln': result = emlLnT(tx); break;
    case 'exp': result = emlExpT(tx); break;
    case 'recip': result = emlRecipT(tx); break;
    case 'rad': result = emlDegToRadT(tx); break;
    case 'deg': result = emlRadToDegT(tx); break;
  }
  return result[1];
}

export function traceConstant(op: ConstOp): TreeNode {
  let result: Traced;
  switch (op) {
    case 'e': result = emlET(); break;
    case 'pi': result = emlPiT(); break;
  }
  return result[1];
}
