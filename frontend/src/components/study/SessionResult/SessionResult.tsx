import { useNavigate } from "react-router-dom";
import { Button } from "../../ui/Button";
import type { StudySessionResponse } from "../../../types/studySession";
import styles from "./SessionResult.module.css";

/** Небольшая иконка-галочка в кружке — своя, чтобы не заводить отдельный файл иконки ради одного места использования. */
function CheckCircleGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M7.5 12.5l3 3 6-6.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * SessionResult — экран "Занятие завершено".
 *
 * Показывается на весь экран по центру (карточка с итогами по центру страницы,
 * без сайдбара — так же, как выглядело само занятие).
 *
 * Раньше здесь была кнопка "Повторить слова", которая пыталась сразу запустить
 * новое занятие по этой же колоде. От неё отказались: сразу после завершения
 * занятия по алгоритму интервальных повторений (SM-2) для колоды физически
 * никогда нет слов, которые "пора" повторять снова — это и есть весь смысл
 * интервальных повторений, а не баг. Поэтому кнопка почти всегда приводила
 * только к ошибке "нет слов для повторения" и была бессмысленной.
 */
export function SessionResult({ session }: { session: StudySessionResponse }) {
  const navigate = useNavigate();

  return (
    <main className={styles.wrapper}>
      <section className={styles.card} aria-labelledby="session-result-title">
        <span className={styles.icon} aria-hidden="true">
          <CheckCircleGlyph />
        </span>

        <h1 id="session-result-title" className={styles.title}>
          Занятие завершено
        </h1>

        <p className={styles.deckName}>{session.deckName}</p>

        <div className={styles.stats}>
          <span className={styles.statValue}>{session.totalCardsCount}</span>
          <span className={styles.statLabel}>карточек пройдено</span>
        </div>

        {session.completedAt && (
          <p className={styles.completedAt}>
            Завершено{" "}
            {new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(
              new Date(session.completedAt),
            )}
          </p>
        )}

        <div className={styles.actions}>
          <Button fullWidth onClick={() => navigate("/decks")}>
            К колодам
          </Button>
        </div>
      </section>
    </main>
  );
}