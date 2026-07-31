import { Card } from "../../ui/Card";
import type { StatisticsActivityDayResponse } from "../../../types/statistics";
import { formatLocalDate } from "../../../utils/formatLocalDate";
import styles from "./StatisticsActivityChart.module.css";

const AXIS_STEPS = 4;

export function StatisticsActivityChart({ activity }: { activity: StatisticsActivityDayResponse[] }) {
  const max = Math.max(0, ...activity.map((day) => day.answersCount));
  const scaleMax = max === 0 ? 1 : Math.ceil(max / AXIS_STEPS) * AXIS_STEPS;
  const labelsEvery = Math.ceil(activity.length / 5);
  const axisValues = Array.from({ length: AXIS_STEPS + 1 }, (_, index) => scaleMax - (scaleMax / AXIS_STEPS) * index);

  return (
    <Card className={styles.card}>
      <h2>Активность</h2>
      <p className={styles.summary}>Ответы по дням выбранного периода</p>
      <div className={styles.legend} aria-label="Обозначения графика">
        <span>
          <i className={styles.answersLegend} />
          Все ответы
        </span>
        <span>
          <i className={styles.successfulLegend} />
          Успешные ответы
        </span>
      </div>
      {max === 0 && <p className={styles.zero}>За этот период пока нет ответов</p>}
      <div className={styles.axisTitle}>Количество ответов</div>
      <div className={styles.plot}>
        <div className={styles.axis} aria-hidden="true">
          {axisValues.map((value) => (
            <span key={value}>{value}</span>
          ))}
        </div>
        <div
          className={styles.chart}
          style={{ gridTemplateColumns: `repeat(${Math.max(activity.length, 1)}, minmax(0, 1fr))` }}
          role="img"
          aria-label={activity
            .map((day) => `${day.date}: ${day.answersCount} ответов, ${day.successfulAnswersCount} успешных`)
            .join("; ")}
        >
          {activity.map((day, index) => (
            <div
              className={styles.day}
              key={day.date}
              title={`${day.date}: ${day.answersCount} ответов, успешных: ${day.successfulAnswersCount}`}
            >
              <div className={styles.barArea}>
                <i className={styles.answersBar} style={{ height: `${(day.answersCount / scaleMax) * 100}%` }} />
                <i
                  className={styles.successfulBar}
                  style={{ height: `${(day.successfulAnswersCount / scaleMax) * 100}%` }}
                />
              </div>
              {(activity.length <= 7 || index === 0 || index === activity.length - 1 || index % labelsEvery === 0) && (
                <small>{formatLocalDate(day.date, activity.length <= 7 ? "weekday" : "monthDay")}</small>
              )}
            </div>
          ))}
        </div>
      </div>
      <table className="srOnly">
        <caption>Активность по дням</caption>
        <thead>
          <tr>
            <th>Дата</th>
            <th>Ответов</th>
            <th>Успешных</th>
          </tr>
        </thead>
        <tbody>
          {activity.map((day) => (
            <tr key={day.date}>
              <td>{day.date}</td>
              <td>{day.answersCount}</td>
              <td>{day.successfulAnswersCount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}
