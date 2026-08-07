import type { ReactNode } from "react";
import { Card } from "../../ui/Card";
import { Button } from "../../ui/Button";
import type { ForumPost } from "../../../types/forum";
import { formatDateTime } from "../../../utils/formatDateTime";
import styles from "./ForumPostCard.module.css";

type ForumPostCardProps = {
  post: ForumPost;
  highlighted?: boolean;
  variant?: "topic" | "reply";
  isOwner?: boolean;
  isFirstPost?: boolean;
  isLocked?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  editing?: boolean;
  editForm?: ReactNode;
};

const initials = (username: string) => username.slice(0, 2).toUpperCase();

export function ForumPostCard({
  post,
  highlighted = false,
  variant = "reply",
  isOwner = false,
  isFirstPost = false,
  isLocked = false,
  onEdit,
  onDelete,
  editing = false,
  editForm,
}: ForumPostCardProps) {
  const isTopic = variant === "topic";
  const showActions = isOwner && !isLocked && !editing;
  const showEdit = showActions;
  const showDelete = showActions && !isFirstPost;

  if (editing && editForm) {
    return (
      <Card className={`${styles.card} ${isTopic ? styles.topic : styles.reply}`}>
        <article id={`post-${post.id}`}>
          <aside className={styles.author}>
            <span className={styles.avatar} aria-hidden="true">
              {initials(post.author.username)}
            </span>
            <strong>{post.author.username}</strong>
            <span className={styles.role}>
              {isTopic ? "Автор темы" : "Участник"}
            </span>
          </aside>
          <div className={styles.body}>
            {editForm}
          </div>
        </article>
      </Card>
    );
  }

  return (
    <Card
      className={`${styles.card} ${isTopic ? styles.topic : styles.reply} ${highlighted ? styles.highlighted : ""}`}
    >
      <article id={`post-${post.id}`}>
        <aside className={styles.author}>
          <span className={styles.avatar} aria-hidden="true">
            {initials(post.author.username)}
          </span>
          <strong>{post.author.username}</strong>
          <span className={styles.role}>
            {isTopic
              ? "Автор темы"
              : "Участник"}
          </span>
        </aside>
        <div className={styles.body}>
          <header className={styles.header}>
            <span>
              {formatDateTime(post.createdAt)}
              {post.edited ? " · Изменено" : ""}
            </span>
            <span className={styles.headerRight}>
              {isTopic && (
                <span className={styles.topicLabel}>{"Вопрос темы"}</span>
              )}
              {showEdit && (
                <Button
                  variant="ghost"
                  onClick={onEdit}
                  aria-label="Редактировать сообщение"
                >
                  Редактировать
                </Button>
              )}
              {showDelete && (
                <Button
                  variant="ghost"
                  onClick={onDelete}
                  aria-label="Удалить сообщение"
                >
                  Удалить
                </Button>
              )}
            </span>
          </header>
          <p className={styles.content}>{post.content}</p>
        </div>
      </article>
    </Card>
  );
}
