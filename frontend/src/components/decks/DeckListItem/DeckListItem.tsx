import { useState } from "react";
import { IconButton } from "../../ui/IconButton";
import { MoreIcon } from "../../icons/DeckActionIcons";
import { DeckStatusBadge } from "../DeckStatusBadge";
import type { DeckSummaryResponse } from "../../../types/deck";
import styles from "./DeckListItem.module.css";
export function DeckListItem({
  deck,
  selected,
  onSelect,
  onEdit,
  onArchive,
  onRestore,
  onStudy,
}: {
  deck: DeckSummaryResponse;
  selected: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
  onStudy: () => void;
}) {
  const [menu, setMenu] = useState(false);
  return (
    <li className={`${styles.item} ${selected ? styles.selected : ""}`}>
      <button
        className={styles.select}
        type="button"
        aria-pressed={selected}
        onClick={onSelect}
        onKeyDown={(event) => {
          if (event.key === " ") {
            event.preventDefault();
            onSelect();
          }
        }}
      >
        <span className={styles.heading}>
          <strong>{deck.name}</strong>
          <DeckStatusBadge status={deck.status} />
        </span>
        {deck.description && <span className={styles.description}>{deck.description}</span>}
      </button>
      <div className={styles.actions}>
        <IconButton
          aria-label={`Действия: ${deck.name}`}
          aria-expanded={menu}
          onClick={(event) => {
            event.stopPropagation();
            setMenu(!menu);
          }}
        >
          <MoreIcon />
        </IconButton>
        {menu && (
          <div className={styles.menu} role="menu">
            {deck.status === "ACTIVE" ? (
              <>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    onStudy();
                  }}
                >
                  Начать занятие
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    onEdit();
                  }}
                >
                  Редактировать
                </button>
                <button
                  role="menuitem"
                  onClick={() => {
                    setMenu(false);
                    onArchive();
                  }}
                >
                  Архивировать
                </button>
              </>
            ) : (
              <button
                role="menuitem"
                onClick={() => {
                  setMenu(false);
                  onRestore();
                }}
              >
                Восстановить
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}
