import { useId } from "react";
import type { InputHTMLAttributes } from "react";
import styles from "./Input.module.css";
type Props = InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string; helperText?: string };
export function Input({ label, error, helperText, required, id, ...props }: Props) {
  const generated = useId();
  const inputId = id ?? generated;
  const helpId = `${inputId}-help`;
  return (
    <label className={styles.field} htmlFor={inputId}>
      <span>
        {label}
        {required && <span aria-hidden="true"> *</span>}
      </span>
      <input
        id={inputId}
        required={required}
        aria-invalid={Boolean(error)}
        aria-describedby={error || helperText ? helpId : undefined}
        {...props}
      />
      {(error || helperText) && (
        <small id={helpId} className={error ? styles.error : ""}>
          {error ?? helperText}
        </small>
      )}
    </label>
  );
}
