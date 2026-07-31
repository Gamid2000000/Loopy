import type { StatisticsPeriod } from "../../../types/statistics";
import styles from "./PeriodSelector.module.css";

const periods: StatisticsPeriod[] = [7, 30, 90];

export function PeriodSelector({
  value,
  onChange,
  disabled,
}: {
  value: StatisticsPeriod;
  onChange: (period: StatisticsPeriod) => void;
  disabled?: boolean;
}) {
  return (
    <div className={styles.selector} aria-label="Период статистики">
      {periods.map((period) => (
        <button
          key={period}
          type="button"
          aria-pressed={value === period}
          disabled={disabled}
          onClick={() => onChange(period)}
        >
          {period} дней
        </button>
      ))}
    </div>
  );
}
