import { useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { PublicLayout } from "../../components/layout/PublicLayout";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Textarea } from "../../components/ui/Textarea";
import { Badge } from "../../components/ui/Badge";
import { ForumBreadcrumbs } from "../../components/forum/ForumBreadcrumbs";
import { ForumPagination } from "../../components/forum/ForumPagination";
import { ForumPostCard } from "../../components/forum/ForumPostCard";
import { ForumAuthPrompt } from "../../components/forum/ForumAuthPrompt";
import { useForumTopic } from "../../hooks/useForumTopic";
import { useCreateForumPost } from "../../hooks/useCreateForumPost";
import { useAuth } from "../../context/AuthContext/useAuth";
import { useToast } from "../../components/ui/Toast/useToast";
import { useDocumentMetadata } from "../../hooks/useDocumentMetadata";
import { formatApiError } from "../../utils/formatApiError";
import styles from "./ForumTopicPage.module.css";
const parseId = (value: string | undefined) => {
  const id = Number(value);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
};
const parsePage = (value: string | null) => {
  const p = Number(value);
  return Number.isInteger(p) && p >= 0 ? p : 0;
};
// The response-triggered focus target is intentionally retained outside rendering.
// eslint-disable-next-line react-hooks/refs
export function ForumTopicPage() {
  const id = parseId(useParams().topicId);
  const [search, setSearch] = useSearchParams();
  const page = parsePage(search.get("page"));
  const { data: topic, status, error, retry } = useForumTopic(id, page);
  const { status: auth } = useAuth();
  const { create, pending } = useCreateForumPost();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const newPost = useRef<number | null>(null);
  useDocumentMetadata(`${topic?.title ?? "Тема"} — форум Loopy`, "Обсуждение в сообществе Loopy.");
  useEffect(() => {
    if (newPost.current) document.getElementById(`post-${newPost.current}`)?.focus();
  }, [topic]);
  if (!id)
    return (
      <PublicLayout>
        <div className="page">
          <ErrorState message="Тема форума не найдена" />
        </div>
      </PublicLayout>
    );
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (content.trim().length < 10 || content.trim().length > 10000) {
      setFormError("Текст сообщения должен содержать от 10 до 10 000 символов");
      return;
    }
    try {
      const result = await create(id as number, { content });
      newPost.current = result.postId;
      setContent("");
      const last = Math.max(0, Math.ceil(result.postsCount / 20) - 1);
      setSearch(last ? { page: String(last) } : {});
      void retry();
      showToast("Ответ опубликован", "success");
    } catch (reason) {
      setFormError(formatApiError(reason));
      if ((reason as { code?: string }).code === "FORUM_TOPIC_LOCKED") void retry();
    }
  }
  const returnTo = `/forum/topics/${id}${page ? `?page=${page}` : ""}`;
  return (
    <PublicLayout>
      <div className={`page ${styles.page}`}>
        <ForumBreadcrumbs
          items={[
            { label: "Форум", to: "/forum" },
            ...(topic
              ? [{ label: topic.category.name, to: `/forum/categories/${topic.category.slug}` }, { label: topic.title }]
              : []),
          ]}
        />
        {status === "loading" && <Skeleton height="300px" />}
        {status === "error" && (
          <ErrorState
            message={error?.code === "FORUM_TOPIC_NOT_FOUND" ? "Тема форума не найдена" : "Не удалось загрузить тему"}
            onRetry={() => void retry()}
          />
        )}
        {topic && (
          <>
            <PageHeader
              title={topic.title}
              subtitle={`Автор: ${topic.author.username} · ${topic.postsCount} сообщений`}
            />
            {topic.pinned && <Badge>Закреплено</Badge>}
            {topic.locked && <Badge>Закрыто</Badge>}
            <section className={styles.posts} aria-label="Сообщения темы">
              {topic.posts.content.map((post, index) => (
                <ForumPostCard
                  key={post.id}
                  post={post}
                  variant={page === 0 && index === 0 ? "topic" : "reply"}
                  highlighted={post.id === newPost.current}
                />
              ))}
            </section>
            <ForumPagination
              page={page}
              data={topic.posts}
              onChange={(next) => setSearch(next ? { page: String(next) } : {})}
            />
            {topic.locked ? (
              <Card>
                <strong>Тема закрыта для новых ответов</strong>
              </Card>
            ) : auth === "authenticated" ? (
              <form onSubmit={submit} className={styles.reply}>
                <h2>Ваш ответ</h2>
                <Textarea
                  label="Текст сообщения"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  error={formError ?? undefined}
                  rows={7}
                />
                <small>{content.length}/10 000</small>
                <Button type="submit" loading={pending}>
                  Отправить
                </Button>
              </form>
            ) : (
              <ForumAuthPrompt returnTo={returnTo}>Войдите, чтобы ответить в этой теме</ForumAuthPrompt>
            )}
          </>
        )}
      </div>
    </PublicLayout>
  );
}
