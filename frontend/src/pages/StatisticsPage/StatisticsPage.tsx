import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { RefreshIcon } from "../../components/icons/RefreshIcon";
import { PeriodSelector } from "../../components/statistics/PeriodSelector";
import { StatisticsMetrics } from "../../components/statistics/StatisticsMetrics";
import { StatisticsActivityChart } from "../../components/statistics/StatisticsActivityChart";
import { GradeDistribution } from "../../components/statistics/GradeDistribution";
import { StreakSummary } from "../../components/statistics/StreakSummary";
import { StatisticsSkeleton } from "../../components/statistics/StatisticsSkeleton";
import { StatisticsEmptyState } from "../../components/statistics/StatisticsEmptyState";
import { StatisticsErrorState } from "../../components/statistics/StatisticsErrorState";
import { useStatistics } from "../../hooks/useStatistics";
import { formatPeriodRange } from "../../utils/formatLocalDate";
import styles from "./StatisticsPage.module.css";

function isEmpty(totalAnswers: number, completedSessions: number, totalStudyTimeMs: number) {
  return totalAnswers === 0 && completedSessions === 0 && totalStudyTimeMs === 0;
}
export function StatisticsPage() {
  const data = useStatistics();
  const range = data.statistics ? formatPeriodRange(data.statistics.fromDate, data.statistics.toDate) : null;
  const subtitle = range ? `Период: ${range}` : `За последние ${data.period} дней`;
  return (
    <main className={`page ${styles.page}`}>
      <PageHeader
        title="Статистика"
        subtitle={subtitle}
        action={
          <Button variant="secondary" disabled={data.isRefreshing} onClick={data.reload} leftIcon={<RefreshIcon />}>
            Обновить
          </Button>
        }
      />
      <div className={styles.controls}>
        <PeriodSelector value={data.period} onChange={data.setPeriod} />
      </div>
      {data.status === "loading" && <StatisticsSkeleton />}
      {data.status === "error" && (
        <div className={styles.state}>
          <StatisticsErrorState network={data.error?.isNetworkError === true} onRetry={data.reload} />
        </div>
      )}
      {data.status === "success" &&
        data.statistics &&
        (isEmpty(data.statistics.totalAnswers, data.statistics.completedSessions, data.statistics.totalStudyTimeMs) ? (
          <div className={styles.state}>
            <StatisticsEmptyState />
          </div>
        ) : (
          <div className={styles.data}>
            <StatisticsMetrics statistics={data.statistics} />
            <div className={styles.panels}>
              <StatisticsActivityChart activity={data.statistics.activity} />
              <GradeDistribution
                distribution={data.statistics.gradeDistribution}
                totalAnswers={data.statistics.totalAnswers}
              />
              <StreakSummary streak={data.statistics.streak} />
            </div>
          </div>
        ))}
    </main>
  );
}
