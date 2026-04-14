import { describe, it, expect } from 'vitest';
import { Complex } from './complex';

const EPSILON = 1e-12;

function expectClose(actual: Complex, expectedRe: number, expectedIm: number, tol = EPSILON) {
  expect(actual.re).toBeCloseTo(expectedRe, -Math.log10(tol));
  expect(actual.im).toBeCloseTo(expectedIm, -Math.log10(tol));
}

describe('Complex', () => {
  describe('construction and constants', () => {
    it('creates from re and im', () => {
      const z = new Complex(3, 4);
      expect(z.re).toBe(3);
      expect(z.im).toBe(4);
    });

    it('has correct static constants', () => {
      expect(Complex.ZERO.re).toBe(0);
      expect(Complex.ZERO.im).toBe(0);
      expect(Complex.ONE.re).toBe(1);
      expect(Complex.ONE.im).toBe(0);
      expect(Complex.I.re).toBe(0);
      expect(Complex.I.im).toBe(1);
    });

    it('creates from real number', () => {
      const z = Complex.from(5);
      expect(z.re).toBe(5);
      expect(z.im).toBe(0);
    });
  });

  describe('arithmetic', () => {
    it('adds two complex numbers', () => {
      const z = new Complex(1, 2).add(new Complex(3, 4));
      expect(z.re).toBe(4);
      expect(z.im).toBe(6);
    });

    it('subtracts two complex numbers', () => {
      const z = new Complex(5, 3).sub(new Complex(2, 1));
      expect(z.re).toBe(3);
      expect(z.im).toBe(2);
    });

    it('multiplies two complex numbers', () => {
      // (1+2i)(3+4i) = 3+4i+6i+8i^2 = (3-8)+(4+6)i = -5+10i
      const z = new Complex(1, 2).mul(new Complex(3, 4));
      expect(z.re).toBe(-5);
      expect(z.im).toBe(10);
    });

    it('divides two complex numbers', () => {
      // (1+2i)/(3+4i) = (1+2i)(3-4i)/(9+16) = (3+8-4i+6i)/25 = (11+2i)/25
      const z = new Complex(1, 2).div(new Complex(3, 4));
      expectClose(z, 11 / 25, 2 / 25);
    });

    it('negates a complex number', () => {
      const z = new Complex(3, -4).neg();
      expect(z.re).toBe(-3);
      expect(z.im).toBe(4);
    });

    it('i * i = -1', () => {
      const z = Complex.I.mul(Complex.I);
      expectClose(z, -1, 0);
    });
  });

  describe('magnitude and argument', () => {
    it('computes magnitude of 3+4i', () => {
      expect(new Complex(3, 4).magnitude).toBe(5);
    });

    it('computes arg of positive real', () => {
      expect(new Complex(1, 0).arg).toBe(0);
    });

    it('computes arg of negative real', () => {
      expect(new Complex(-1, 0).arg).toBeCloseTo(Math.PI);
    });

    it('computes arg of pure imaginary', () => {
      expect(new Complex(0, 1).arg).toBeCloseTo(Math.PI / 2);
    });
  });

  describe('isReal', () => {
    it('detects real numbers', () => {
      expect(new Complex(5, 0).isReal()).toBe(true);
      expect(new Complex(5, 1e-15).isReal()).toBe(true);
    });

    it('detects non-real numbers', () => {
      expect(new Complex(5, 1).isReal()).toBe(false);
    });
  });

  describe('Complex.exp', () => {
    it('exp(0) = 1', () => {
      expectClose(Complex.exp(Complex.ZERO), 1, 0);
    });

    it('exp(1) = e', () => {
      expectClose(Complex.exp(Complex.ONE), Math.E, 0);
    });

    it('exp(i*pi) = -1 (Euler)', () => {
      const z = Complex.exp(new Complex(0, Math.PI));
      expectClose(z, -1, 0, 1e-10);
    });

    it('exp(-Infinity) = 0 (IEEE754 extended reals)', () => {
      const z = Complex.exp(new Complex(-Infinity, 0));
      expect(z.re).toBe(0);
      expect(z.im).toBe(0);
    });

    it('exp(Infinity) = Infinity', () => {
      const z = Complex.exp(new Complex(Infinity, 0));
      expect(z.re).toBe(Infinity);
    });

    it('exp(a+bi) has correct magnitude and angle', () => {
      const z = Complex.exp(new Complex(1, Math.PI / 2));
      expectClose(z, 0, Math.E, 1e-10);
    });
  });

  describe('Complex.ln', () => {
    it('ln(1) = 0', () => {
      expectClose(Complex.ln(Complex.ONE), 0, 0);
    });

    it('ln(e) = 1', () => {
      expectClose(Complex.ln(Complex.from(Math.E)), 1, 0);
    });

    it('ln(-1) = i*pi (principal branch)', () => {
      const z = Complex.ln(new Complex(-1, 0));
      expectClose(z, 0, Math.PI);
    });

    it('ln(0) = -Infinity (IEEE754 extended reals)', () => {
      const z = Complex.ln(Complex.ZERO);
      expect(z.re).toBe(-Infinity);
      expect(z.im).toBe(0);
    });

    it('ln(i) = i*pi/2', () => {
      const z = Complex.ln(Complex.I);
      expectClose(z, 0, Math.PI / 2);
    });

    it('exp(ln(z)) round-trips for positive real', () => {
      const original = Complex.from(7.5);
      const result = Complex.exp(Complex.ln(original));
      expectClose(result, 7.5, 0);
    });

    it('exp(ln(z)) round-trips for complex', () => {
      const original = new Complex(2, 3);
      const result = Complex.exp(Complex.ln(original));
      expectClose(result, 2, 3, 1e-10);
    });
  });

  describe('edge cases with infinities', () => {
    it('exp(-Inf+0i) produces zero, not NaN', () => {
      const z = Complex.exp(new Complex(-Infinity, 0));
      expect(z.re).toBe(0);
      expect(z.im).toBe(0);
      expect(isNaN(z.re)).toBe(false);
    });

    it('division by zero produces Infinity', () => {
      const z = Complex.ONE.div(Complex.ZERO);
      expect(isFinite(z.re)).toBe(false);
    });
  });

  describe('toString', () => {
    it('formats real number', () => {
      expect(Complex.from(3).toString()).toBe('3');
    });

    it('formats pure imaginary', () => {
      expect(Complex.I.toString()).toBe('1i');
    });

    it('formats complex number', () => {
      expect(new Complex(1, 2).toString()).toBe('1+2i');
      expect(new Complex(1, -2).toString()).toBe('1-2i');
    });
  });
});
