import { Card } from "../../ui/Card";
import type { ForumPost } from "../../../types/forum";
import { formatDateTime } from "../../../utils/formatDateTime";
import styles from "./ForumPostCard.module.css";

type ForumPostCardProps = {
  post: ForumPost;
  highlighted?: boolean;
  variant?: "topic" | "reply";
};

const initials = (username: string) => username.slice(0, 2).toUpperCase();

export function ForumPostCard({ post, highlighted = false, variant = "reply" }: ForumPostCardProps) {
  const isTopic = variant === "topic";

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
              ? "\u0410\u0432\u0442\u043e\u0440 \u0442\u0435\u043c\u044b"
              : "\u0423\u0447\u0430\u0441\u0442\u043d\u0438\u043a"}
          </span>
        </aside>
        <div className={styles.body}>
          <header className={styles.header}>
            <span>
              {formatDateTime(post.createdAt)}
              {post.edited ? " \u00b7 \u0418\u0437\u043c\u0435\u043d\u0435\u043d\u043e" : ""}
            </span>
            {isTopic && (
              <span className={styles.topicLabel}>{"Вопрос темы"}</span>
            )}
          </header>
          <p className={styles.content}>{post.content}</p>
        </div>
      </article>
    </Card>
  );
}
