import {
  Complex,
  emlAdd, emlSub, emlMul, emlDiv, emlPow,
  emlSin, emlCos, emlTan, emlSqrt,
  emlRecip, emlSinh, emlCosh, emlTanh,
  emlArcsin, emlArccos, emlArctan,
  emlLog10, emlLog2, emlLn, emlExp,
  emlDegToRad, emlRadToDeg,
  emlE, emlPi,
} from '../core';
import type { TreeNode } from '../core/eml-traced';
import { traceBinaryOp, traceUnaryOp, traceConstant } from '../core/eml-traced';

export type CalcState = 'INITIAL' | 'OPERAND_ENTRY' | 'OPERATOR_PENDING' | 'RESULT_DISPLAY';
export type BinaryOp = '+' | '-' | '*' | '/' | 'pow';
export type UnaryOp =
  | 'sin' | 'cos' | 'tan' | 'sqrt'
  | 'arcsin' | 'arccos' | 'arctan'
  | 'sinh' | 'cosh' | 'tanh'
  | 'log10' | 'log2' | 'ln' | 'exp'
  | 'recip' | 'rad' | 'deg';
export type ConstOp = 'e' | 'pi';

export interface EvalResult {
  emlValue: number;
  stdValue: number;
}

export interface CalcSnapshot {
  state: CalcState;
  displayInput: string;
  displayEml: string;
  displayStd: string;
  tree: TreeNode | null;
}

function formatDisplay(value: number): string {
  if (!isFinite(value) || isNaN(value)) return 'undefined';
  if (value === 0) return '0';

  const abs = Math.abs(value);
  if (abs >= 1e12 || (abs < 1e-6 && abs > 0)) {
    return value.toExponential(8);
  }

  const str = value.toPrecision(12);
  if (str.includes('.')) {
    return str.replace(/\.?0+$/, '');
  }
  return str;
}

function evaluateBinary(op: BinaryOp, a: number, b: number): EvalResult {
  const ca = Complex.from(a);
  const cb = Complex.from(b);

  let emlResult: Complex;
  let stdValue: number;

  switch (op) {
    case '+': emlResult = emlAdd(ca, cb); stdValue = a + b; break;
    case '-': emlResult = emlSub(ca, cb); stdValue = a - b; break;
    case '*': emlResult = emlMul(ca, cb); stdValue = a * b; break;
    case '/': emlResult = emlDiv(ca, cb); stdValue = a / b; break;
    case 'pow': emlResult = emlPow(ca, cb); stdValue = Math.pow(a, b); break;
  }

  return { emlValue: emlResult.re, stdValue };
}

function evaluateUnary(op: UnaryOp, x: number): EvalResult {
  const cx = Complex.from(x);

  let emlResult: Complex;
  let stdValue: number;

  switch (op) {
    case 'sin': emlResult = emlSin(cx); stdValue = Math.sin(x); break;
    case 'cos': emlResult = emlCos(cx); stdValue = Math.cos(x); break;
    case 'tan': emlResult = emlTan(cx); stdValue = Math.tan(x); break;
    case 'sqrt': emlResult = emlSqrt(cx); stdValue = Math.sqrt(x); break;
    case 'arcsin': emlResult = emlArcsin(cx); stdValue = Math.asin(x); break;
    case 'arccos': emlResult = emlArccos(cx); stdValue = Math.acos(x); break;
    case 'arctan': emlResult = emlArctan(cx); stdValue = Math.atan(x); break;
    case 'sinh': emlResult = emlSinh(cx); stdValue = Math.sinh(x); break;
    case 'cosh': emlResult = emlCosh(cx); stdValue = Math.cosh(x); break;
    case 'tanh': emlResult = emlTanh(cx); stdValue = Math.tanh(x); break;
    case 'log10': emlResult = emlLog10(cx); stdValue = Math.log10(x); break;
    case 'log2': emlResult = emlLog2(cx); stdValue = Math.log2(x); break;
    case 'ln': emlResult = emlLn(cx); stdValue = Math.log(x); break;
    case 'exp': emlResult = emlExp(cx); stdValue = Math.exp(x); break;
    case 'recip': emlResult = emlRecip(cx); stdValue = 1 / x; break;
    case 'rad': emlResult = emlDegToRad(cx); stdValue = x * Math.PI / 180; break;
    case 'deg': emlResult = emlRadToDeg(cx); stdValue = x * 180 / Math.PI; break;
  }

  return { emlValue: emlResult.re, stdValue };
}

function evaluateConstant(op: ConstOp): EvalResult {
  switch (op) {
    case 'e': return { emlValue: emlE().re, stdValue: Math.E };
    case 'pi': return { emlValue: emlPi().re, stdValue: Math.PI };
  }
}

export class CalculatorEngine {
  private state: CalcState = 'INITIAL';
  private inputBuffer = '0';
  private accumulator: number | null = null;
  private pendingOp: BinaryOp | null = null;
  private emlResult = '';
  private stdResult = '';
  private lastTree: TreeNode | null = null;

