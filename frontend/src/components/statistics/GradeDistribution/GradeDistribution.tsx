import { Card } from "../../ui/Card";
import type { GradeDistributionResponse } from "../../../types/statistics";
import { GradeDistributionItem } from "../GradeDistributionItem";
import styles from "./GradeDistribution.module.css";

export function GradeDistribution({
  distribution,
  totalAnswers,
}: {
  distribution: GradeDistributionResponse;
  totalAnswers: number;
}) {
  const rows = [
    ["AGAIN — Снова", distribution.again, "var(--color-danger)"],
    ["HARD — Трудно", distribution.hard, "var(--color-warning)"],
    ["GOOD — Хорошо", distribution.good, "var(--color-info)"],
    ["EASY — Легко", distribution.easy, "var(--color-success)"],
  ] as const;
  return (
    <Card className={styles.card}>
      <h2>Распределение ответов</h2>
      <ul>
        {rows.map(([label, value, color]) => (
          <GradeDistributionItem key={label} label={label} value={value} total={totalAnswers} color={color} />
        ))}
      </ul>
    </Card>
  );
}
