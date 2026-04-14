import { useRef, useState, useEffect, useCallback } from 'react';
import { CalculatorEngine } from '../calculator/calculator-engine';
import type { CalcSnapshot, BinaryOp, UnaryOp } from '../calculator/calculator-engine';
import { Display } from './Display';
import { Keypad } from './Keypad';
import { TreeView } from './TreeView';

const initialSnapshot: CalcSnapshot = {
  state: 'INITIAL',
  displayInput: '0',
  displayEml: '',
  displayStd: '',
  tree: null,
};

export function Calculator() {
  const engineRef = useRef(new CalculatorEngine());
  const [snapshot, setSnapshot] = useState<CalcSnapshot>(initialSnapshot);
  const [showTree, setShowTree] = useState(false);
  const [treeKey, setTreeKey] = useState(0);

  const update = useCallback((snap: CalcSnapshot) => {
    if (snap.tree !== null) setTreeKey(k => k + 1);
    setSnapshot(snap);
  }, []);

  const handleDigit = useCallback((d: string) => {
    update(engineRef.current.inputDigit(d));
  }, [update]);

  const handleDecimal = useCallback(() => {
    update(engineRef.current.inputDecimal());
  }, [update]);

  const handleBinaryOp = useCallback((op: BinaryOp) => {
    update(engineRef.current.inputBinaryOp(op));
  }, [update]);

  const handleUnaryOp = useCallback((op: UnaryOp) => {
    update(engineRef.current.inputUnaryOp(op));
  }, [update]);

  const handleEquals = useCallback(() => {
    update(engineRef.current.inputEquals());
  }, [update]);

  const handleClear = useCallback(() => {
    update(engineRef.current.inputClear());
  }, [update]);

  const handleNegate = useCallback(() => {
    update(engineRef.current.inputNegate());
  }, [update]);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(e.key);
      } else if (e.key === '.') {
        handleDecimal();
      } else if (e.key === '+') {
        handleBinaryOp('+');
      } else if (e.key === '-') {
        handleBinaryOp('-');
      } else if (e.key === '*') {
        handleBinaryOp('*');
      } else if (e.key === '/') {
        e.preventDefault();
        handleBinaryOp('/');
      } else if (e.key === '^') {
        handleBinaryOp('pow');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleDecimal, handleBinaryOp, handleEquals, handleClear]);

  return (
    <div className={`calculator-layout ${showTree ? 'calculator-layout--with-tree' : ''}`}>
      <div className="calculator">
        <Display
          input={snapshot.displayInput}
          emlResult={snapshot.displayEml}
          stdResult={snapshot.displayStd}
        />
        <Keypad
          onDigit={handleDigit}
          onDecimal={handleDecimal}
          onBinaryOp={handleBinaryOp}
          onUnaryOp={handleUnaryOp}
          onEquals={handleEquals}
          onClear={handleClear}
          onNegate={handleNegate}
        />
        <button
          className="tree-toggle-btn"
          onClick={() => setShowTree(prev => !prev)}
        >
          {showTree ? 'Hide' : 'Show'} EML Tree
        </button>
      </div>
      {showTree && (
        <div className="tree-side-panel">
          <TreeView key={treeKey} tree={snapshot.tree} />
        </div>
      )}
    </div>
  );
}
