import type { StatisticsOverviewResponse } from "../../../types/statistics";
import { formatDuration } from "../../../utils/formatDuration";
import { formatPercentage } from "../../../utils/formatPercentage";
import { formatResponseTime } from "../../../utils/formatResponseTime";
import { StatisticsMetricCard } from "../StatisticsMetricCard";
import styles from "./StatisticsMetrics.module.css";
export function StatisticsMetrics({ statistics }: { statistics: StatisticsOverviewResponse }) {
  const items = [
    ["Всего ответов", statistics.totalAnswers],
    ["Успешных ответов", statistics.successfulAnswers],
    ["Успешность", formatPercentage(statistics.successRate)],
    ["Время обучения", formatDuration(statistics.totalStudyTimeMs)],
    ["Среднее время ответа", formatResponseTime(statistics.averageResponseTimeMs)],
    ["Завершено занятий", statistics.completedSessions],
  ] as const;
  return (
    <section className={styles.grid} aria-label="Основные показатели">
      {items.map(([label, value]) => (
        <StatisticsMetricCard key={label} label={label} value={value} />
      ))}
    </section>
  );
}
