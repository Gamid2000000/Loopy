import { useMemo, useState } from "react";
import { Button } from "../../ui/Button";
import { Input } from "../../ui/Input";
import { Textarea } from "../../ui/Textarea";
import type { CreateDeckRequest } from "../../../types/deck";
import styles from "./DeckForm.module.css";
export type DeckFormValues = { name: string; description: string };
export function DeckForm({
  initial = { name: "", description: "" },
  submitLabel,
  loading,
  serverError,
  onSubmit,
  onCancel,
}: {
  initial?: DeckFormValues;
  submitLabel: string;
  loading: boolean;
  serverError?: string | null;
  onSubmit: (request: CreateDeckRequest) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState(initial);
  const [submitted, setSubmitted] = useState(false);
  const name = values.name.trim();
  const errors = useMemo(
    () => ({
      name: !name ? "Введите название колоды" : name.length > 100 ? "Не более 100 символов" : "",
      description: values.description.trim().length > 1000 ? "Не более 1000 символов" : "",
    }),
    [name, values.description],
  );
  const valid = !errors.name && !errors.description;
  const dirty = values.name !== initial.name || values.description !== initial.description;
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const cancel = () => {
    if (dirty && !confirmDiscard) {
      setConfirmDiscard(true);
      return;
    }
    onCancel();
  };
  return (
    <form
      className={styles.form}
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (valid) onSubmit({ name, description: values.description.trim() || null });
      }}
    >
      <Input
        label="Название"
        required
        maxLength={101}
        value={values.name}
        onChange={(event) => setValues({ ...values, name: event.target.value })}
        error={submitted ? errors.name : undefined}
      />
      <Textarea
        label="Описание"
        maxLength={1001}
        value={values.description}
        onChange={(event) => setValues({ ...values, description: event.target.value })}
        error={submitted ? errors.description : undefined}
      />
      {serverError && (
        <p className={styles.error} role="alert">
          {serverError}
        </p>
      )}
      {confirmDiscard && (
        <p className={styles.warning}>Есть несохранённые изменения. Нажмите «Отменить» ещё раз, чтобы закрыть.</p>
      )}
      <div className={styles.buttons}>
        <Button type="button" variant="ghost" disabled={loading} onClick={cancel}>
          Отменить
        </Button>
        <Button type="submit" loading={loading} disabled={!valid || loading}>
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
