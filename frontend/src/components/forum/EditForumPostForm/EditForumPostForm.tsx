import { useRef, useEffect } from "react";
import { Button } from "../../ui/Button";
import styles from "./EditForumPostForm.module.css";

export function EditForumPostForm({
  initialContent,
  loading,
  error,
  onSave,
  onCancel,
}: {
  initialContent: string;
  loading: boolean;
  error: string | null;
  onSave: (content: string) => void;
  onCancel: () => void;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textarea.current?.focus();
  }, []);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const content = (data.get("content") as string).toString();
    onSave(content);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  };

  return (
    <form className={styles.form} onSubmit={submit}>
      <textarea
        ref={textarea}
        className={styles.textarea}
        name="content"
        defaultValue={initialContent}
        minLength={10}
        maxLength={10000}
        required
        rows={6}
        onKeyDown={handleKeyDown}
        aria-invalid={Boolean(error)}
        aria-label="Редактировать сообщение"
      />
      {error && <small className={styles.error} role="alert">{error}</small>}
      <div className={styles.actions}>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={loading}>
          Отмена
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          Сохранить
        </Button>
      </div>
    </form>
  );
}
