import type { DeckSummaryResponse } from "../../../types/deck";
import { DeckIcon } from "../../icons/DeckIcon";
import styles from "./DeckTile.module.css";

/** Короткое человекочитаемое склонение слова "слово" под число карточек в колоде. */
function pluralizeWords(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return "слово";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "слова";
  return "слов";
}

/** Короткая дата без времени — для плитки достаточно "12 июл 2026". */
function formatShortDate(value: string): string {
  return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short", year: "numeric" }).format(
    new Date(value),
  );
}

/** Маленькая иконка календаря — своя, т.к. готовой в проекте нет, стиль совпадает с остальными иконками. */
function CalendarGlyph() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M3.5 9.5h17M8 3v3.5M16 3v3.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

export interface DeckTileProps {
  deck: DeckSummaryResponse;
  /** Количество карточек в колоде. `null` — ещё загружается. */
  cardCount: number | null;
  /** Плитка выделена (используется в разделе "Колоды" при выборе колоды). */
  selected?: boolean;
  /** Плитка сейчас занята действием (например, запускается занятие) — блокирует повторный клик и показывает спиннер. */
  busy?: boolean;
  /** Единственное действие по клику на всю плитку целиком — его смысл задаёт страница-родитель. */
  onClick: () => void;
}

/**
 * DeckTile — квадратная плитка одной колоды.
 *
 * Дизайн выдержан в стиле остального приложения (тёмная поверхность, фиолетовая
 * акцентная подсветка при наведении/выборе — как у кнопок и полей ввода), а не
 * поверх него: колода узнаётся по бежевой иконке-бейджу и тонкой полоске сверху,
 * а не по сплошной заливке всей плитки чужим цветом.
 *
 * Вся плитка целиком кликабельна (один клик = одно действие), никаких
 * дополнительных кнопок или выпадающих меню внутри плитки нет.
 */
export function DeckTile({ deck, cardCount, selected = false, busy = false, onClick }: DeckTileProps) {
  const archived = deck.status === "ARCHIVED";
  const countLabel = cardCount === null ? "…" : cardCount === 0 ? "Пока пусто" : `${cardCount} ${pluralizeWords(cardCount)}`;

  return (
    <button
      type="button"
      className={[
        styles.tile,
        archived ? styles.archived : "",
        selected ? styles.selected : "",
        busy ? styles.busy : "",
      ]
        .filter(Boolean)
        .join(" ")}
      onClick={onClick}
      disabled={busy}
      aria-pressed={selected}
      aria-busy={busy}
    >
      {/* Тонкая акцентная полоска сверху — единственный явный намёк на "колоду карт",
          не спорит с тёмной темой приложения */}
      <span className={styles.accentBar} aria-hidden="true" />

      <span className={styles.topRow}>
        <span className={styles.iconBadge} aria-hidden="true">
          <DeckIcon width={18} height={18} />
        </span>
        {archived && <span className={styles.archivedBadge}>В архиве</span>}
      </span>

      <span className={styles.textBlock}>
        <span className={styles.name}>{deck.name}</span>
        {deck.description && <span className={styles.description}>{deck.description}</span>}
      </span>

      <span className={styles.footer}>
        <span className={styles.statItem}>
          <DeckIcon width={14} height={14} />
          {countLabel}
        </span>
        <span className={styles.statItem}>
          <CalendarGlyph />
          {formatShortDate(deck.createdAt)}
        </span>
      </span>

      {busy && (
        <span className={styles.busyOverlay} aria-hidden="true">
          <span className={styles.spinner} />
        </span>
      )}
    </button>
  );
}