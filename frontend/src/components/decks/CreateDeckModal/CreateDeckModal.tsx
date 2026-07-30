import { Modal } from "../../ui/Modal";
import { DeckForm } from "../DeckForm";
import type { CreateDeckRequest } from "../../../types/deck";
export function CreateDeckModal({
  loading,
  error,
  onClose,
  onCreate,
}: {
  loading: boolean;
  error?: string | null;
  onClose: () => void;
  onCreate: (request: CreateDeckRequest) => void;
}) {
  return (
    <Modal title="Создать колоду" onClose={onClose} busy={loading}>
      <DeckForm submitLabel="Создать" loading={loading} serverError={error} onSubmit={onCreate} onCancel={onClose} />
    </Modal>
  );
}
