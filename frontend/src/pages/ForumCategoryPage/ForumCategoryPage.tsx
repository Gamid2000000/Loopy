import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ForumLayout } from "../../components/layout/ForumLayout";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { Badge } from "../../components/ui/Badge";
import { ForumBreadcrumbs } from "../../components/forum/ForumBreadcrumbs";
import { ForumPagination } from "../../components/forum/ForumPagination";
import { useForumTopics } from "../../hooks/useForumTopics";
import { useForumCategories } from "../../hooks/useForumCategories";
import { useAuth } from "../../context/AuthContext/useAuth";
import { formatDateTime } from "../../utils/formatDateTime";
import { useDocumentMetadata } from "../../hooks/useDocumentMetadata";
import styles from "./ForumCategoryPage.module.css";
const pageOf = (value: string | null) => {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 ? n : 0;
};
export function ForumCategoryPage() {
  const { categorySlug = "" } = useParams();
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const page = pageOf(search.get("page"));
  const valid = categorySlug.trim().length > 0;
  const { data, status, retry, error } = useForumTopics(categorySlug, page);
  const { data: categories } = useForumCategories();
  const { status: auth } = useAuth();
  const category = categories?.find((item) => item.slug === categorySlug);
  const returnTo = `/forum/categories/${encodeURIComponent(categorySlug)}/new`;
  useDocumentMetadata(`${category?.name ?? "Категория"} — форум Loopy`, "Темы сообщества Loopy.");
  if (!valid)
    return (
      <ForumLayout>
        <div className="page">
          <ErrorState message="Категория форума не найдена" />
        </div>
      </ForumLayout>
    );
  const create =
    auth === "authenticated" ? (
      <Button onClick={() => navigate(returnTo)}>Создать тему</Button>
    ) : (
      <Link className={styles.button} to="/login" state={{ returnTo }}>
        Войти, чтобы создать тему
      </Link>
    );
  return (
    <ForumLayout>
      <div className={`page ${styles.page}`}>
        <ForumBreadcrumbs items={[{ label: "Форум", to: "/forum" }, { label: category?.name ?? categorySlug }]} />
        <PageHeader
          title={category?.name ?? "Категория"}
          subtitle={category?.description ?? undefined}
          action={create}
        />
        {status === "loading" && <Skeleton height="200px" />}
        {status === "error" && (
          <ErrorState
            message={
              error?.code === "FORUM_CATEGORY_NOT_FOUND" ? "Категория форума не найдена" : "Не удалось загрузить темы"
            }
            onRetry={() => void retry()}
          />
        )}
        {data?.empty && (
          <>
            <EmptyState title="В этой категории пока нет тем" description="Начните обсуждение первым." />
            {create}
          </>
        )}
        {data && !data.empty && (
          <section className={styles.list} aria-label="Темы категории">
            {data.content.map((topic) => (
              <Link key={topic.id} to={`/forum/topics/${topic.id}`} className={styles.topic}>
                <Card>
                  <div>
                    <h2>{topic.title}</h2>
                    <p>
                      Автор: {topic.author.username} · {formatDateTime(topic.createdAt)}
                    </p>
                    {topic.pinned && <Badge>Закреплено</Badge>}
                    {topic.locked && <Badge>Закрыто</Badge>}
                  </div>
                  <aside>
                    <strong>{topic.postsCount}</strong>
                    <span>сообщений</span>
                    <small>{formatDateTime(topic.lastActivityAt)}</small>
                  </aside>
                </Card>
              </Link>
            ))}
          </section>
        )}
        {data && (
          <ForumPagination page={page} data={data} onChange={(next) => setSearch(next ? { page: String(next) } : {})} />
        )}
      </div>
    </ForumLayout>
  );
}
