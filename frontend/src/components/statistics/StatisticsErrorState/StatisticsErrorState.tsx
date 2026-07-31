import { Button } from "../../ui/Button";
import { Card } from "../../ui/Card";
import styles from "./StatisticsErrorState.module.css";
export function StatisticsErrorState({ network, onRetry }: { network: boolean; onRetry: () => void }) {
  return (
    <Card className={styles.card} role="alert">
      <h2>Не удалось загрузить статистику</h2>
      <p>{network ? "Нет соединения с сервером" : "Не удалось загрузить статистику"}</p>
      <Button onClick={onRetry}>Повторить</Button>
    </Card>
  );
}
