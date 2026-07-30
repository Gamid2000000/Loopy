import { useMemo, useState } from "react";
import { Button } from "../../ui/Button";
import { Textarea } from "../../ui/Textarea";
import type { CreateCardRequest, UpdateCardRequest } from "../../../types/card";
import styles from "./CardEditorForm.module.css";

type Values = { front: string; back: string; example: string; note: string };
const initialValues: Values = { front: "", back: "", example: "", note: "" };
const normalizeOptional = (value: string) => value.trim() || null;

export function CardEditorForm({ initial = initialValues, loading, error, edit = false, onSubmit, onCancel }: { initial?: Values; loading: boolean; error?: string | null; edit?: boolean; onSubmit: (value: CreateCardRequest | UpdateCardRequest) => void; onCancel: () => void }) {
  const [values, setValues] = useState<Values>(initial);
  const [sent, setSent] = useState(false);
  const errors = useMemo(() => ({
    front: !values.front.trim() ? "Введите лицевую сторону" : values.front.trim().length > 500 ? "Не более 500 символов" : "",
    back: !values.back.trim() ? "Введите обратную сторону" : values.back.trim().length > 2000 ? "Не более 2000 символов" : "",
    example: values.example.trim().length > 3000 ? "Не более 3000 символов" : "",
    note: values.note.trim().length > 3000 ? "Не более 3000 символов" : "",
  }), [values]);
  const valid = !Object.values(errors).some(Boolean);
  const dirty = values.front.trim() !== initial.front.trim() || values.back.trim() !== initial.back.trim() || normalizeOptional(values.example) !== normalizeOptional(initial.example) || normalizeOptional(values.note) !== normalizeOptional(initial.note);
  const submit = () => {
    setSent(true); if (!valid || loading) return;
    if (!edit) { onSubmit({ front: values.front.trim(), back: values.back.trim(), example: normalizeOptional(values.example), note: normalizeOptional(values.note) }); return; }
    const request: UpdateCardRequest = {};
    if (values.front.trim() !== initial.front.trim()) request.front = values.front.trim();
    if (values.back.trim() !== initial.back.trim()) request.back = values.back.trim();
    if (normalizeOptional(values.example) !== normalizeOptional(initial.example)) request.example = normalizeOptional(values.example);
    if (normalizeOptional(values.note) !== normalizeOptional(initial.note)) request.note = normalizeOptional(values.note);
    onSubmit(request);
  };
  const field = (key: keyof Values, label: string, max: number) => <Textarea label={label} required={key === "front" || key === "back"} maxLength={max + 1} value={values[key]} onChange={(event) => setValues(value => ({ ...value, [key]: event.target.value }))} error={sent ? errors[key] : undefined} />;
  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); submit(); }}>
    {field("front", "Лицевая сторона", 500)}{field("back", "Обратная сторона", 2000)}{field("example", "Пример", 3000)}{field("note", "Заметка", 3000)}
    {error && <p className={styles.error} role="alert">{error}</p>}
    <div className={styles.actions}><Button type="button" variant="ghost" disabled={loading} onClick={onCancel}>Отмена</Button><Button type="submit" loading={loading} disabled={loading || !valid || (edit && !dirty)}>{edit ? "Сохранить" : "Создать"}</Button></div>
  </form>;
}
