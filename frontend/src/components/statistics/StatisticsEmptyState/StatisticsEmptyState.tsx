import { Link } from "react-router-dom";
import { Card } from "../../ui/Card";
import styles from "./StatisticsEmptyState.module.css";
export function StatisticsEmptyState() {
  return (
    <Card className={styles.card} role="status">
      <h2>За выбранный период статистики пока нет</h2>
      <p>Пройдите занятие, чтобы здесь появилась активность</p>
      <Link className={styles.link} to="/decks">
        Перейти к колодам
      </Link>
    </Card>
  );
}
