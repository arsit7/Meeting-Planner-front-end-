import { useId } from 'react';

/** Labelled input with an accessible inline error message. */
export default function FormField({ label, error, as = 'input', className = '', ...inputProps }) {
  const id = useId();
  const errorId = `${id}-error`;
  const Input = as;
  return (
    <div className={`field ${className}`}>
      <label htmlFor={id}>{label}</label>
      <Input
        id={id}
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
      />
      {error && (
        <p id={errorId} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}
