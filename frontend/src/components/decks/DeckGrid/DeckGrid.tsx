import type { DeckSummaryResponse } from "../../../types/deck";
import type { DeckCardCounts } from "../../../hooks/useDeckCardCounts";
import { DeckTile } from "../DeckTile";
import styles from "./DeckGrid.module.css";

export interface DeckGridProps {
  decks: DeckSummaryResponse[];
  /** Карта "id колоды -> количество карточек", см. хук useDeckCardCounts. */
  cardCounts: DeckCardCounts;
  /** id выбранной колоды (подсветить плитку). Актуально только для раздела "Колоды". */
  selectedId?: number | null;
  /** id колоды, для которой сейчас выполняется действие (например, запуск занятия). */
  busyId?: number | null;
  /**
   * Единственное действие по клику на плитку. Смысл клика различается по страницам:
   *  - в разделе "Начать занятие" клик сразу запускает урок по этой колоде;
   *  - в разделе "Колоды" клик выбирает колоду и открывает панель с её настройками
   *    (там уже находятся "Редактировать", "Архивировать", "Открыть карточки" и т.д.).
   */
  onTileClick: (deck: DeckSummaryResponse) => void;
}

export function DeckGrid({ decks, cardCounts, selectedId = null, busyId = null, onTileClick }: DeckGridProps) {
  return (
    <ul className={styles.grid} aria-label="Колоды">
      {decks.map((deck) => (
        <li key={deck.id} className={styles.cell}>
          <DeckTile
            deck={deck}
            cardCount={cardCounts[deck.id] ?? null}
            selected={deck.id === selectedId}
            busy={deck.id === busyId}
            onClick={() => onTileClick(deck)}
          />
        </li>
      ))}
    </ul>
  );
}