import type { CardResponse, CardSummaryResponse } from "../../../types/card";
import { Button } from "../../ui/Button";
import { CardStatusBadge } from "../CardStatusBadge";
import styles from "./CardPreview.module.css";

const date = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

export function CardPreview({
  card,
  onEdit,
  onArchive,
  onRestore,
}: {
  card: CardResponse | CardSummaryResponse;
  onEdit: () => void;
  onArchive: () => void;
  onRestore: () => void;
}) {
  const detail = "example" in card ? card : null;

  return (
    <aside className={styles.preview} aria-label="Просмотр карточки">
      <CardStatusBadge status={card.status} />
      <h2>Лицевая сторона</h2>
      <p>{card.front}</p>
      <h2>Обратная сторона</h2>
      <p>{card.back}</p>
      {detail?.example && (
        <>
          <h2>Пример</h2>
          <p>{detail.example}</p>
        </>
      )}
      {detail?.note && (
        <>
          <h2>Заметка</h2>
          <p>{detail.note}</p>
        </>
      )}
      <dl>
        <div>
          <dt>Создана</dt>
          <dd>{date(card.createdAt)}</dd>
        </div>
        <div>
          <dt>Обновлена</dt>
          <dd>{date(card.updatedAt)}</dd>
        </div>
      </dl>
      <div className={styles.actions}>
        {card.status === "ACTIVE" ? (
          <>
            <Button variant="secondary" onClick={onEdit}>
              Редактировать
            </Button>
            <Button variant="danger" onClick={onArchive}>
              Архивировать
            </Button>
          </>
        ) : (
          <Button onClick={onRestore}>Восстановить</Button>
        )}
      </div>
    </aside>
  );
}
