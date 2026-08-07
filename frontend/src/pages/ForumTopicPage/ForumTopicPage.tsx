import { useEffect, useState, type FormEvent, useRef } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { ForumLayout } from "../../components/layout/ForumLayout";
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
import { EditForumTopicDialog } from "../../components/forum/EditForumTopicDialog";
import { DeleteForumTopicDialog } from "../../components/forum/DeleteForumTopicDialog";
import { EditForumPostForm } from "../../components/forum/EditForumPostForm";
import { DeleteForumPostDialog } from "../../components/forum/DeleteForumPostDialog";
import { useForumTopic } from "../../hooks/useForumTopic";
import { useCreateForumPost } from "../../hooks/useCreateForumPost";
import { useAuth } from "../../context/AuthContext/useAuth";
import { useToast } from "../../components/ui/Toast/useToast";
import { useDocumentMetadata } from "../../hooks/useDocumentMetadata";
import { forumApi } from "../../api/forumApi";
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

export function ForumTopicPage() {
  const id = parseId(useParams().topicId);
  const [search, setSearch] = useSearchParams();
  const page = parsePage(search.get("page"));
  const navigate = useNavigate();
  const { data: topic, status, error, retry } = useForumTopic(id, page);
  const { status: auth, user: currentUser } = useAuth();
  const { create, pending: replyPending } = useCreateForumPost();
  const { showToast } = useToast();
  const [content, setContent] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const newPost = useRef<number | null>(null);

  const [showEditTopic, setShowEditTopic] = useState(false);
  const [editTopicError, setEditTopicError] = useState<string | null>(null);
  const [editTopicLoading, setEditTopicLoading] = useState(false);

  const [showDeleteTopic, setShowDeleteTopic] = useState(false);
  const [deleteTopicLoading, setDeleteTopicLoading] = useState(false);

  const [editingPostId, setEditingPostId] = useState<number | null>(null);
  const [editPostError, setEditPostError] = useState<string | null>(null);
  const [editPostLoading, setEditPostLoading] = useState(false);

  const [deletingPostId, setDeletingPostId] = useState<number | null>(null);
  const [deletePostLoading, setDeletePostLoading] = useState(false);

  const isOwner = currentUser !== null && topic !== null && currentUser.id === topic.author.id;

  useDocumentMetadata(`${topic?.title ?? "Тема"} — форум Loopy`, "Обсуждение в сообществе Loopy.");

  useEffect(() => {
    if (newPost.current) document.getElementById(`post-${newPost.current}`)?.focus();
  }, [topic]);

  if (!id)
    return (
      <ForumLayout>
        <div className="page">
          <ErrorState message="Тема форума не найдена" />
        </div>
      </ForumLayout>
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

  async function handleEditTopic(title: string) {
    if (!topic || !id) return;
    const trimmed = title.trim();
    if (trimmed.length < 5 || trimmed.length > 160) {
      setEditTopicError("Название темы должно содержать от 5 до 160 символов");
      return;
    }
    setEditTopicLoading(true);
    try {
      await forumApi.updateForumTopic(id, { title: trimmed, version: topic.version });
      setShowEditTopic(false);
      setEditTopicError(null);
      void retry();
      showToast("Тема обновлена", "success");
    } catch (reason) {
      setEditTopicError(formatApiError(reason));
      if ((reason as { code?: string }).code === "FORUM_CONTENT_VERSION_CONFLICT") void retry();
    } finally {
      setEditTopicLoading(false);
    }
  }

  async function handleDeleteTopic() {
    if (!topic || !id) return;
    setDeleteTopicLoading(true);
    try {
      await forumApi.deleteForumTopic(id, topic.version);
      setShowDeleteTopic(false);
      showToast("Тема удалена", "success");
      navigate(`/forum/categories/${topic.category.slug}`, { replace: true });
    } catch (reason) {
      showToast(formatApiError(reason), "error");
      if ((reason as { code?: string }).code === "FORUM_CONTENT_VERSION_CONFLICT") void retry();
    } finally {
      setDeleteTopicLoading(false);
    }
  }

  async function handleEditPost(postId: number, content: string) {
    const post = topic?.posts.content.find((p) => p.id === postId);
    if (!post) return;
    const trimmed = content.trim();
    if (trimmed.length < 10 || trimmed.length > 10000) {
      setEditPostError("Текст сообщения должен содержать от 10 до 10 000 символов");
      return;
    }
    setEditPostLoading(true);
    try {
      await forumApi.updateForumPost(postId, { content: trimmed, version: post.version });
      setEditingPostId(null);
      setEditPostError(null);
      void retry();
      showToast("Сообщение обновлено", "success");
    } catch (reason) {
      setEditPostError(formatApiError(reason));
      if ((reason as { code?: string }).code === "FORUM_CONTENT_VERSION_CONFLICT") void retry();
    } finally {
      setEditPostLoading(false);
    }
  }

  async function handleDeletePost(postId: number) {
    if (!topic) return;
    const currentTopic = topic;
    const post = currentTopic.posts.content.find((p) => p.id === postId);
    if (!post) return;
    setDeletePostLoading(true);
    try {
      await forumApi.deleteForumPost(postId, post.version);
      setDeletingPostId(null);
      showToast("Сообщение удалено", "success");

      if (currentTopic.posts.content.length <= 1 && page > 0) {
        setSearch({ page: String(page - 1) });
      }
      void retry();
    } catch (reason) {
      showToast(formatApiError(reason), "error");
      if ((reason as { code?: string }).code === "FORUM_CONTENT_VERSION_CONFLICT") void retry();
    } finally {
      setDeletePostLoading(false);
    }
  }

  const returnTo = `/forum/topics/${id}${page ? `?page=${page}` : ""}`;

  return (
    <ForumLayout>
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
            <div className={styles.headerRow}>
              <PageHeader
                title={topic.title}
                subtitle={`Автор: ${topic.author.username} · ${topic.postsCount} сообщений`}
              />
              {isOwner && !topic.locked && (
                <div className={styles.topicActions}>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setEditTopicError(null);
                      setShowEditTopic(true);
                    }}
                  >
                    Редактировать тему
                  </Button>
                  <Button variant="danger" onClick={() => setShowDeleteTopic(true)}>
                    Удалить тему
                  </Button>
                </div>
              )}
            </div>
            {topic.pinned && <Badge>Закреплено</Badge>}
            {topic.locked && <Badge>Закрыто</Badge>}
            <section className={styles.posts} aria-label="Сообщения темы">
              {topic.posts.content.map((post, index) => (
                <ForumPostCard
                  key={post.id}
                  post={post}
                  variant={page === 0 && index === 0 ? "topic" : "reply"}
                  highlighted={post.id === newPost.current}
                  isOwner={currentUser !== null && currentUser.id === post.author.id}
                  isFirstPost={post.id === topic.firstPostId}
                  isLocked={topic.locked}
                  editing={editingPostId === post.id}
                  onEdit={() => {
                    setEditPostError(null);
                    setEditingPostId(post.id);
                  }}
                  onDelete={() => setDeletingPostId(post.id)}
                  editForm={
                    editingPostId === post.id
                      ? (
                          <EditForumPostForm
                            initialContent={post.content}
                            loading={editPostLoading}
                            error={editPostError}
                            onSave={(content) => handleEditPost(post.id, content)}
                            onCancel={() => {
                              setEditingPostId(null);
                              setEditPostError(null);
                            }}
                          />
                        )
                      : undefined
                  }
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
                <Button type="submit" loading={replyPending}>
                  Отправить
                </Button>
              </form>
            ) : (
              <ForumAuthPrompt returnTo={returnTo}>Войдите, чтобы ответить в этой теме</ForumAuthPrompt>
            )}
          </>
        )}

        {showEditTopic && (
          <EditForumTopicDialog
            initialTitle={topic?.title ?? ""}
            loading={editTopicLoading}
            error={editTopicError}
            onSave={handleEditTopic}
            onClose={() => {
              setShowEditTopic(false);
              setEditTopicError(null);
            }}
          />
        )}
        {showDeleteTopic && (
          <DeleteForumTopicDialog
            loading={deleteTopicLoading}
            onConfirm={handleDeleteTopic}
            onClose={() => setShowDeleteTopic(false)}
          />
        )}
        {deletingPostId !== null && (
          <DeleteForumPostDialog
            loading={deletePostLoading}
            onConfirm={() => handleDeletePost(deletingPostId)}
            onClose={() => setDeletingPostId(null)}
          />
        )}
      </div>
    </ForumLayout>
  );
}
