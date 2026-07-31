import { Card } from "../../ui/Card";
import styles from "./StatisticsMetricCard.module.css";
export function StatisticsMetricCard({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className={styles.card}>
      <p>{label}</p>
      <strong>{value}</strong>
    </Card>
  );
}
