import { Button } from './Button';
import type { BinaryOp, UnaryOp } from '../calculator/calculator-engine';

interface KeypadProps {
  onDigit: (d: string) => void;
  onDecimal: () => void;
  onBinaryOp: (op: BinaryOp) => void;
  onUnaryOp: (op: UnaryOp) => void;
  onEquals: () => void;
  onClear: () => void;
  onNegate: () => void;
}

export function Keypad({
  onDigit, onDecimal, onBinaryOp, onUnaryOp, onEquals, onClear, onNegate,
}: KeypadProps) {
  return (
    <div className="keypad">
      {/* Row 1: Scientific functions */}
      <Button label="sin" onClick={() => onUnaryOp('sin')} variant="secondary" />
      <Button label="cos" onClick={() => onUnaryOp('cos')} variant="secondary" />
      <Button label="tan" onClick={() => onUnaryOp('tan')} variant="secondary" />
      <Button label="&radic;" onClick={() => onUnaryOp('sqrt')} variant="secondary" ariaLabel="square root" />
      <Button label="x&#x207F;" onClick={() => onBinaryOp('pow')} variant="secondary" ariaLabel="power" />

      {/* Row 2: Utilities + divide */}
      <Button label="C" onClick={onClear} variant="utility" ariaLabel="clear" />
      <Button label="&plusmn;" onClick={onNegate} variant="utility" ariaLabel="negate" />
      <Button label="." onClick={onDecimal} variant="utility" />
      <Button label="&divide;" onClick={() => onBinaryOp('/')} variant="operator" ariaLabel="divide" />

      {/* Row 3: 7 8 9 * */}
      <Button label="7" onClick={() => onDigit('7')} />
      <Button label="8" onClick={() => onDigit('8')} />
      <Button label="9" onClick={() => onDigit('9')} />
      <Button label="&times;" onClick={() => onBinaryOp('*')} variant="operator" ariaLabel="multiply" />

      {/* Row 4: 4 5 6 - */}
      <Button label="4" onClick={() => onDigit('4')} />
      <Button label="5" onClick={() => onDigit('5')} />
      <Button label="6" onClick={() => onDigit('6')} />
      <Button label="&minus;" onClick={() => onBinaryOp('-')} variant="operator" ariaLabel="subtract" />

      {/* Row 5: 1 2 3 + */}
      <Button label="1" onClick={() => onDigit('1')} />
      <Button label="2" onClick={() => onDigit('2')} />
      <Button label="3" onClick={() => onDigit('3')} />
      <Button label="+" onClick={() => onBinaryOp('+')} variant="operator" ariaLabel="add" />

      {/* Row 6: 0 (span 2) = (span 2) */}
      <Button label="0" onClick={() => onDigit('0')} span={2} />
      <Button label="=" onClick={onEquals} variant="equals" span={2} />
    </div>
  );
}
