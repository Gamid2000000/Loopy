import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";
import type { DeckSummaryResponse } from "../../../types/deck";
import styles from "./ArchiveDeckDialog.module.css";
export function ArchiveDeckDialog({
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
    <Modal title="Архивировать колоду?" onClose={onClose} busy={loading}>
      <p>Колода «{deck.name}» будет перенесена в архив. Карточки останутся сохранены.</p>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      <div className={styles.buttons}>
        <Button variant="ghost" disabled={loading} onClick={onClose}>
          Отменить
        </Button>
        <Button variant="danger" loading={loading} onClick={onConfirm}>
          Архивировать
        </Button>
      </div>
    </Modal>
  );
}
