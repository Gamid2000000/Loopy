import { Card } from "../../ui/Card";
import type { Streak } from "../../../types/dashboard";
import styles from "./StreakCard.module.css";

export function StreakCard({ streak }: { streak: Streak }) {
  return (
    <Card className={styles.card}>
      <p>Текущая серия</p>
      <strong>{streak.currentDays} дней</strong>
      <small>Лучшая серия: {streak.longestDays} дней</small>
    </Card>
  );
}
