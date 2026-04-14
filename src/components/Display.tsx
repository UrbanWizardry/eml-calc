interface DisplayProps {
  input: string;
  emlResult: string;
  stdResult: string;
}

export function Display({ input, emlResult, stdResult }: DisplayProps) {
  const showResult = emlResult !== '';
  const mainValue = showResult ? emlResult : input;

  return (
    <div className="display">
      <div className="display-eml">
        <span className="display-label">EML</span>
        <span className="display-value">{mainValue}</span>
      </div>
      <div className="display-std">
        <span className="display-label">Standard</span>
        <span className="display-value">{stdResult || '\u00A0'}</span>
      </div>
    </div>
  );
}