  getSnapshot(): CalcSnapshot {
    return {
      state: this.state,
      displayInput: this.inputBuffer,
      displayEml: this.emlResult,
      displayStd: this.stdResult,
      tree: this.lastTree,
    };
  }

  inputDigit(digit: string): CalcSnapshot {
    if (this.state === 'INITIAL' || this.state === 'RESULT_DISPLAY') {
      this.inputBuffer = digit === '0' ? '0' : digit;
      this.state = 'OPERAND_ENTRY';
      this.stdResult = '';
      this.emlResult = '';
    } else if (this.state === 'OPERATOR_PENDING') {
      this.inputBuffer = digit === '0' ? '0' : digit;
      this.state = 'OPERAND_ENTRY';
    } else {
      if (this.inputBuffer === '0' && digit !== '0') {
        this.inputBuffer = digit;
      } else if (this.inputBuffer !== '0') {
        this.inputBuffer += digit;
      }
    }
    return this.getSnapshot();
  }

  inputDecimal(): CalcSnapshot {
    if (this.state === 'INITIAL' || this.state === 'RESULT_DISPLAY') {
      this.inputBuffer = '0.';
      this.state = 'OPERAND_ENTRY';
      this.stdResult = '';
      this.emlResult = '';
    } else if (this.state === 'OPERATOR_PENDING') {
      this.inputBuffer = '0.';
      this.state = 'OPERAND_ENTRY';
    } else {
      if (!this.inputBuffer.includes('.')) {
        this.inputBuffer += '.';
      }
    }
    return this.getSnapshot();
  }

  inputBinaryOp(op: BinaryOp): CalcSnapshot {
    if (this.state === 'OPERAND_ENTRY' && this.pendingOp !== null) {
      this.executeOperation();
    } else if (this.state === 'OPERAND_ENTRY' || this.state === 'INITIAL') {
      this.accumulator = parseFloat(this.inputBuffer);
    } else if (this.state === 'RESULT_DISPLAY') {
      const val = parseFloat(this.emlResult);
      this.accumulator = isNaN(val) ? parseFloat(this.inputBuffer) : val;
    }

    this.pendingOp = op;
    this.state = 'OPERATOR_PENDING';
    return this.getSnapshot();
  }

  inputUnaryOp(op: UnaryOp): CalcSnapshot {
    let value: number;
    if (this.state === 'RESULT_DISPLAY') {
      const val = parseFloat(this.emlResult);
      value = isNaN(val) ? 0 : val;
    } else {
      value = parseFloat(this.inputBuffer);
    }

    const result = evaluateUnary(op, value);
    this.emlResult = formatDisplay(result.emlValue);
    this.stdResult = formatDisplay(result.stdValue);
    this.inputBuffer = this.emlResult;
    this.lastTree = traceUnaryOp(op, value);
    this.state = 'RESULT_DISPLAY';
    return this.getSnapshot();
  }

  inputConstant(op: ConstOp): CalcSnapshot {
    const result = evaluateConstant(op);
    this.emlResult = formatDisplay(result.emlValue);
    this.stdResult = formatDisplay(result.stdValue);
    this.inputBuffer = this.emlResult;
    this.lastTree = traceConstant(op);
    this.state = 'RESULT_DISPLAY';
    return this.getSnapshot();
  }

  inputEquals(): CalcSnapshot {
    if (this.pendingOp === null) return this.getSnapshot();

    this.executeOperation();
    this.pendingOp = null;
    return this.getSnapshot();
  }

  inputClear(): CalcSnapshot {
    this.state = 'INITIAL';
    this.inputBuffer = '0';
    this.accumulator = null;
    this.pendingOp = null;
    this.emlResult = '';
    this.stdResult = '';
    this.lastTree = null;
    return this.getSnapshot();
  }

  inputNegate(): CalcSnapshot {
    if (this.state === 'OPERAND_ENTRY' || this.state === 'INITIAL') {
      if (this.inputBuffer !== '0') {
        if (this.inputBuffer.startsWith('-')) {
          this.inputBuffer = this.inputBuffer.slice(1);
        } else {
          this.inputBuffer = '-' + this.inputBuffer;
        }
      }
    } else if (this.state === 'RESULT_DISPLAY') {
      const val = parseFloat(this.emlResult);
      if (!isNaN(val) && val !== 0) {
        this.emlResult = formatDisplay(-val);
        this.stdResult = formatDisplay(-parseFloat(this.stdResult));
        this.inputBuffer = this.emlResult;
      }
    }
    return this.getSnapshot();
  }

  private executeOperation(): void {
    if (this.accumulator === null || this.pendingOp === null) return;

    const a = this.accumulator;
    const b = parseFloat(this.inputBuffer);
    const result = evaluateBinary(this.pendingOp, a, b);
    this.emlResult = formatDisplay(result.emlValue);
    this.stdResult = formatDisplay(result.stdValue);
    this.inputBuffer = this.emlResult;
    this.accumulator = result.emlValue;
    this.lastTree = traceBinaryOp(this.pendingOp, a, b);
    this.state = 'RESULT_DISPLAY';
  }
}
