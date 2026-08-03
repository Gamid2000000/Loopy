import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getActiveDecks } from "../../api/decksApi";
import { createStudySession, getActiveStudySession } from "../../api/studySessionsApi";
import { ApiError } from "../../api/apiError";
import { DeckGrid } from "../../components/decks/DeckGrid";
import { DecksSkeleton } from "../../components/decks/DecksSkeleton";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/layout/PageHeader";
import { RefreshIcon } from "../../components/icons/RefreshIcon";
import { useToast } from "../../components/ui/Toast/useToast";
import { useDeckCardCounts } from "../../hooks/useDeckCardCounts";
import { formatApiError } from "../../utils/formatApiError";
import type { DeckSummaryResponse } from "../../types/deck";

type LoadStatus = "idle" | "loading" | "success" | "error";

export function StudyEntryPage() {
  const [decks, setDecks] = useState<DeckSummaryResponse[]>([]);
  const [status, setStatus] = useState<LoadStatus>("idle");
  const [error, setError] = useState<ApiError | null>(null);
  const [studyDeckId, setStudyDeckId] = useState<number | null>(null);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const controller = useRef<AbortController | null>(null);
  // Количество карточек ("слов") в каждой колоде — показывается прямо на плитке,
  // ещё до того, как пользователь по ней нажмёт.
  const cardCounts = useDeckCardCounts(decks.map((deck) => deck.id));

  const loadDecks = useCallback(async () => {
    controller.current?.abort();
    const current = new AbortController();
    controller.current = current;
    setStatus("loading");
    setError(null);
    try {
      const result = await getActiveDecks(current.signal);
      setDecks(result);
      setStatus("success");
    } catch (reason) {
      if (reason instanceof DOMException && reason.name === "AbortError") return;
      setError(reason instanceof ApiError ? reason : new ApiError("HTTP_ERROR", "", 0));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadDecks());
    return () => controller.current?.abort();
  }, [loadDecks]);

  const startStudy = useCallback(
    async (deck: DeckSummaryResponse) => {
      if (deck.status !== "ACTIVE" || studyDeckId !== null) return;
      setStudyDeckId(deck.id);
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
        setStudyDeckId(null);
      }
    },
    [navigate, showToast, studyDeckId],
  );

  return (
    <main className="page">
      <PageHeader
        title="Начать занятие"
        subtitle={
          status === "success"
            ? `${decks.length} активных колод`
            : status === "loading"
              ? "Загрузка..."
              : "Выберите колоду для изучения"
        }
        action={
          <Button
            variant="ghost"
            disabled={status === "loading"}
            onClick={() => void loadDecks()}
            leftIcon={<RefreshIcon />}
          >
            Обновить
          </Button>
        }
      />

      {status === "loading" && decks.length === 0 && <DecksSkeleton />}

      {status === "error" && (
        <ErrorState message={formatApiError(error)} onRetry={() => void loadDecks()} />
      )}

      {status === "success" && decks.length === 0 && (
        <EmptyState
          title="У вас пока нет колод"
          description="Создайте колоду с карточками, чтобы начать занятие"
        />
      )}

      {decks.length > 0 && (
        // Клик по любой плитке колоды сразу запускает занятие — без выпадающих меню
        // и лишних кнопок. Пока идёт запуск (studyDeckId выставлен), нажатая плитка
        // показывает спиннер и блокируется от повторного клика.
        <DeckGrid
          decks={decks}
          cardCounts={cardCounts}
          busyId={studyDeckId}
          onTileClick={(deck) => void startStudy(deck)}
        />
      )}

      {decks.length > 0 && (
        <p style={{ marginTop: "var(--spacing-4)" }}>
          <Link to="/decks">
            <Button variant="secondary">Управление колодами</Button>
          </Link>
        </p>
      )}
    </main>
  );
}
