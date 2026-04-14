import { Button } from './Button';
import type { BinaryOp, UnaryOp, ConstOp } from '../calculator/calculator-engine';

interface KeypadProps {
  onDigit: (d: string) => void;
  onDecimal: () => void;
  onBinaryOp: (op: BinaryOp) => void;
  onUnaryOp: (op: UnaryOp) => void;
  onConstant: (op: ConstOp) => void;
  onEquals: () => void;
  onClear: () => void;
  onNegate: () => void;
}

export function Keypad({
  onDigit, onDecimal, onBinaryOp, onUnaryOp, onConstant, onEquals, onClear, onNegate,
}: KeypadProps) {
  return (
    <div className="keypad">
      {/* Row 1: Constants + utility */}
      <Button label="e" onClick={() => onConstant('e')} variant="secondary" ariaLabel="constant e" />
      <Button label="&pi;" onClick={() => onConstant('pi')} variant="secondary" ariaLabel="constant pi" />
      <Button label="1/x" onClick={() => onUnaryOp('recip')} variant="secondary" ariaLabel="reciprocal" />
      <Button label="rad" onClick={() => onUnaryOp('rad')} variant="secondary" ariaLabel="degrees to radians" />
      <Button label="deg" onClick={() => onUnaryOp('deg')} variant="secondary" ariaLabel="radians to degrees" />

      {/* Row 2: Inverse trig + logarithms */}
      <Button label="sin⁻¹" onClick={() => onUnaryOp('arcsin')} variant="secondary" ariaLabel="arc sine" />
      <Button label="cos⁻¹" onClick={() => onUnaryOp('arccos')} variant="secondary" ariaLabel="arc cosine" />
      <Button label="tan⁻¹" onClick={() => onUnaryOp('arctan')} variant="secondary" ariaLabel="arc tangent" />
      <Button label="log₁₀" onClick={() => onUnaryOp('log10')} variant="secondary" ariaLabel="log base 10" />
      <Button label="log₂" onClick={() => onUnaryOp('log2')} variant="secondary" ariaLabel="log base 2" />

      {/* Row 3: Hyperbolic + ln/exp */}
      <Button label="sinh" onClick={() => onUnaryOp('sinh')} variant="secondary" />
      <Button label="cosh" onClick={() => onUnaryOp('cosh')} variant="secondary" />
      <Button label="tanh" onClick={() => onUnaryOp('tanh')} variant="secondary" />
      <Button label="ln" onClick={() => onUnaryOp('ln')} variant="secondary" ariaLabel="natural log" />
      <Button label="exp" onClick={() => onUnaryOp('exp')} variant="secondary" ariaLabel="exponential" />

      {/* Row 4: Trig + sqrt/pow */}
      <Button label="sin" onClick={() => onUnaryOp('sin')} variant="secondary" />
      <Button label="cos" onClick={() => onUnaryOp('cos')} variant="secondary" />
      <Button label="tan" onClick={() => onUnaryOp('tan')} variant="secondary" />
      <Button label="&radic;" onClick={() => onUnaryOp('sqrt')} variant="secondary" ariaLabel="square root" />
      <Button label="x&#x207F;" onClick={() => onBinaryOp('pow')} variant="secondary" ariaLabel="power" />

      {/* Row 5: Utilities + divide */}
      <Button label="C" onClick={onClear} variant="utility" ariaLabel="clear" />
      <Button label="&plusmn;" onClick={onNegate} variant="utility" ariaLabel="negate" />
      <Button label="." onClick={onDecimal} variant="utility" />
      <Button label="&divide;" onClick={() => onBinaryOp('/')} variant="operator" ariaLabel="divide" />

      {/* Row 6: 7 8 9 * */}
      <Button label="7" onClick={() => onDigit('7')} />
      <Button label="8" onClick={() => onDigit('8')} />
      <Button label="9" onClick={() => onDigit('9')} />
      <Button label="&times;" onClick={() => onBinaryOp('*')} variant="operator" ariaLabel="multiply" />

      {/* Row 7: 4 5 6 - */}
      <Button label="4" onClick={() => onDigit('4')} />
      <Button label="5" onClick={() => onDigit('5')} />
      <Button label="6" onClick={() => onDigit('6')} />
      <Button label="&minus;" onClick={() => onBinaryOp('-')} variant="operator" ariaLabel="subtract" />

      {/* Row 8: 1 2 3 + */}
      <Button label="1" onClick={() => onDigit('1')} />
      <Button label="2" onClick={() => onDigit('2')} />
      <Button label="3" onClick={() => onDigit('3')} />
      <Button label="+" onClick={() => onBinaryOp('+')} variant="operator" ariaLabel="add" />

      {/* Row 9: 0 (span 2) = (span 2) */}
      <Button label="0" onClick={() => onDigit('0')} span={2} />
      <Button label="=" onClick={onEquals} variant="equals" span={2} />
    </div>
  );
}
