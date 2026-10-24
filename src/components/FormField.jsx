import { useId, useState } from 'react';

/**
 * Labelled input with optional helper text and an accessible inline error message.
 * Password inputs get a Show/Hide toggle.
 */
export default function FormField({ label, error, hint, as = 'input', className = '', ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const [revealed, setRevealed] = useState(false);
  const Input = as;
  const isPassword = inputProps.type === 'password';
  const describedBy = [error && errorId, hint && hintId].filter(Boolean).join(' ') || undefined;

  const input = (
    <Input
      id={id}
      aria-invalid={error ? 'true' : undefined}
      aria-describedby={describedBy}
      {...inputProps}
      type={isPassword && revealed ? 'text' : inputProps.type}
    />
  );

  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      {isPassword ? (
        <div className="input-with-action">
          {input}
          <button
            type="button"
            className="input-action"
            onClick={() => setRevealed((r) => !r)}
            aria-label={`${revealed ? 'Hide' : 'Show'} ${label.toLowerCase()}`}
          >
            {revealed ? 'Hide' : 'Show'}
          </button>
        </div>
      ) : (
        input
      )}
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="field-hint">
          {hint}
        </p>
      )}
    </div>
  );
}
