import { describe, it, expect, beforeEach } from 'vitest';
import { CalculatorEngine } from './calculator-engine';

describe('CalculatorEngine', () => {
  let calc: CalculatorEngine;

  beforeEach(() => {
    calc = new CalculatorEngine();
  });

  describe('initial state', () => {
    it('starts with 0 displayed', () => {
      const snap = calc.getSnapshot();
      expect(snap.state).toBe('INITIAL');
      expect(snap.displayInput).toBe('0');
      expect(snap.displayEml).toBe('');
      expect(snap.displayStd).toBe('');
    });
  });

  describe('digit entry', () => {
    it('enters a single digit', () => {
      const snap = calc.inputDigit('5');
      expect(snap.displayInput).toBe('5');
      expect(snap.state).toBe('OPERAND_ENTRY');
    });

    it('enters multiple digits', () => {
      calc.inputDigit('1');
      calc.inputDigit('2');
      const snap = calc.inputDigit('3');
      expect(snap.displayInput).toBe('123');
    });

    it('does not allow leading zeros', () => {
      calc.inputDigit('0');
      const snap = calc.inputDigit('0');
      expect(snap.displayInput).toBe('0');
    });

    it('replaces leading zero with non-zero digit', () => {
      const snap = calc.inputDigit('5');
      expect(snap.displayInput).toBe('5');
    });
  });

  describe('decimal entry', () => {
    it('adds decimal point', () => {
      calc.inputDigit('3');
      const snap = calc.inputDecimal();
      expect(snap.displayInput).toBe('3.');
    });

    it('starts with 0. from initial state', () => {
      const snap = calc.inputDecimal();
      expect(snap.displayInput).toBe('0.');
    });

    it('does not allow multiple decimal points', () => {
      calc.inputDigit('3');
      calc.inputDecimal();
      calc.inputDigit('1');
      calc.inputDecimal();
      const snap = calc.inputDigit('4');
      expect(snap.displayInput).toBe('3.14');
    });
  });

  describe('basic arithmetic', () => {
    it('adds 2 + 3 = 5', () => {
      calc.inputDigit('2');
      calc.inputBinaryOp('+');
      calc.inputDigit('3');
      const snap = calc.inputEquals();
      expect(snap.displayEml).toBe('5');
      expect(snap.displayStd).toBe('5');
      expect(snap.state).toBe('RESULT_DISPLAY');
    });

    it('subtracts 7 - 3 = 4', () => {
      calc.inputDigit('7');
      calc.inputBinaryOp('-');
      calc.inputDigit('3');
      const snap = calc.inputEquals();
      expect(snap.displayEml).toBe('4');
      expect(snap.displayStd).toBe('4');
    });

    it('multiplies 6 * 4 = 24', () => {
      calc.inputDigit('6');
      calc.inputBinaryOp('*');
      calc.inputDigit('4');
      const snap = calc.inputEquals();
      expect(snap.displayEml).toBe('24');
      expect(snap.displayStd).toBe('24');
    });

    it('divides 10 / 4 = 2.5', () => {
      calc.inputDigit('1');
      calc.inputDigit('0');
      calc.inputBinaryOp('/');
      calc.inputDigit('4');
      const snap = calc.inputEquals();
      expect(snap.displayEml).toBe('2.5');
      expect(snap.displayStd).toBe('2.5');
    });

    it('computes 2^10 = 1024', () => {
      calc.inputDigit('2');
      calc.inputBinaryOp('pow');
      calc.inputDigit('1');
      calc.inputDigit('0');
      const snap = calc.inputEquals();
      expect(snap.displayEml).toBe('1024');
      expect(snap.displayStd).toBe('1024');
    });
  });

  describe('operator chaining', () => {
    it('chains 2 + 3 + 4 = 9 (immediate execution)', () => {
      calc.inputDigit('2');
      calc.inputBinaryOp('+');
      calc.inputDigit('3');
      calc.inputBinaryOp('+');  // evaluates 2+3=5
      calc.inputDigit('4');
      const snap = calc.inputEquals();  // evaluates 5+4=9
      expect(snap.displayEml).toBe('9');
    });

    it('chains 2 + 3 * 4 = 20 (no precedence)', () => {
      calc.inputDigit('2');
      calc.inputBinaryOp('+');
      calc.inputDigit('3');
      calc.inputBinaryOp('*');  // evaluates 2+3=5
      calc.inputDigit('4');
      const snap = calc.inputEquals();  // evaluates 5*4=20
      expect(snap.displayEml).toBe('20');
    });
  });

  describe('unary operations', () => {
    it('computes sqrt(9) = 3', () => {
      calc.inputDigit('9');
      const snap = calc.inputUnaryOp('sqrt');
      expect(snap.displayEml).toBe('3');
      expect(snap.displayStd).toBe('3');
    });

    it('computes sin(0) = 0', () => {
      const snap = calc.inputUnaryOp('sin');
      expect(snap.displayEml).toBe('0');
      expect(snap.displayStd).toBe('0');
    });

    it('computes cos(0) = 1', () => {
      const snap = calc.inputUnaryOp('cos');
      expect(snap.displayEml).toBe('1');
      expect(snap.displayStd).toBe('1');
    });

    it('computes tan(0) = 0', () => {
      const snap = calc.inputUnaryOp('tan');
      expect(snap.displayEml).toBe('0');
      expect(snap.displayStd).toBe('0');
    });

    it('applies unary to result of binary', () => {
      calc.inputDigit('3');
      calc.inputBinaryOp('*');
      calc.inputDigit('3');
      calc.inputEquals();  // 9
      const snap = calc.inputUnaryOp('sqrt');
      expect(snap.displayEml).toBe('3');
    });
  });

  describe('clear', () => {
    it('resets everything', () => {
      calc.inputDigit('5');
      calc.inputBinaryOp('+');
      calc.inputDigit('3');
      const snap = calc.inputClear();
      expect(snap.state).toBe('INITIAL');
      expect(snap.displayInput).toBe('0');
      expect(snap.displayEml).toBe('');
      expect(snap.displayStd).toBe('');
    });
  });

  describe('negate', () => {
    it('negates current input', () => {
      calc.inputDigit('5');
      const snap = calc.inputNegate();
      expect(snap.displayInput).toBe('-5');
    });

    it('toggles negation', () => {
      calc.inputDigit('5');
      calc.inputNegate();
      const snap = calc.inputNegate();
      expect(snap.displayInput).toBe('5');
    });

    it('does not negate zero', () => {
      const snap = calc.inputNegate();
      expect(snap.displayInput).toBe('0');
    });
  });

  describe('edge cases', () => {
    it('division by zero shows undefined', () => {
      calc.inputDigit('1');
      calc.inputBinaryOp('/');
      calc.inputDigit('0');
      const snap = calc.inputEquals();
      expect(snap.displayStd).toBe('undefined');
    });

    it('new digit after result clears std display', () => {
      calc.inputDigit('2');
      calc.inputBinaryOp('+');
      calc.inputDigit('3');
      calc.inputEquals();
      expect(calc.getSnapshot().displayStd).toBe('5');
      const snap = calc.inputDigit('4');
      expect(snap.displayStd).toBe('');
    });

    it('operator after result uses result as accumulator', () => {
      calc.inputDigit('2');
      calc.inputBinaryOp('+');
      calc.inputDigit('3');
      calc.inputEquals();  // 5
      calc.inputBinaryOp('*');
      calc.inputDigit('4');
      const snap = calc.inputEquals();  // 5 * 4 = 20
      expect(snap.displayEml).toBe('20');
    });

    it('equals with no pending op does nothing', () => {
      calc.inputDigit('5');
      const snap = calc.inputEquals();
      expect(snap.displayInput).toBe('5');
      expect(snap.displayEml).toBe('');
    });
  });
});
