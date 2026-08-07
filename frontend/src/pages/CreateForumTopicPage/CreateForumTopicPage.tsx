import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ForumLayout } from "../../components/layout/ForumLayout";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../components/ui/Textarea";
import { ForumBreadcrumbs } from "../../components/forum/ForumBreadcrumbs";
import { useCreateForumTopic } from "../../hooks/useCreateForumTopic";
import { useDocumentMetadata } from "../../hooks/useDocumentMetadata";
import { formatApiError } from "../../utils/formatApiError";
import styles from "./CreateForumTopicPage.module.css";
export function CreateForumTopicPage() {
  const { categorySlug = "" } = useParams(); const navigate = useNavigate(); const { create, pending } = useCreateForumTopic(); const [title, setTitle] = useState(""); const [content, setContent] = useState(""); const [error, setError] = useState<string | null>(null);
  useDocumentMetadata("Новая тема — форум Loopy", "Создание темы на форуме Loopy.");
  useEffect(() => { const warn = (event: BeforeUnloadEvent) => { if (!pending && (title || content)) { event.preventDefault(); event.returnValue = ""; } }; window.addEventListener("beforeunload", warn); return () => window.removeEventListener("beforeunload", warn); }, [title, content, pending]);
  async function submit(event: FormEvent) { event.preventDefault(); if (title.trim().length < 5 || title.trim().length > 160 || content.trim().length < 10 || content.trim().length > 10000) { setError("Проверьте длину полей формы"); return; } try { const result = await create(categorySlug, { title, content }); navigate(`/forum/topics/${result.topicId}`); } catch (reason) { setError(formatApiError(reason)); } }
  if (!categorySlug.trim()) return <ForumLayout><div className="page"><p>Категория не найдена</p></div></ForumLayout>;
  return <ForumLayout><div className={`page ${styles.page}`}><ForumBreadcrumbs items={[{ label:"Форум", to:"/forum" }, { label: categorySlug, to:`/forum/categories/${categorySlug}` }, { label:"Новая тема" }]} /><PageHeader title="Новая тема" /><form onSubmit={submit} className={styles.form}><Input label="Название" value={title} onChange={(e) => setTitle(e.target.value)} required error={error ?? undefined} helperText={`${title.length}/160`} minLength={5} maxLength={160} /><Textarea label="Сообщение" value={content} onChange={(e) => setContent(e.target.value)} required error={error ?? undefined} rows={10} minLength={10} maxLength={10000} /><small>{content.length}/10 000</small>{error && <p role="alert">{error}</p>}<div><Button type="submit" loading={pending}>Создать тему</Button><Button type="button" variant="ghost" onClick={() => navigate(-1)}>Отмена</Button></div></form></div></ForumLayout>;
}
