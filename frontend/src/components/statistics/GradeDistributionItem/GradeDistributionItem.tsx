import styles from "./GradeDistributionItem.module.css";
export function GradeDistributionItem({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0;
  return (
    <li className={styles.item}>
      <div>
        <span>{label}</span>
        <strong>{value}</strong>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-label={`${label}: ${value}, ${percentage.toFixed(0)}%`}
        aria-valuenow={value}
        aria-valuemax={total}
      >
        <i style={{ width: `${Math.min(100, percentage)}%`, backgroundColor: color }} />
      </div>
      <small>{percentage.toLocaleString("ru-RU", { maximumFractionDigits: 2 })}%</small>
    </li>
  );
}
