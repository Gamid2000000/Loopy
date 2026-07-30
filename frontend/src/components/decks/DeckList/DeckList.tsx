import type { DeckSummaryResponse } from "../../../types/deck";
import { DeckListItem } from "../DeckListItem";
import styles from "./DeckList.module.css";
export function DeckList({
  decks,
  selectedId,
  onSelect,
  onEdit,
  onArchive,
  onRestore,
  onStudy,
}: {
  decks: DeckSummaryResponse[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  onEdit: (deck: DeckSummaryResponse) => void;
  onArchive: (deck: DeckSummaryResponse) => void;
  onRestore: (deck: DeckSummaryResponse) => void;
  onStudy: (deck: DeckSummaryResponse) => void;
}) {
  return (
    <ul className={styles.list} aria-label="Список колод">
      {decks.map((deck) => (
        <DeckListItem
          key={deck.id}
          deck={deck}
          selected={deck.id === selectedId}
          onSelect={() => onSelect(deck.id)}
          onEdit={() => onEdit(deck)}
          onArchive={() => onArchive(deck)}
          onRestore={() => onRestore(deck)}
          onStudy={() => onStudy(deck)}
        />
      ))}
    </ul>
  );
}
