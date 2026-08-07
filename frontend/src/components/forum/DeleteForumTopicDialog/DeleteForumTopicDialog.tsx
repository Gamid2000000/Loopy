import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";

export function DeleteForumTopicDialog({
  loading,
  onConfirm,
  onClose,
}: {
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Удалить тему?" onClose={onClose} busy={loading}>
      <p>Тема и все её сообщения перестанут быть доступны другим пользователям.</p>
      <p>Это действие нельзя отменить.</p>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
          Удалить тему
        </Button>
      </div>
    </Modal>
  );
}
