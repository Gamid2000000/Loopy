import { Modal } from "../../ui/Modal";
import { Button } from "../../ui/Button";

export function DeleteForumPostDialog({
  loading,
  onConfirm,
  onClose,
}: {
  loading: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Удалить сообщение?" onClose={onClose} busy={loading}>
      <p>Сообщение перестанет отображаться в теме.</p>
      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
        <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
          Отмена
        </Button>
        <Button type="button" variant="danger" onClick={onConfirm} loading={loading}>
          Удалить сообщение
        </Button>
      </div>
    </Modal>
  );
}
