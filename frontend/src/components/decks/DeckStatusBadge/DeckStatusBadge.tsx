import type { DeckStatus } from "../../../types/deck";
import styles from "./DeckStatusBadge.module.css";
export function DeckStatusBadge({ status }: { status: DeckStatus }) {
  return (
    <span className={`${styles.badge} ${status === "ARCHIVED" ? styles.archived : styles.active}`}>
      {status === "ACTIVE" ? "Активная" : "В архиве"}
    </span>
  );
}
