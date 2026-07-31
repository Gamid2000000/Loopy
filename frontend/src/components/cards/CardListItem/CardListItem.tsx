import type { CardSummaryResponse } from "../../../types/card";
import { Button } from "../../ui/Button";
import { ArchiveIcon, EditIcon, RestoreIcon } from "../../icons/DeckActionIcons";
import { CardStatusBadge } from "../CardStatusBadge";
import styles from "./CardListItem.module.css";
export function CardListItem({
  card,
  selected,
  onSelect,
  onEdit,
  onArchive,
  onRestore,
  bulkSelected = false,
  onToggleSelection,
}: {
  card: CardSummaryResponse;
  selected: boolean;
  onSelect: (id: number) => void;
  onEdit: (id: number) => void;
  onArchive: (id: number) => void;
  onRestore: (id: number) => void;
  bulkSelected?: boolean;
  onToggleSelection?: (id: number) => void;
}) {
  const act = (e: React.MouseEvent, fn: (id: number) => void) => {
    e.stopPropagation();
    fn(card.id);
  };
  return (
    <div
      role="row"
      tabIndex={0}
      className={`${styles.row} ${selected ? styles.selected : ""}`}
      onClick={() => onSelect(card.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(card.id);
        }
      }}
    >
      <span><input type="checkbox" checked={bulkSelected} aria-label={`Выбрать карточку ${card.front}`} onClick={(event) => event.stopPropagation()} onChange={() => onToggleSelection?.(card.id)} /></span>
      <span title={card.front}>{card.front}</span>
      <span title={card.back}>{card.back}</span>
      <span className={styles.status}>
        <CardStatusBadge status={card.status} />
      </span>
      <span className={styles.actions}>
        {card.status === "ACTIVE" ? (
          <>
            <Button aria-label="Редактировать карточку" variant="ghost" onClick={(e) => act(e, onEdit)}>
              <EditIcon />
            </Button>
            <Button aria-label="Архивировать карточку" variant="ghost" onClick={(e) => act(e, onArchive)}>
              <ArchiveIcon />
            </Button>
          </>
        ) : (
          <Button aria-label="Восстановить карточку" variant="ghost" onClick={(e) => act(e, onRestore)}>
            <RestoreIcon />
          </Button>
        )}
      </span>
    </div>
  );
}
