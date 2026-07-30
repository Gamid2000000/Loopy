import { Modal } from "../../ui/Modal";
import { DeckForm } from "../DeckForm";
import type { DeckResponse, UpdateDeckRequest } from "../../../types/deck";
export function EditDeckModal({
  deck,
  loading,
  error,
  onClose,
  onSave,
}: {
  deck: DeckResponse;
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onSave: (request: UpdateDeckRequest) => void;
}) {
  return (
    <Modal title="Редактировать колоду" onClose={onClose} busy={loading}>
      <DeckForm
        initial={{ name: deck.name, description: deck.description ?? "" }}
        submitLabel="Сохранить"
        loading={loading}
        serverError={error}
        onSubmit={(request) => {
          const patch: UpdateDeckRequest = {};
          if (request.name !== deck.name) patch.name = request.name;
          if ((request.description ?? null) !== deck.description) patch.description = request.description ?? null;
          onSave(patch);
        }}
        onCancel={onClose}
      />
    </Modal>
  );
}
