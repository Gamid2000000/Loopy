import { Card } from "../../ui/Card";
import styles from "./MetricCard.module.css";

type MetricCardProps = {
  label: string;
  value: string | number;
  detail?: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <Card className={styles.card}>
      <p className={styles.label}>{label}</p>
      <strong className={styles.value}>{value}</strong>
      {detail && <small className={styles.detail}>{detail}</small>}
    </Card>
  );
}
