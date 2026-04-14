export type ButtonVariant = 'primary' | 'operator' | 'secondary' | 'utility' | 'equals';

interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: ButtonVariant;
  span?: number;
  ariaLabel?: string;
}

export function Button({ label, onClick, variant = 'primary', span, ariaLabel }: ButtonProps) {
  return (
    <button
      className={`calc-btn calc-btn--${variant}`}
      onClick={onClick}
      style={span ? { gridColumn: `span ${span}` } : undefined}
      aria-label={ariaLabel ?? label}
    >
      {label}
    </button>
  );
}
