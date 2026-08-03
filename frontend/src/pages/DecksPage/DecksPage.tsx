import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PageHeader } from "../../components/layout/PageHeader";
import { Button } from "../../components/ui/Button";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Skeleton } from "../../components/ui/Skeleton";
import { useToast } from "../../components/ui/Toast";
import { PlusIcon } from "../../components/icons/DeckActionIcons";
import { RefreshIcon } from "../../components/icons/RefreshIcon";
import { DeckGrid } from "../../components/decks/DeckGrid";
import { DeckDetailsPanel } from "../../components/decks/DeckDetailsPanel";
import { DecksSkeleton } from "../../components/decks/DecksSkeleton";
import { CreateDeckModal } from "../../components/decks/CreateDeckModal";
import { EditDeckModal } from "../../components/decks/EditDeckModal";
import { ArchiveDeckDialog } from "../../components/decks/ArchiveDeckDialog";
import { RestoreDeckDialog } from "../../components/decks/RestoreDeckDialog";
import { useDecks } from "../../hooks/useDecks";
import { useDeckCardCounts } from "../../hooks/useDeckCardCounts";
import type { CreateDeckRequest, DeckSummaryResponse, UpdateDeckRequest } from "../../types/deck";
import { formatApiError } from "../../utils/formatApiError";
import { ApiError } from "../../api/apiError";
import { createStudySession, getActiveStudySession } from "../../api/studySessionsApi";
import styles from "./DecksPage.module.css";
type Dialog = "create" | "edit" | "archive" | "restore" | null;
export function DecksPage() {
  const decks = useDecks();
  const { showToast } = useToast();
  const [dialog, setDialog] = useState<Dialog>(null);
  const [target, setTarget] = useState<DeckSummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [studyLoading, setStudyLoading] = useState(false);
  const navigate = useNavigate();
  const list = decks.tab === "ACTIVE" ? decks.activeDecks : decks.archivedDecks;
  const status = decks.tab === "ACTIVE" ? decks.activeStatus : decks.archivedStatus;
  const listError = decks.tab === "ACTIVE" ? decks.activeError : decks.archivedError;
  // Количество карточек ("слов") в каждой колоде текущей вкладки — показывается прямо
  // на плитке колоды, чтобы было видно объём колоды ещё до открытия.
  const cardCounts = useDeckCardCounts(list.map((deck) => deck.id));
  const close = () => {
    if (decks.mutationStatus !== "loading") {
      setDialog(null);
      setError(null);
    }
  };
  const create = async (request: CreateDeckRequest) => {
    setError(null);
    try {
      await decks.createDeck(request);
      close();
      showToast("Колода создана");
    } catch (reason) {
      setError(formatApiError(reason));
    }
  };
  const edit = async (request: UpdateDeckRequest) => {
    if (!decks.selectedDeck) return;
    setError(null);
    try {
      await decks.updateDeck(decks.selectedDeck.id, request);
      close();
      showToast("Изменения сохранены");
    } catch (reason) {
      setError(formatApiError(reason));
    }
  };
  const archive = async () => {
    if (!target) return;
    setError(null);
    try {
      await decks.archiveDeck(target.id);
      close();
      showToast("Колода архивирована");
    } catch (reason) {
      setError(formatApiError(reason));
    }
  };
  const restore = async () => {
    if (!target) return;
    setError(null);
    try {
      await decks.restoreDeck(target.id);
      close();
      showToast("Колода восстановлена");
    } catch (reason) {
      setError(formatApiError(reason));
    }
  };
  const startStudy = async (deck: DeckSummaryResponse) => {
    if (deck.status !== "ACTIVE" || studyLoading) return;
    setStudyLoading(true);
    try {
      const existing = await getActiveStudySession(deck.id);
      const session = existing ?? (await createStudySession(deck.id));
      navigate(`/study-sessions/${session.id}`);
    } catch (reason) {
      const apiError = reason instanceof ApiError ? reason : new ApiError("HTTP_ERROR", "", 0);
      showToast(
        apiError.code === "NO_CARDS_AVAILABLE"
          ? "Для этой колоды сейчас нет карточек для занятия"
          : formatApiError(apiError),
        "error",
      );
    } finally {
      setStudyLoading(false);
    }
  };
  return (
    <main className="page">
      <PageHeader
        title="Колоды"
        subtitle="Создавайте и организуйте наборы карточек"
        action={
          <Button leftIcon={<PlusIcon />} onClick={() => setDialog("create")}>
            Создать колоду
          </Button>
        }
      />
      <div className={styles.tabs} role="tablist" aria-label="Статус колод">
        <button role="tab" aria-selected={decks.tab === "ACTIVE"} onClick={() => decks.changeTab("ACTIVE")}>
          Активные
        </button>
        <button role="tab" aria-selected={decks.tab === "ARCHIVED"} onClick={() => decks.changeTab("ARCHIVED")}>
          Архивированные
        </button>
        <Button
          className={styles.refresh}
          variant="ghost"
          aria-label="Обновить список"
          onClick={() => void decks.reloadCurrentTab()}
          leftIcon={<RefreshIcon />}
        >
          Обновить
        </Button>
      </div>
      {status === "error" ? (
        <ErrorState message={formatApiError(listError)} onRetry={() => void decks.reloadCurrentTab()} />
      ) : (
        <div className={styles.layout}>
          <section>
            {status === "loading" && list.length === 0 ? (
              <DecksSkeleton />
            ) : list.length === 0 ? (
              <div className={styles.empty}>
                {decks.tab === "ACTIVE" ? (
                  <>
                    <EmptyState
                      title="У вас пока нет колод"
                      description="Создайте первую колоду, чтобы начать добавлять карточки"
                    />
                    <Button onClick={() => setDialog("create")}>Создать колоду</Button>
                  </>
                ) : (
                  <EmptyState title="Архив пуст" description="Архивированные колоды появятся здесь" />
                )}
              </div>
            ) : (
              <DeckGrid
                decks={list}
                cardCounts={cardCounts}
                selectedId={decks.selectedDeckId}
                onTileClick={(deck) => void decks.selectDeck(deck.id)}
              />
            )}
          </section>
          <section>
            {decks.selectedDeckStatus === "loading" && <Skeleton height="360px" />}
            {decks.selectedDeckStatus === "error" && (
              <ErrorState
                message={formatApiError(decks.selectedDeckError)}
                onRetry={() => decks.selectedDeckId && void decks.selectDeck(decks.selectedDeckId)}
              />
            )}
            {decks.selectedDeck && (
              <DeckDetailsPanel
                deck={decks.selectedDeck}
                onEdit={() => setDialog("edit")}
                onArchive={() => {
                  setTarget(decks.selectedDeck);
                  setDialog("archive");
                }}
                onRestore={() => {
                  setTarget(decks.selectedDeck);
                  setDialog("restore");
                }}
                onStudy={() => void startStudy(decks.selectedDeck!)}
              />
            )}
            {!decks.selectedDeck && decks.selectedDeckStatus === "idle" && (
              <div className={styles.placeholder}>Выберите колоду, чтобы увидеть подробности</div>
            )}
          </section>
        </div>
      )}
      {dialog === "create" && (
        <CreateDeckModal
          loading={decks.mutationStatus === "loading"}
          error={error}
          onClose={close}
          onCreate={(request) => void create(request)}
        />
      )}
      {dialog === "edit" && decks.selectedDeck && (
        <EditDeckModal
          deck={decks.selectedDeck}
          loading={decks.mutationStatus === "loading"}
          error={error}
          onClose={close}
          onSave={(request) => void edit(request)}
        />
      )}
      {dialog === "archive" && target && (
        <ArchiveDeckDialog
          deck={target}
          loading={decks.mutationStatus === "loading"}
          error={error}
          onClose={close}
          onConfirm={() => void archive()}
        />
      )}
      {dialog === "restore" && target && (
        <RestoreDeckDialog
          deck={target}
          loading={decks.mutationStatus === "loading"}
          error={error}
          onClose={close}
          onConfirm={() => void restore()}
        />
      )}
    </main>
  );
}
