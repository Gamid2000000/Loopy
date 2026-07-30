import { Card } from "../../ui/Card";
import type { ActivityDay } from "../../../types/statistics";
import styles from "./ActivityChart.module.css";
export function ActivityChart({ activity }: { activity: ActivityDay[] }) {
  const max = Math.max(1, ...activity.map((x) => Math.max(0, x.answersCount)));
  return (
    <Card>
      <h2>Активность (7 дней)</h2>
      <div className={styles.chart}>
        {activity.map((day) => (
          <div key={day.date}>
            <i style={{ height: `${Math.max(0, Math.min(100, (day.answersCount / max) * 100))}%` }} />
            <small>{new Date(day.date).toLocaleDateString("ru-RU", { weekday: "short" })}</small>
          </div>
        ))}
      </div>
    </Card>
  );
}
