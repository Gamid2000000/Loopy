import { Link } from "react-router-dom";
import { Button } from "../../ui/Button";
import { CardsIcon, PlusIcon, EditIcon, ArchiveIcon, RestoreIcon } from "../../icons/DeckActionIcons";
import { DeckStatusBadge } from "../DeckStatusBadge";
import type { DeckResponse } from "../../../types/deck";
import styles from "./DeckDetailsPanel.module.css";
const date = (value: string) =>
  new Intl.DateTimeFormat("ru-RU", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
export function DeckDetailsPanel({
  deck,
  onEdit,
  onArchive,
  onRestore,
  onStudy,
  studyLoading = false,
}: {
  deck: DeckResponse;
  onEdit?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onStudy?: () => void;
  studyLoading?: boolean;
}) {
  const active = deck.status === "ACTIVE";
  return (
    <aside className={styles.panel} aria-label="Сведения о колоде">
      <div className={styles.top}>
        <div>
          <DeckStatusBadge status={deck.status} />
          <h2>{deck.name}</h2>
        </div>
      </div>
      <p className={deck.description ? "" : styles.muted}>{deck.description ?? "Описание не добавлено"}</p>
      <dl className={styles.meta}>
        <div>
          <dt>Создана</dt>
          <dd>{date(deck.createdAt)}</dd>
        </div>
        <div>
          <dt>Обновлена</dt>
          <dd>{date(deck.updatedAt)}</dd>
        </div>
      </dl>
      <div className={styles.actions}>
        {active ? (
          <>
            {/* Главное быстрое действие: сразу открывает страницу карточек с формой
                заполнения новой карточки — не нужно сначала заходить в колоду, а потом
                искать там кнопку "Добавить карточку" */}
            <Link to={`/decks/${deck.id}/cards?new=1`}>
              <Button fullWidth leftIcon={<PlusIcon />}>
                Добавить карточку
              </Button>
            </Link>
            <Link to={`/decks/${deck.id}/cards`}>
              <Button variant="secondary" fullWidth leftIcon={<CardsIcon />}>
                Открыть карточки
              </Button>
            </Link>
            {onStudy && (
              <Button fullWidth onClick={onStudy} loading={studyLoading}>
                Начать занятие
              </Button>
            )}
            {onEdit && (
              <Button variant="secondary" fullWidth leftIcon={<EditIcon />} onClick={onEdit}>
                Редактировать
              </Button>
            )}
            {onArchive && (
              <Button variant="danger" fullWidth leftIcon={<ArchiveIcon />} onClick={onArchive}>
                Архивировать
              </Button>
            )}
          </>
        ) : (
          onRestore && (
            <Button fullWidth leftIcon={<RestoreIcon />} onClick={onRestore}>
              Восстановить
            </Button>
          )
        )}
      </div>
    </aside>
  );
}
