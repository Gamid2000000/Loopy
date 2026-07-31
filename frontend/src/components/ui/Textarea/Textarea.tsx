import { useId } from "react";
import type { TextareaHTMLAttributes } from "react";
import styles from "./Textarea.module.css";
type Props = TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string };
export function Textarea({ label, error, id, ...props }: Props) {
  const generated = useId();
  const inputId = id ?? generated;
  return (
    <label className={styles.field} htmlFor={inputId}>
      <span>{label}</span>
      <textarea
        id={inputId}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${inputId}-error` : undefined}
        {...props}
      />
      {error && <small id={`${inputId}-error`}>{error}</small>}
    </label>
  );
}
