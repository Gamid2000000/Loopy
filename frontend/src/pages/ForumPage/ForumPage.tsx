import { Link } from "react-router-dom";
import { ForumLayout } from "../../components/layout/ForumLayout";
import { PageHeader } from "../../components/layout/PageHeader";
import { Card } from "../../components/ui/Card";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useForumCategories } from "../../hooks/useForumCategories";
import { useDocumentMetadata } from "../../hooks/useDocumentMetadata";
import { formatDateTime } from "../../utils/formatDateTime";
import styles from "./ForumPage.module.css";

export function ForumPage() {
  const { data, status, retry } = useForumCategories();
  useDocumentMetadata("Форум — Loopy", "Обсуждения изучения языков и Loopy.");

  return (
    <ForumLayout>
      <div className={`page ${styles.page}`}>
        <PageHeader title="Сообщество Loopy" subtitle="Обсуждайте изучение языков, колоды, новые функции и развитие Loopy." />
        {status === "loading" && <div className={styles.grid}>{[1, 2, 3, 4].map((item) => <Skeleton key={item} height="150px" />)}</div>}
        {status === "error" && <ErrorState message="Не удалось загрузить категории форума" onRetry={() => void retry()} />}
        {status === "success" && data?.length === 0 && <EmptyState title="Категории форума пока недоступны" description="Загляните позже." />}
        {data && data.length > 0 && (
          <div className={styles.grid}>
            {data.map((category) => (
              <Link key={category.id} className={styles.category} to={`/forum/categories/${encodeURIComponent(category.slug)}`}>
                <Card>
                  <h2>{category.name}</h2>
                  {category.description && <p>{category.description}</p>}
                  <footer>
                    <span>{category.topicsCount} тем</span>
                    <span>{category.lastActivityAt ? formatDateTime(category.lastActivityAt) : "Нет активности"}</span>
                  </footer>
                </Card>
              </Link>
            ))}
          </div>
        )}
        <Card>
          <h2>Правила общения</h2>
          <p>Будьте доброжелательными, уважайте других участников и не публикуйте личные данные.</p>
        </Card>
      </div>
    </ForumLayout>
  );
}
