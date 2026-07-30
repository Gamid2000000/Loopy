import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { paths } from "../../app/paths";
import { Button } from "../../components/ui/Button";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import { useToast } from "../../components/ui/Toast";
import { ArchiveCardDialog } from "../../components/cards/ArchiveCardDialog";
import { CardList } from "../../components/cards/CardList";
import { CardPreview } from "../../components/cards/CardPreview";
import { CardsPagination } from "../../components/cards/CardsPagination";
import { CardsSkeleton } from "../../components/cards/CardsSkeleton";
import { CreateCardModal } from "../../components/cards/CreateCardModal";
import { EditCardModal } from "../../components/cards/EditCardModal";
import { RestoreCardDialog } from "../../components/cards/RestoreCardDialog";
import { useCards } from "../../hooks/useCards";
import type { CreateCardRequest, UpdateCardRequest } from "../../types/card";
import { formatApiError } from "../../utils/formatApiError";
import styles from "./CardsPage.module.css";

type Dialog = "create" | "edit" | "archive" | "restore" | null;

export function CardsPage() {
  const { deckId } = useParams();
  const id = Number(deckId);
  const cards = useCards(Number.isSafeInteger(id) && id > 0 ? id : null);
  const { showToast } = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [dialogCardId, setDialogCardId] = useState<number | null>(null);
  const page = cards.tab === "ACTIVE" ? cards.active : cards.archived;
  const status = cards.tab === "ACTIVE" ? cards.activeStatus : cards.archivedStatus;
  const error = cards.tab === "ACTIVE" ? cards.activeError : cards.archivedError;
  const dialogMutation = dialog === "edit" ? "update" : dialog;
  const busy = dialogMutation !== null && cards.mutationStatus === "loading" && cards.mutationType === dialogMutation;
  const dialogError = cards.mutationType === dialogMutation ? formatApiError(cards.mutationError) : null;
  const closeDialog = () => {
    if (!busy) {
      setDialog(null);
      setDialogCardId(null);
    }
  };
  const openForCard = (type: Exclude<Dialog, "create" | null>, cardId: number) => {
    setDialogCardId(cardId);
    if (type === "edit") void cards.selectCard(cardId);
    setDialog(type);
  };
  const submitCreate = async (request: CreateCardRequest) => {
    try {
      await cards.createCard(request);
      setDialog(null);
      showToast("Карточка создана");
    } catch {
      /* error is rendered in modal */
    }
  };
  const submitUpdate = async (request: UpdateCardRequest) => {
    if (dialogCardId === null) return;
    try {
      await cards.updateCard(dialogCardId, request);
      setDialog(null);
      showToast("Карточка обновлена");
    } catch {
      /* error is rendered in modal */
    }
  };
  const submitArchive = async () => {
    if (dialogCardId === null) return;
    try {
      await cards.archiveCard(dialogCardId);
      setDialog(null);
      setDialogCardId(null);
      showToast("Карточка архивирована");
    } catch {
      /* error is rendered in dialog */
    }
  };
  const submitRestore = async () => {
    if (dialogCardId === null) return;
    try {
      await cards.restoreCard(dialogCardId);
      setDialog(null);
      setDialogCardId(null);
      showToast("Карточка восстановлена");
    } catch {
      /* error is rendered in dialog */
    }
  };
  const summary = page.content.find((card) => card.id === dialogCardId);
  const dialogFront = cards.selectedCard?.id === dialogCardId ? cards.selectedCard.front : (summary?.front ?? "");
  if (cards.deckStatus !== "success")
    return (
      <main className="page">
        {cards.deckStatus === "error" ? (
          <ErrorState message={formatApiError(cards.deckError)} onRetry={() => void cards.loadDeck()} />
        ) : (
          <CardsSkeleton />
        )}
      </main>
    );
  if (!cards.deck) return null;
  if (cards.deck.status === "ARCHIVED")
    return (
      <main className="page">
        <EmptyState title="Колода в архиве" description="Карточки недоступны, пока колода архивирована." />
        <Link className={styles.backLink} to={paths.decks}>
          Вернуться к колодам
        </Link>
      </main>
    );
  return (
    <main className="page">
      <div className={styles.headerActions}>
        <h1>Карточки</h1>
        <Button onClick={() => setDialog("create")}>Добавить карточку</Button>
        <Button variant="secondary" disabled={status === "loading"} onClick={() => void cards.reloadCurrentTab()}>
          Обновить
        </Button>
      </div>
      <p className={styles.deckName}>{cards.deck.name}</p>
      <div className={styles.tabs} role="tablist" aria-label="Статус карточек">
        <button role="tab" aria-selected={cards.tab === "ACTIVE"} onClick={() => cards.changeTab("ACTIVE")}>
          Активные
        </button>
        <button role="tab" aria-selected={cards.tab === "ARCHIVED"} onClick={() => cards.changeTab("ARCHIVED")}>
          Архив
        </button>
      </div>
      <div className={styles.layout}>
        <section>
          {status === "loading" && <CardsSkeleton />}
          {status === "error" && (
            <ErrorState message={formatApiError(error)} onRetry={() => void cards.reloadCurrentTab()} />
          )}
          {status === "success" && page.empty && (
            <EmptyState
              title={cards.tab === "ACTIVE" ? "Нет карточек" : "Архив пуст"}
              description={cards.tab === "ACTIVE" ? "В этой колоде пока нет карточек" : "В архиве нет карточек"}
            />
          )}
          {status === "success" && !page.empty && (
            <>
              <CardList
                cards={page.content}
                selectedId={cards.selectedCardId}
                onSelect={(cardId) => void cards.selectCard(cardId)}
                onEdit={(cardId) => openForCard("edit", cardId)}
                onArchive={(cardId) => openForCard("archive", cardId)}
                onRestore={(cardId) => openForCard("restore", cardId)}
              />
              <CardsPagination page={page} onPage={cards.changePage} onSize={cards.changePageSize} />
            </>
          )}
        </section>
        <section>
          {cards.selectedCardStatus === "loading" && <CardsSkeleton />}
          {cards.selectedCardError && (
            <ErrorState
              message={formatApiError(cards.selectedCardError)}
              onRetry={() => cards.selectedCardId && void cards.selectCard(cards.selectedCardId)}
            />
          )}
          {cards.selectedCard && (
            <CardPreview
              card={cards.selectedCard}
              onEdit={() => openForCard("edit", cards.selectedCard!.id)}
              onArchive={() => openForCard("archive", cards.selectedCard!.id)}
              onRestore={() => openForCard("restore", cards.selectedCard!.id)}
            />
          )}
        </section>
      </div>
      {dialog === "create" && (
        <CreateCardModal
          loading={busy}
          error={dialogError}
          onClose={closeDialog}
          onCreate={(request) => void submitCreate(request)}
        />
      )}
      {dialog === "edit" && cards.selectedCard?.id === dialogCardId && "example" in cards.selectedCard && (
        <EditCardModal
          card={cards.selectedCard}
          loading={busy}
          error={dialogError}
          onClose={closeDialog}
          onUpdate={(request) => void submitUpdate(request)}
        />
      )}
      {dialog === "archive" && (
        <ArchiveCardDialog
          front={dialogFront}
          loading={busy}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={() => void submitArchive()}
        />
      )}
      {dialog === "restore" && (
        <RestoreCardDialog
          front={dialogFront}
          loading={busy}
          error={dialogError}
          onClose={closeDialog}
          onConfirm={() => void submitRestore()}
        />
      )}
    </main>
  );
}
