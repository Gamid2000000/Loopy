import { Skeleton } from "../../ui/Skeleton";
import styles from "./StatisticsSkeleton.module.css";
export function StatisticsSkeleton() {
  return (
    <div className={styles.root} aria-busy="true" aria-label="Загрузка статистики">
      <Skeleton height="40px" />
      <div className={styles.metrics}>
        {Array.from({ length: 6 }, (_, index) => (
          <Skeleton key={index} height="112px" />
        ))}
      </div>
      <div className={styles.content}>
        <Skeleton height="260px" />
        <Skeleton height="260px" />
        <Skeleton height="170px" />
      </div>
    </div>
  );
}
