import { useId } from "react";
import type { SelectHTMLAttributes } from "react";
import styles from "./Select.module.css";
type Props = SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string };
export function Select({ label, error, id, children, ...props }: Props) {
  const generated = useId();
  const selectId = id ?? generated;
  return (
    <label className={styles.field} htmlFor={selectId}>
      <span>{label}</span>
      <select id={selectId} aria-invalid={Boolean(error)} {...props}>
        {children}
      </select>
      {error && <small>{error}</small>}
    </label>
  );
}
