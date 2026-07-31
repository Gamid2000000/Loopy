import type { CardSummaryResponse } from "../../../types/card";
import { CardListItem } from "../CardListItem";
import styles from "./CardList.module.css";
export function CardList({
  cards,
  selectedId,
  onSelect,
  onEdit,
  onArchive,
  onRestore,
  selectedIds = new Set<number>(),
  onToggleSelection,
  onSelectPage,
}: {
  cards: CardSummaryResponse[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onArchive: (id: number) => void;
  onRestore: (id: number) => void;
  selectedIds?: Set<number>;
  onToggleSelection?: (id: number) => void;
  onSelectPage?: () => void;
}) {
  return (
    <div className={styles.list} role="table" aria-label="Карточки">
      <div className={styles.head} role="row">
        <span><input type="checkbox" aria-label="Выбрать карточки текущей страницы" checked={cards.length > 0 && cards.every((card) => selectedIds.has(card.id))} ref={(element) => { if (element) element.indeterminate = cards.some((card) => selectedIds.has(card.id)) && !cards.every((card) => selectedIds.has(card.id)); }} onChange={onSelectPage} /></span>
        <span>Лицевая сторона</span>
        <span>Обратная сторона</span>
        <span className={styles.optional}>Статус</span>
        <span>Действия</span>
      </div>
      {cards.map((card) => (
        <CardListItem
          key={card.id}
          card={card}
          selected={card.id === selectedId}
          onSelect={onSelect}
          onEdit={onEdit}
          onArchive={onArchive}
          onRestore={onRestore}
          bulkSelected={selectedIds.has(card.id)}
          onToggleSelection={onToggleSelection}
        />
      ))}
    </div>
  );
}
