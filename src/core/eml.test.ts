import { describe, it, expect } from 'vitest';
import { Complex } from './complex';
import {
  eml, emlE, emlExp, emlLn, emlZero, emlSub,
  emlNeg, emlAdd, emlMul, emlDiv,
  emlTwo, emlHalf, emlNegOne, emlI, emlPi,
  emlPow, emlSqrt, emlSin, emlCos, emlTan,
} from './eml';

const TOL = 1e-10;

function expectRealClose(actual: Complex, expected: number, tol = TOL) {
  expect(actual.re).toBeCloseTo(expected, -Math.log10(tol));
  expect(Math.abs(actual.im)).toBeLessThan(tol);
}

describe('eml primitive', () => {
  it('eml(x, y) = exp(x) - ln(y)', () => {
    const result = eml(Complex.from(2), Complex.from(1));
    // exp(2) - ln(1) = exp(2) - 0 = exp(2)
    expectRealClose(result, Math.exp(2));
  });

  it('eml(0, e) = exp(0) - ln(e) = 1 - 1 = 0', () => {
    const result = eml(Complex.ZERO, Complex.from(Math.E));
    expectRealClose(result, 0);
  });
});

describe('Level 1: e and exp', () => {
  it('emlE() = e', () => {
    expectRealClose(emlE(), Math.E);
  });

  it('emlExp(0) = 1', () => {
    expectRealClose(emlExp(Complex.ZERO), 1);
  });

  it('emlExp(1) = e', () => {
    expectRealClose(emlExp(Complex.ONE), Math.E);
  });

  it('emlExp(2) = e^2', () => {
    expectRealClose(emlExp(Complex.from(2)), Math.exp(2));
  });

  it('emlExp(-1) = 1/e', () => {
    expectRealClose(emlExp(Complex.from(-1)), Math.exp(-1));
  });
});

describe('Level 2: ln', () => {
  it('emlLn(1) = 0', () => {
    expectRealClose(emlLn(Complex.ONE), 0);
  });

  it('emlLn(e) = 1', () => {
    expectRealClose(emlLn(Complex.from(Math.E)), 1);
  });

  it('emlLn(e^2) = 2', () => {
    expectRealClose(emlLn(Complex.from(Math.exp(2))), 2);
  });

  it('emlLn(0.5) = ln(0.5)', () => {
    expectRealClose(emlLn(Complex.from(0.5)), Math.log(0.5));
  });

  it('emlLn(100) = ln(100)', () => {
    expectRealClose(emlLn(Complex.from(100)), Math.log(100));
  });
});

describe('Level 3: zero and subtraction', () => {
  it('emlZero() = 0', () => {
    expectRealClose(emlZero(), 0);
  });

  it('emlSub(5, 3) = 2', () => {
    expectRealClose(emlSub(Complex.from(5), Complex.from(3)), 2);
  });

  it('emlSub(1, 1) = 0', () => {
    expectRealClose(emlSub(Complex.ONE, Complex.ONE), 0);
  });

  it('emlSub(3, 7) = -4', () => {
    expectRealClose(emlSub(Complex.from(3), Complex.from(7)), -4);
  });

  it('emlSub(e, 1) = e - 1', () => {
    expectRealClose(emlSub(Complex.from(Math.E), Complex.ONE), Math.E - 1);
  });
});

describe('Level 4: negation and addition', () => {
  it('emlNeg(5) = -5', () => {
    expectRealClose(emlNeg(Complex.from(5)), -5);
  });

  it('emlNeg(-3) = 3', () => {
    expectRealClose(emlNeg(Complex.from(-3)), 3);
  });

  it('emlAdd(3, 4) = 7', () => {
    expectRealClose(emlAdd(Complex.from(3), Complex.from(4)), 7);
  });

  it('emlAdd(1, -1) = 0', () => {
    expectRealClose(emlAdd(Complex.ONE, Complex.from(-1)), 0);
  });

  it('emlAdd(e, pi) = e + pi', () => {
    expectRealClose(emlAdd(Complex.from(Math.E), Complex.from(Math.PI)), Math.E + Math.PI);
  });
});

