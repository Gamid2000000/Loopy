import { Link } from "react-router-dom";
import { Button } from "../../ui/Button";
import styles from "./StudyHeader.module.css";

export function StudyHeader({
  deckName,
  position,
  total,
  onCancel,
  disabled,
}: {
  deckName: string;
  position: number;
  total: number;
  onCancel: () => void;
  disabled: boolean;
}) {
  return (
    <header className={styles.header}>
      <Link className={styles.back} to={`/decks`}>
        ← Назад
      </Link>
      <strong className={styles.deckName}>{deckName}</strong>
      <span className={styles.position}>
        {position} / {total}
      </span>
      <Button className={styles.cancel} variant="ghost" onClick={onCancel} disabled={disabled}>
        Отменить занятие
      </Button>
    </header>
  );
}
