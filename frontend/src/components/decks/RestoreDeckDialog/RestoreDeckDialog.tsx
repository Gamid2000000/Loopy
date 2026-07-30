import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import type { DeckSummaryResponse } from "../../../types/deck";
import styles from "./RestoreDeckDialog.module.css";
export function RestoreDeckDialog({
  deck,
  loading,
  error,
  onClose,
  onConfirm,
}: {
  deck: DeckSummaryResponse;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Восстановить колоду?" onClose={onClose} busy={loading}>
      <p>Колода «{deck.name}» снова станет активной.</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.buttons}>
        <Button variant="ghost" disabled={loading} onClick={onClose}>
          Отменить
        </Button>
        <Button loading={loading} onClick={onConfirm}>
          Восстановить
        </Button>
      </div>
    </Modal>
  );
}
