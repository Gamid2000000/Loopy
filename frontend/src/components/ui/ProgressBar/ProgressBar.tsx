import styles from "./ProgressBar.module.css";
export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label: string }) {
  const safeValue = Math.max(0, value);
  const safeMax = Math.max(0, max);
  const percent = safeMax === 0 ? 0 : Math.min(100, (safeValue / safeMax) * 100);
  return (
    <div className={styles.wrap}>
      <div className={styles.label}>
        <span>{label}</span>
        <span>
          {safeValue} / {safeMax}
        </span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={label}
        aria-valuenow={safeValue}
        aria-valuemax={safeMax}
      >
        <div style={{ width: `${percent}%` }} />
      </div>
    </div>
  );
}
