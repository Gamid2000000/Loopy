import { Modal } from "../../ui/Modal";
import { Input } from "../../ui/Input";
import { Button } from "../../ui/Button";

export function EditForumTopicDialog({
  initialTitle,
  loading,
  error,
  onSave,
  onClose,
}: {
  initialTitle: string;
  loading: boolean;
  error: string | null;
  onSave: (title: string) => void;
  onClose: () => void;
}) {
  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const title = (data.get("title") as string).trim();
    onSave(title);
  };

  return (
    <Modal title="Редактировать тему" onClose={onClose} busy={loading}>
      <form onSubmit={submit}>
        <Input
          name="title"
          label="Название темы"
          defaultValue={initialTitle}
          minLength={5}
          maxLength={160}
          required
          error={error ?? undefined}
        />
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={loading}>
            Отмена
          </Button>
          <Button type="submit" variant="primary" loading={loading}>
            Сохранить
          </Button>
        </div>
      </form>
    </Modal>
  );
}
