import { PageHeader } from "../../components/layout/PageHeader";
import { MetricCard } from "../../components/dashboard/MetricCard";
import { ActiveSessionCard } from "../../components/dashboard/ActiveSessionCard";
import { DailyLimitProgress } from "../../components/dashboard/DailyLimitProgress";
import { RecentSessionItem } from "../../components/dashboard/RecentSessionItem";
import { ActivityChart } from "../../components/dashboard/ActivityChart";
import { StreakCard } from "../../components/dashboard/StreakCard";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Button } from "../../components/ui/Button";
import { RefreshIcon } from "../../components/icons/RefreshIcon";
import { useDashboardData } from "../../hooks/useDashboardData";
import { formatDuration } from "../../utils/formatDuration";
import { formatPercentage } from "../../utils/formatPercentage";
import styles from "./DashboardPage.module.css";

function DashboardSkeleton() {
  return (
    <main className={`page ${styles.page}`}>
      <PageHeader title="Главная" />
      <div className={styles.metrics}>
        {Array.from({ length: 5 }, (_, index) => (
          <Skeleton key={index} height="110px" />
        ))}
      </div>
      <div className={styles.content}>
        <Skeleton height="190px" />
        <Skeleton height="180px" />
        <Skeleton height="220px" />
        <Skeleton height="160px" />
      </div>
    </main>
  );
}
function errorMessage(network: boolean) {
  return network ? "Нет соединения с сервером" : "Не удалось загрузить данные";
}

export function DashboardPage() {
  const data = useDashboardData();
  const refreshing = data.dashboardStatus === "loading" || data.activityStatus === "loading";
  if (!data.dashboard && data.dashboardStatus !== "error") return <DashboardSkeleton />;
  if (!data.dashboard)
    return (
      <main className={`page ${styles.page}`}>
        <ErrorState
          message={errorMessage(data.dashboardError?.isNetworkError === true)}
          onRetry={() => void data.reload()}
        />
      </main>
    );
  const dashboard = data.dashboard;
  const empty =
    dashboard.availability.availableReviewCardsCount === 0 &&
    dashboard.availability.availableNewCardsCount === 0 &&
    dashboard.activeSessions.length === 0;
  return (
    <main className={`page ${styles.page}`}>
      <PageHeader
        title="Главная"
        subtitle="Ваш прогресс обучения сегодня"
        action={
          <Button
            variant="secondary"
            disabled={refreshing}
            onClick={() => {
              void data.reload();
              void data.reloadActivity();
            }}
            leftIcon={<RefreshIcon />}
          >
            Обновить
          </Button>
        }
      />
      <div className={`${styles.metrics} ${styles.space}`}>
        <MetricCard label="Доступно повторений" value={dashboard.availability.availableReviewCardsCount} />
        <MetricCard label="Доступно новых карточек" value={dashboard.availability.availableNewCardsCount} />
        <MetricCard
          label="Ответов сегодня"
          value={dashboard.today.answeredCardsCount}
          detail={formatDuration(dashboard.today.studyTimeMs)}
        />
        <MetricCard label="Успешность" value={formatPercentage(dashboard.today.successRate)} />
        <StreakCard streak={dashboard.streak} />
      </div>
      {empty ? (
        <section className={styles.emptyArea}>
          <EmptyState title="Всё выполнено на сегодня" description="Новых заданий и незавершённых занятий пока нет." />
        </section>
      ) : (
        <div className={`${styles.content} ${styles.space}`}>
          {dashboard.activeSessions.length > 0 ? (
            <ActiveSessionCard session={dashboard.activeSessions[0]} timezone={dashboard.timezone} />
          ) : (
            <EmptyState title="Нет активного занятия" description="Выберите колоду, чтобы начать следующее занятие." />
          )}
          <DailyLimitProgress availability={dashboard.availability} />
          {data.activityStatus === "error" ? (
            <ErrorState
              message={errorMessage(data.activityError?.isNetworkError === true)}
              onRetry={() => void data.reloadActivity()}
            />
          ) : (
            <ActivityChart activity={data.activity} />
          )}
          <section className={styles.recent}>
            <h2>Последние сессии</h2>
            <ul>
              {dashboard.recentSessions.map((session) => (
                <RecentSessionItem key={session.sessionId} session={session} timezone={dashboard.timezone} />
              ))}
            </ul>
          </section>
        </div>
      )}
    </main>
  );
}