describe('Level 5: multiplication and division', () => {
  it('emlMul(3, 4) = 12', () => {
    expectRealClose(emlMul(Complex.from(3), Complex.from(4)), 12);
  });

  it('emlMul(2, -5) = -10', () => {
    expectRealClose(emlMul(Complex.from(2), Complex.from(-5)), -10);
  });

  it('emlDiv(10, 2) = 5', () => {
    expectRealClose(emlDiv(Complex.from(10), Complex.from(2)), 5);
  });

  it('emlDiv(1, 3) = 0.333...', () => {
    expectRealClose(emlDiv(Complex.ONE, Complex.from(3)), 1 / 3);
  });

  it('emlDiv(7, -2) = -3.5', () => {
    expectRealClose(emlDiv(Complex.from(7), Complex.from(-2)), -3.5);
  });
});

describe('Level 6: constants', () => {
  it('emlTwo() = 2', () => {
    expectRealClose(emlTwo(), 2);
  });

  it('emlHalf() = 0.5', () => {
    expectRealClose(emlHalf(), 0.5);
  });

  it('emlNegOne() = -1', () => {
    expectRealClose(emlNegOne(), -1);
  });

  it('emlI() is pure imaginary with im = 1', () => {
    const i = emlI();
    expect(Math.abs(i.re)).toBeLessThan(TOL);
    expect(i.im).toBeCloseTo(1, 8);
  });

  it('emlI() squared = -1', () => {
    const i = emlI();
    const iSquared = emlMul(i, i);
    expectRealClose(iSquared, -1);
  });

  it('emlPi() = pi', () => {
    expectRealClose(emlPi(), Math.PI);
  });
});

describe('Level 7: powers and roots', () => {
  it('emlPow(2, 10) = 1024', () => {
    expectRealClose(emlPow(Complex.from(2), Complex.from(10)), 1024);
  });

  it('emlPow(3, 2) = 9', () => {
    expectRealClose(emlPow(Complex.from(3), Complex.from(2)), 9);
  });

  it('emlPow(e, 1) = e', () => {
    expectRealClose(emlPow(Complex.from(Math.E), Complex.ONE), Math.E);
  });

  it('emlSqrt(4) = 2', () => {
    expectRealClose(emlSqrt(Complex.from(4)), 2);
  });

  it('emlSqrt(9) = 3', () => {
    expectRealClose(emlSqrt(Complex.from(9)), 3);
  });

  it('emlSqrt(2) = sqrt(2)', () => {
    expectRealClose(emlSqrt(Complex.from(2)), Math.sqrt(2));
  });
});

describe('Level 8: trigonometric functions', () => {
  it('emlSin(0) = 0', () => {
    expectRealClose(emlSin(Complex.ZERO), 0);
  });

  it('emlSin(pi/6) = 0.5', () => {
    expectRealClose(emlSin(Complex.from(Math.PI / 6)), 0.5, 1e-8);
  });

  it('emlSin(pi/2) = 1', () => {
    expectRealClose(emlSin(Complex.from(Math.PI / 2)), 1, 1e-8);
  });

  it('emlSin(pi) ~ 0', () => {
    expectRealClose(emlSin(Complex.from(Math.PI)), 0, 1e-8);
  });

  it('emlCos(0) = 1', () => {
    expectRealClose(emlCos(Complex.ZERO), 1);
  });

  it('emlCos(pi/3) = 0.5', () => {
    expectRealClose(emlCos(Complex.from(Math.PI / 3)), 0.5, 1e-8);
  });

  it('emlCos(pi) = -1', () => {
    expectRealClose(emlCos(Complex.from(Math.PI)), -1, 1e-8);
  });

  it('emlTan(pi/4) = 1', () => {
    expectRealClose(emlTan(Complex.from(Math.PI / 4)), 1, 1e-8);
  });

  it('emlTan(0) = 0', () => {
    expectRealClose(emlTan(Complex.ZERO), 0);
  });

  it('sin^2(x) + cos^2(x) = 1', () => {
    const x = Complex.from(1.23);
    const sinx = emlSin(x);
    const cosx = emlCos(x);
    const sum = emlAdd(emlMul(sinx, sinx), emlMul(cosx, cosx));
    expectRealClose(sum, 1, 1e-6);
  });
});
