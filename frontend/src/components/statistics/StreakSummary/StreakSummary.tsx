import { Card } from "../../ui/Card";
import type { StatisticsStreakResponse } from "../../../types/statistics";
import { formatDayCount } from "../../../utils/formatDayCount";
import styles from "./StreakSummary.module.css";
export function StreakSummary({ streak }: { streak: StatisticsStreakResponse }) {
  return (
    <Card className={styles.card}>
      <h2>Серия занятий</h2>
      <div>
        <section>
          <p>Текущая серия</p>
          <strong>{formatDayCount(streak.currentDays)}</strong>
        </section>
        <section>
          <p>Лучшая серия</p>
          <strong>{formatDayCount(streak.longestDays)}</strong>
        </section>
      </div>
    </Card>
  );
}
